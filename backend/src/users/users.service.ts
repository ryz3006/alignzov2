import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { PermissionService } from '../common/services/permission.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly permissionService: PermissionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const { teamIds, projectAssignments, ...userData } = createUserDto;

    // Map user to organization based on email domain
    let organizationId: string | null = null;
    try {
      const organization = await this.organizationsService.validateUserDomain(userData.email);
      if (organization) {
        organizationId = organization.id;
      }
    } catch (error) {
      // Log the error but don't fail user creation
      console.warn(`Failed to map user to organization: ${error.message}`);
    }

    // Create user with team and project assignments in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.displayName,
          avatar: userData.avatarUrl,
          phone: userData.phone,
          timezone: userData.timezone || 'UTC',
          locale: userData.locale || 'en-US',
          title: userData.title,
          department: userData.department,
          managerId: userData.managerId,
          organizationId,
          isActive: userData.isActive ?? true,
          emailVerifiedAt: userData.emailVerified ? new Date() : null,
        },
      });

      // Assign user to teams
      if (teamIds && teamIds.length > 0) {
        await Promise.all(
          teamIds.map((teamId) =>
            prisma.teamMember.create({
              data: {
                teamId,
                userId: user.id,
                role: 'member',
                isActive: true,
              },
            })
          )
        );
      }

      // Assign user to projects
      if (projectAssignments && projectAssignments.length > 0) {
        await Promise.all(
          projectAssignments.map((assignment) =>
            prisma.projectMember.create({
              data: {
                projectId: assignment.projectId,
                userId: user.id,
                role: assignment.role || 'member', // Use provided role or default to member
                reportingToId: assignment.reportingToId,
                isActive: true,
              },
            })
          )
        );
      }

      // Return user with all relations
      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subordinates: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
          teamMembers: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          projectMembers: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              reportingTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll(organizationId?: string, requestingUserId?: string) {
    // Base include selection for returned users
    const include = {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      subordinates: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      userRoles: {
        include: { role: true },
      },
      teamMembers: {
        include: {
          team: { select: { id: true, name: true, description: true } },
        },
      },
      projectMembers: {
        include: {
          project: { select: { id: true, name: true, code: true } },
          reportingTo: {
            select: { id: true, firstName: true, lastName: true, displayName: true },
          },
        },
      },
    } as const;

    // If no requester provided, apply optional org filter only
    if (!requestingUserId) {
      const where: any = organizationId
        ? { projectMembers: { some: { project: { organizationId } } } }
        : {};
      return this.prisma.user.findMany({ where, include });
    }

    // Get requester details
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { 
        organizationId: true,
        id: true,
        email: true 
      },
    });

    if (!requester) {
      return [];
    }

    // Build allowed user ids: always include self
    const allowedUserIds = new Set<string>([requestingUserId]);

    // Page-specific guard rule: Always include direct subordinates (users who report to requester)
    // Note: Since we don't track who created users, we focus on the management hierarchy

    // Always include direct subordinates (users who report to requester)
    const subordinates = await this.prisma.user.findMany({
      where: { managerId: requestingUserId },
      select: { id: true },
    });
    subordinates.forEach(s => allowedUserIds.add(s.id));

    // Get requester's access scope
    const scope = await this.permissionService.getUserAccessScope(requestingUserId);

    // For FULL_ACCESS users: include all users in their organization
    if (scope.fullAccess && requester.organizationId) {
      const orgUsers = await this.prisma.user.findMany({
        where: { 
          projectMembers: { 
            some: { 
              project: { organizationId: requester.organizationId } 
            } 
          } 
        },
        select: { id: true },
      });
      orgUsers.forEach(u => allowedUserIds.add(u.id));
    } else {
      // For non-FULL_ACCESS users: apply access level filtering
      
      // Team scope: include teammates
      if (scope.team) {
        const myTeamIds = await this.prisma.teamMember.findMany({
          where: { userId: requestingUserId, isActive: true },
          select: { teamId: true },
        });
        if (myTeamIds.length > 0) {
          const teammates = await this.prisma.teamMember.findMany({
            where: { teamId: { in: myTeamIds.map(t => t.teamId) }, isActive: true },
            select: { userId: true },
          });
          teammates.forEach(m => allowedUserIds.add(m.userId));
        }
      }

      // Project scope: include projectmates
      if (scope.project) {
        const myProjectIds = await this.prisma.projectMember.findMany({
          where: { userId: requestingUserId, isActive: true },
          select: { projectId: true },
        });
        if (myProjectIds.length > 0) {
          const projectMates = await this.prisma.projectMember.findMany({
            where: { projectId: { in: myProjectIds.map(p => p.projectId) }, isActive: true },
            select: { userId: true },
          });
          projectMates.forEach(m => allowedUserIds.add(m.userId));
        }
      }
    }

    return this.prisma.user.findMany({
      where: { id: { in: Array.from(allowedUserIds) } },
      include,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            reportingTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            reportingTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findFirst({
      where: {
        authProviders: {
          some: {
            provider: 'google',
            providerId: firebaseUid,
          },
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            reportingTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findById(id);

    // If email is being updated, check for conflicts
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const { teamIds, projectAssignments, ...userData } = updateUserDto;

    const updateData: any = {};
    
    if (userData.email) updateData.email = userData.email;
    if (userData.firstName) updateData.firstName = userData.firstName;
    if (userData.lastName) updateData.lastName = userData.lastName;
    if (userData.displayName) updateData.displayName = userData.displayName;
    if (userData.avatarUrl) updateData.avatar = userData.avatarUrl;
    if (userData.phone) updateData.phone = userData.phone;
    if (userData.timezone) updateData.timezone = userData.timezone;
    if (userData.locale) updateData.locale = userData.locale;
    if (userData.title) updateData.title = userData.title;
    if (userData.department) updateData.department = userData.department;
    if (userData.managerId !== undefined) updateData.managerId = userData.managerId;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
    if (userData.emailVerified) updateData.emailVerifiedAt = new Date();

    // Update user with team and project assignments in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Update basic user data
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Handle team assignments
      if (teamIds !== undefined) {
        // Remove existing team memberships
        await prisma.teamMember.deleteMany({
          where: { userId: id },
        });

        // Add new team memberships
        if (teamIds && teamIds.length > 0) {
          await Promise.all(
            teamIds.map((teamId) =>
              prisma.teamMember.create({
                data: {
                  teamId,
                  userId: id,
                  role: 'member',
                  isActive: true,
                },
              })
            )
          );
        }
      }

      // Handle project assignments
      if (projectAssignments !== undefined) {
        // Remove existing project memberships
        await prisma.projectMember.deleteMany({
          where: { userId: id },
        });

        // Add new project memberships
        if (projectAssignments && projectAssignments.length > 0) {
          await Promise.all(
            projectAssignments.map((assignment) =>
              prisma.projectMember.create({
                data: {
                  projectId: assignment.projectId,
                  userId: id,
                  role: assignment.role || 'member', // Use provided role or default to member
                  reportingToId: assignment.reportingToId,
                  isActive: true,
                },
              })
            )
          );
        }
      }

      // Return user with all relations
      return prisma.user.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subordinates: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
          teamMembers: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          projectMembers: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              reportingTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    // Check if user exists
    await this.findById(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async assignManager(userId: string, managerId: string) {
    // Check if both users exist
    await this.findById(userId);
    await this.findById(managerId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { managerId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            reportingTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async removeManager(userId: string) {
    // Check if user exists
    await this.findById(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { managerId: null },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getSubordinates(userId: string) {
    return this.prisma.user.findMany({
      where: { managerId: userId },
      include: {
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async searchUsers(query: string, organizationId?: string) {
    const where: any = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (organizationId) {
      where.projectMembers = {
        some: {
          project: {
            organizationId: organizationId
          }
        }
      };
    }

    return this.prisma.user.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async assignRole(userId: string, roleId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Remove all existing roles for this user
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign the new role
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        grantedAt: new Date(),
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    return userRole;
  }

  async removeRole(userId: string, roleId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to user
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException('Role is not assigned to this user');
    }

    // Remove the role
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: 'Role removed successfully' };
  }

  async getUserRoles(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user roles with permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to match the frontend expectations
    return userRoles.map(userRole => ({
      id: userRole.id,
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
        permissions: userRole.role.rolePermissions.map(rp => rp.permission),
      },
    }));
  }
} 