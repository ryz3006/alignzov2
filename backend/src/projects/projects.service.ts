import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PermissionService } from '../common/services/permission.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService, private permissionService: PermissionService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // Get the user's organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.organizationId) {
      throw new Error('User is not assigned to an organization');
    }

    const { teamIds, ...projectData } = createProjectDto;

    // Create project with team assignments in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          organizationId: user.organizationId as string,
          code: createProjectDto.code || this.generateProjectCode(createProjectDto.name),
        },
      });

      // Assign teams to project
      if (teamIds && teamIds.length > 0) {
        await Promise.all(
          teamIds.map((teamId) =>
            prisma.projectTeam.create({
              data: {
                projectId: project.id,
                teamId,
                isActive: true,
              },
            })
          )
        );
      }

      // Return project with all relations
      return prisma.project.findUnique({
        where: { id: project.id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll(userId: string, userRole: string) {
    const scope = await this.permissionService.getUserAccessScope(userId);

    // Determine requester's organization
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    let projects;

    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      // Admins and FULL_ACCESS users can see all projects within their organization
      projects = await this.prisma.project.findMany({
        where: {
          isActive: true,
          ...(requester?.organizationId ? { organizationId: requester.organizationId } : {}),
        },
        select: {
          id: true,
          name: true,
          description: true,
          code: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          budget: true,
          currency: true,
          clientName: true,
          ownerId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Enhanced fields for better work reporting and time tracking
          modules: true,
          taskCategories: true,
          workCategories: true,
          severityCategories: true,
          sourceCategories: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Regular users: see projects they own or are a member of
      projects = await this.prisma.project.findMany({
        where: {
          isActive: true,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  isActive: true,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          code: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          budget: true,
          currency: true,
          clientName: true,
          ownerId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Enhanced fields for better work reporting and time tracking
          modules: true,
          taskCategories: true,
          workCategories: true,
          severityCategories: true,
          sourceCategories: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return projects;
  }

  async findOne(id: string, userId: string, userRole: string) {
    const scope = await this.permissionService.getUserAccessScope(userId);
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    let project;

    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || scope.fullAccess) {
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
          ...(requester?.organizationId ? { organizationId: requester.organizationId } : {}),
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    } else {
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  isActive: true,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    }

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, userRole?: string) {
    // Check if user has permission to update this project
    let project;
    
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      // Super admins and admins can update any project
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
        },
      });
    } else {
      // Regular users can only update projects they own or have owner/manager role in
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  role: { in: ['owner', 'manager'] },
                  isActive: true,
                },
              },
            },
          ],
        },
      });
    }

    if (!project) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    const { teamIds, ...projectData } = updateProjectDto;

    // Update project with team assignments in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const updatedProject = await prisma.project.update({
        where: { id: id },
        data: projectData,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  leader: {
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

             // Update team assignments if teamIds is provided
       if (teamIds !== undefined) {
         // Get existing team assignments for this project
         const existingTeamAssignments = await prisma.projectTeam.findMany({
           where: { projectId: id },
         });

         // Create a set of existing team IDs for quick lookup
         const existingTeamIds = new Set(existingTeamAssignments.map(ta => ta.teamId));

         // Process team assignments
         if (teamIds && teamIds.length > 0) {
           for (const teamId of teamIds) {
             if (existingTeamIds.has(teamId)) {
               // Team already assigned, just activate it
               await prisma.projectTeam.updateMany({
                 where: {
                   projectId: id,
                   teamId: teamId,
                 },
                 data: { isActive: true },
               });
             } else {
               // New team assignment, create it
               await prisma.projectTeam.create({
                 data: {
                   projectId: id,
                   teamId,
                   isActive: true,
                 },
               });
             }
           }
         }

         // Deactivate teams that are no longer in the list
         const newTeamIds = new Set(teamIds || []);
         const teamsToDeactivate = existingTeamAssignments.filter(ta => !newTeamIds.has(ta.teamId));
         
         if (teamsToDeactivate.length > 0) {
           await prisma.projectTeam.updateMany({
             where: {
               id: { in: teamsToDeactivate.map(ta => ta.id) },
             },
             data: { isActive: false },
           });
         }

         // Return updated project with fresh team data
         return prisma.project.findUnique({
           where: { id: id },
           include: {
             owner: {
               select: {
                 id: true,
                 email: true,
                 firstName: true,
                 lastName: true,
               },
             },
             organization: {
               select: {
                 id: true,
                 name: true,
               },
             },
             teams: {
               include: {
                 team: {
                   select: {
                     id: true,
                     name: true,
                     description: true,
                     leader: {
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
             },
             members: {
               include: {
                 user: {
                   select: {
                     id: true,
                     email: true,
                     firstName: true,
                     lastName: true,
                   },
                 },
               },
             },
           },
         });
       }

      return updatedProject;
    });
  }

  async remove(id: string, userId: string, userRole?: string) {
    // Check if user has permission to delete this project
    let project;
    
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      // Super admins and admins can delete any project
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
        },
      });
    } else {
      // Regular users can only delete projects they own or have owner role in
      project = await this.prisma.project.findFirst({
        where: {
          id: id,
          isActive: true,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  role: 'owner',
                  isActive: true,
                },
              },
            },
          ],
        },
      });
    }

    if (!project) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }

    // Soft delete project and deactivate team assignments in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Soft delete the project
      await prisma.project.update({
        where: { id: id },
        data: { isActive: false },
      });

      // Deactivate all team assignments for this project
      await prisma.projectTeam.updateMany({
        where: { projectId: id },
        data: { isActive: false },
      });

      return { message: 'Project deleted successfully' };
    });
  }

  private generateProjectCode(name: string): string {
    // Generate a simple project code from the name
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    
    const timestamp = Date.now().toString().slice(-4);
    return `${code}${timestamp}`;
  }
} 