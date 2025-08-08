import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type ResourceType = 'work-log' | 'project' | 'team' | 'user';

type WhereClauseMap = {
  'work-log': Prisma.WorkLogWhereInput;
  project: Prisma.ProjectWhereInput;
  team: Prisma.TeamWhereInput;
  user: Prisma.UserWhereInput;
};

@Injectable()
export class DataScopeService {
  constructor(private prisma: PrismaService) {}

  async getAccessScopeWhereClause<T extends ResourceType>(
    userId: string,
    resource: T,
  ): Promise<WhereClauseMap[T]> {
    const accessLevels = await this.prisma.userAccessLevel.findMany({
      where: { userId },
      select: { level: true },
    });

    const levels = new Set(accessLevels.map(al => al.level));

    if (levels.has('FULL_ACCESS') || levels.has('ORGANIZATION')) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
      if (user?.organizationId) {
        // Return resource-specific organization filters
        if (resource === 'work-log') {
          // WorkLog does not have organizationId; filter via related project
          return { project: { organizationId: user.organizationId } } as any;
        }
        if (resource === 'project' || resource === 'team' || resource === 'user') {
          return { organizationId: user.organizationId } as any;
        }
      }
      // Fallbacks when organization is missing
      if (resource === 'user') return { id: userId } as any;
      return { id: '-1' } as any;
    }

    const whereClauses: any[] = [];

    // This base clause is tricky because not all resources have a `userId` field.
    // The logic below handles this by creating resource-specific clauses.
    if (levels.has('INDIVIDUAL')) {
        if (resource === 'user') {
            whereClauses.push({ id: userId });
        } else if (resource === 'work-log' || resource === 'project' || resource === 'team') {
             // For these resources, individual access is implicitly handled
             // by being a member of a project or team, which is covered below.
        }
    }
    
    if (levels.has('TEAM')) {
      const teams = await this.prisma.team.findMany({
        where: { members: { some: { userId } } },
        select: { id: true, members: { select: { userId: true } } },
      });
      const teamIds = teams.map(t => t.id);
      const memberIds = teams.flatMap(t => t.members.map(m => m.userId));

      if (resource === 'team') {
        whereClauses.push({ id: { in: teamIds } });
      } else if (resource === 'user') {
        whereClauses.push({ id: { in: memberIds } });
      } else if (resource === 'work-log') {
        whereClauses.push({ userId: { in: memberIds } });
      } else if (resource === 'project') {
        const projectsInTeams = await this.prisma.project.findMany({
            where: { teams: { some: { teamId: { in: teamIds } } } },
            select: { id: true }
        });
        whereClauses.push({ id: { in: projectsInTeams.map(p => p.id) } });
      }
    }

    if (levels.has('PROJECT')) {
      const projects = await this.prisma.project.findMany({
        where: { members: { some: { userId } } },
        select: { id: true, members: { select: { userId: true } } },
      });
      const projectIds = projects.map(p => p.id);
      const memberIds = projects.flatMap(p => p.members.map(m => m.userId));

      if (resource === 'project') {
        whereClauses.push({ id: { in: projectIds } });
      } else if (resource === 'user') {
        whereClauses.push({ id: { in: memberIds } });
      } else if (resource === 'work-log') {
        whereClauses.push({ projectId: { in: projectIds } });
      }
    }

    if (whereClauses.length === 0) {
        // Default to seeing nothing if no access levels provide visibility
        // For most resources, this means they must be part of a team or project.
        if (resource === 'user') return { id: userId } as any; // Always see self
        return { id: '-1' } as any; // Return a condition that matches nothing
    }

    return { OR: whereClauses } as any;
  }
}
