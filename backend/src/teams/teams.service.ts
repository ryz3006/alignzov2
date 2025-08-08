import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma, Team } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DataScopeService } from '../common/services/data-scope.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async create(createTeamDto: CreateTeamDto, requestingUserId: string): Promise<Team> {
    const { name, description, leaderId, memberIds } = createTeamDto;
    
    const requestingUser = await this.prisma.user.findUnique({ where: { id: requestingUserId }});
    if(!requestingUser || !requestingUser.organizationId) {
        throw new BadRequestException('Requesting user must belong to an organization.');
    }

    const team = await this.prisma.team.create({
      data: {
        name,
        description,
        leaderId,
        organizationId: requestingUser.organizationId,
      },
    });

    const allMemberIds = new Set(memberIds || []);
    allMemberIds.add(leaderId);

    await this.prisma.teamMember.createMany({
      data: Array.from(allMemberIds).map(userId => ({
        teamId: team.id,
        userId,
        role: userId === leaderId ? 'lead' : 'member',
      })),
    });

    return team;
  }

  async findAll(userId: string): Promise<Team[]> {
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(userId, 'team');
    
    const userOwnedOrMemberTeams: Prisma.TeamWhereInput = {
        OR: [
            { leaderId: userId },
            { members: { some: { userId: userId, isActive: true } } },
        ],
    };

    const finalWhere: Prisma.TeamWhereInput = {
        OR: [whereScope, userOwnedOrMemberTeams],
        AND: [{ isActive: true }],
    };

    return this.prisma.team.findMany({
      where: finalWhere,
      include: {
        leader: true,
        organization: true,
        members: { include: { user: true } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Team> {
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(userId, 'team');
    const finalWhere: Prisma.TeamWhereInput = {
        AND: [whereScope, { id: id, isActive: true }]
    };

    const team = await this.prisma.team.findFirst({
      where: finalWhere,
      include: {
        leader: true,
        organization: true,
        members: { include: { user: true } },
        projects: { include: { project: true } },
        _count: { select: { members: true, projects: true } },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found or you do not have access`);
    }
    
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string): Promise<Team> {
    await this.findOne(id, userId); // Permission check
    const { memberIds, ...teamData } = updateTeamDto;

    return this.prisma.team.update({
      where: { id },
      data: teamData,
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id, userId); // Permission check
    await this.prisma.team.update({ where: { id }, data: { isActive: false } });
    return { message: 'Team deleted successfully' };
  }

  async addMember(teamId: string, userId: string, requestingUserId: string): Promise<Team> {
    await this.findOne(teamId, requestingUserId); // Permission check
    await this.prisma.teamMember.upsert({
        where: { teamId_userId: { teamId, userId } },
        update: { isActive: true },
        create: { teamId, userId, role: 'member' },
    });
    return this.findOne(teamId, requestingUserId);
  }

  async removeMember(teamId: string, userId: string, requestingUserId: string): Promise<Team> {
    await this.findOne(teamId, requestingUserId); // Permission check
    await this.prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId } },
        data: { isActive: false },
    });
    return this.findOne(teamId, requestingUserId);
  }
}
