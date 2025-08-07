import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    const { name, description, leaderId, organizationId, memberIds } = createTeamDto;

    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    // Check if team name already exists in the organization
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        name,
        organizationId,
        isActive: true,
      },
    });

    if (existingTeam) {
      throw new ConflictException(`Team with name "${name}" already exists in this organization`);
    }

    // Verify that the leader exists and belongs to the organization
    const leader = await this.prisma.user.findFirst({
      where: {
        id: leaderId,
        isActive: true,
      },
    });

    if (!leader) {
      throw new NotFoundException(`User with ID ${leaderId} not found`);
    }

    // Create team with members in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const team = await prisma.team.create({
        data: {
          name,
          description,
          leaderId,
          organizationId,
          settings: {},
          isActive: true,
        },
      });

      // Add leader as a member if not already included
      const allMemberIds = memberIds || [];
      if (!allMemberIds.includes(leaderId)) {
        allMemberIds.push(leaderId);
      }

      // Add members
      if (allMemberIds.length > 0) {
        await Promise.all(
          allMemberIds.map((memberId) =>
            prisma.teamMember.create({
              data: {
                teamId: team.id,
                userId: memberId,
                role: memberId === leaderId ? 'lead' : 'member',
                isActive: true,
              },
            })
          )
        );
      }

      // Return team with all relations
      return prisma.team.findUnique({
        where: { id: team.id },
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      });
    });
  }

  async findAll(userId: string) {
    // Get user's organization and roles to determine access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is SUPER_ADMIN or ADMIN
    const isAdmin = user.userRoles.some(ur => 
      ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'ADMIN'
    );

    if (isAdmin) {
      // Admins can see all teams in their organization
      return this.prisma.team.findMany({
        where: {
          isActive: true,
        },
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Regular users can only see teams they're members of
      const userTeamIds = user.teamMembers.map(tm => tm.teamId);
      
      return this.prisma.team.findMany({
        where: {
          id: { in: userTeamIds },
          isActive: true,
        },
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  }

  async findOne(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!team || !team.isActive) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Check if user has access to this team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        teamMembers: {
          where: {
            teamId: id,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.userRoles.some(ur => 
      ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'ADMIN'
    );
    const isTeamMember = user.teamMembers.length > 0;

    if (!isAdmin && !isTeamMember) {
      throw new NotFoundException('Access denied');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id },
      include: {
        leader: true,
      },
    });

    if (!existingTeam || !existingTeam.isActive) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Check if user has permission to update this team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        teamMembers: {
          where: {
            teamId: id,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.userRoles.some(ur => 
      ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'ADMIN'
    );
    const isTeamLeader = existingTeam.leaderId === userId;
    const isTeamMember = user.teamMembers.length > 0;

    if (!isAdmin && !isTeamLeader) {
      throw new NotFoundException('Access denied');
    }

    // If name is being updated, check for conflicts
    if (updateTeamDto.name && updateTeamDto.name !== existingTeam.name) {
      const nameConflict = await this.prisma.team.findFirst({
        where: {
          name: updateTeamDto.name,
          organizationId: existingTeam.organizationId,
          id: { not: id },
          isActive: true,
        },
      });

      if (nameConflict) {
        throw new ConflictException(`Team with name "${updateTeamDto.name}" already exists in this organization`);
      }
    }

    // Prepare data for Prisma update
    const updateData: any = {};
    
    if (updateTeamDto.name !== undefined) {
      updateData.name = updateTeamDto.name;
    }
    
    if (updateTeamDto.description !== undefined) {
      updateData.description = updateTeamDto.description;
    }
    
    if (updateTeamDto.leaderId !== undefined) {
      updateData.leader = {
        connect: { id: updateTeamDto.leaderId }
      };
    }
    
    if (updateTeamDto.organizationId !== undefined) {
      updateData.organization = {
        connect: { id: updateTeamDto.organizationId }
      };
    }

    // Handle team members update if provided
    if (updateTeamDto.memberIds !== undefined) {
      // Get current team members
      const currentMembers = await this.prisma.teamMember.findMany({
        where: { teamId: id, isActive: true },
        select: { userId: true }
      });
      
      const currentMemberIds = currentMembers.map(m => m.userId);
      const newMemberIds = updateTeamDto.memberIds;
      
      // Members to add (in newMemberIds but not in currentMemberIds)
      const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
      
      // Members to remove (in currentMemberIds but not in newMemberIds)
      const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));
      
      // Add new members
      if (membersToAdd.length > 0) {
        updateData.members = {
          create: membersToAdd.map(memberId => ({
            userId: memberId,
            role: memberId === updateTeamDto.leaderId ? 'lead' : 'member',
            isActive: true
          }))
        };
      }
      
      // Remove members (soft delete by setting isActive to false)
      if (membersToRemove.length > 0) {
        await this.prisma.teamMember.updateMany({
          where: {
            teamId: id,
            userId: { in: membersToRemove }
          },
          data: { isActive: false }
        });
      }
    }

    return this.prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!existingTeam || !existingTeam.isActive) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Check if user has permission to delete this team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = user.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = user.userRoles.some(ur => ur.role.name === 'ADMIN');

    if (!isSuperAdmin && !isAdmin) {
      throw new NotFoundException('Access denied');
    }

    // Check if team has projects (teams with only the leader can be deleted)
    if (existingTeam._count.projects > 0) {
      throw new ConflictException('Cannot delete team with active projects');
    }

    // Check if team has members other than the leader
    const teamMembers = await this.prisma.teamMember.findMany({
      where: {
        teamId: id,
        isActive: true,
        userId: { not: existingTeam.leaderId }, // Exclude the leader
      },
    });

    if (teamMembers.length > 0) {
      throw new ConflictException('Cannot delete team with active members. Please remove all team members first.');
    }

    // Soft delete the team
    return this.prisma.team.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addMember(teamId: string, userId: string, requestingUserId: string) {
    // Check if team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || !team.isActive) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingMembership && existingMembership.isActive) {
      throw new ConflictException('User is already a member of this team');
    }

    // Check if requesting user has permission
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        teamMembers: {
          where: {
            teamId,
          },
        },
      },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    const isAdmin = requestingUser.userRoles.some(ur => 
      ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'ADMIN'
    );
    const isTeamLeader = team.leaderId === requestingUserId;

    if (!isAdmin && !isTeamLeader) {
      throw new NotFoundException('Access denied');
    }

    // Add user to team
    return this.prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      update: {
        isActive: true,
        leftAt: null,
      },
      create: {
        teamId,
        userId,
        role: 'member',
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(teamId: string, userId: string, requestingUserId: string) {
    // Check if team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || !team.isActive) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Check if membership exists
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new NotFoundException('User is not a member of this team');
    }

    // Check if requesting user has permission
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    const isAdmin = requestingUser.userRoles.some(ur => 
      ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'ADMIN'
    );
    const isTeamLeader = team.leaderId === requestingUserId;

    if (!isAdmin && !isTeamLeader) {
      throw new NotFoundException('Access denied');
    }

    // Remove user from team (soft delete)
    return this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }
} 