import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DataScopeService } from '../common/services/data-scope.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private dataScopeService: DataScopeService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.organizationId) {
      throw new ForbiddenException(
        'User must belong to an organization to create a project.',
      );
    }
    const { teamIds, ...projectData } = createProjectDto;

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        organizationId: user.organizationId,
        ownerId: userId,
        code:
          createProjectDto.code ||
          this.generateProjectCode(createProjectDto.name),
      },
    });

    if (teamIds && teamIds.length > 0) {
      await this.prisma.projectTeam.createMany({
        data: teamIds.map((teamId) => ({
          projectId: project.id,
          teamId,
        })),
      });
    }

    return project;
  }

  async findAll(userId: string): Promise<Project[]> {
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(
      userId,
      'project',
    );

    const userOwnedOrMemberProjects: Prisma.ProjectWhereInput = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId: userId, isActive: true } } },
      ],
    };

    const finalWhere: Prisma.ProjectWhereInput = {
      OR: [whereScope, userOwnedOrMemberProjects],
      AND: [{ isActive: true }],
    };

    return this.prisma.project.findMany({
      where: finalWhere,
      include: {
        owner: true,
        organization: true,
        teams: { include: { team: { include: { leader: true } } } },
        members: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(
      userId,
      'project',
    );
    const finalWhere: Prisma.ProjectWhereInput = {
      AND: [whereScope, { id: id, isActive: true }],
    };

    const project = await this.prisma.project.findFirst({
      where: finalWhere,
      include: {
        owner: true,
        organization: true,
        teams: { include: { team: { include: { leader: true } } } },
        members: { include: { user: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have access',
      );
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    await this.findOne(id, userId); // Permission check
    const { teamIds, ...projectData } = updateProjectDto;

    return this.prisma.project.update({
      where: { id },
      data: projectData,
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id, userId); // Permission check

    await this.prisma.project.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Project deleted successfully' };
  }

  private generateProjectCode(name: string): string {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    const timestamp = Date.now().toString().slice(-4);
    return `${code}${timestamp}`;
  }
}
