import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    const { name, domain, logo } = createOrganizationDto;

    // Normalize domain (remove protocol and www if present)
    const normalizedDomain = this.normalizeDomain(domain);

    // Check if organization with this domain already exists
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        domain: normalizedDomain,
        isActive: true,
      },
    });

    if (existingOrg) {
      throw new ConflictException(`Organization with domain "${normalizedDomain}" already exists`);
    }

    return this.prisma.organization.create({
      data: {
        name,
        domain: normalizedDomain,
        logo,
        settings: {},
        isActive: true,
      },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
            teams: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
            teams: true,
            projects: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const { name, domain, logo } = updateOrganizationDto;

    // Check if organization exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // If domain is being updated, check for conflicts
    if (domain) {
      const normalizedDomain = this.normalizeDomain(domain);
      
      const conflictingOrg = await this.prisma.organization.findFirst({
        where: {
          domain: normalizedDomain,
          isActive: true,
          id: { not: id },
        },
      });

      if (conflictingOrg) {
        throw new ConflictException(`Organization with domain "${normalizedDomain}" already exists`);
      }

      updateOrganizationDto.domain = normalizedDomain;
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  async remove(id: string) {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            teams: true,
            projects: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check if organization has any users, teams, or projects
    if (organization._count.users > 0 || organization._count.teams > 0 || organization._count.projects > 0) {
      throw new BadRequestException(
        `Cannot delete organization. It has ${organization._count.users} users, ${organization._count.teams} teams, and ${organization._count.projects} projects.`
      );
    }

    return this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByDomain(domain: string) {
    const normalizedDomain = this.normalizeDomain(domain);
    
    return this.prisma.organization.findFirst({
      where: {
        domain: normalizedDomain,
        isActive: true,
      },
    });
  }

  async assignUserToOrganization(userId: string, organizationId: string) {
    // Check if user and organization exist
    const [user, organization] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.organization.findUnique({ where: { id: organizationId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId },
    });
  }

  async validateUserDomain(email: string) {
    const domain = this.extractDomain(email);
    const organization = await this.findByDomain(domain);
    
    return organization; // Return null if no organization found
  }

  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  }

  private extractDomain(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid email format');
    }
    return this.normalizeDomain(parts[1]);
  }
} 