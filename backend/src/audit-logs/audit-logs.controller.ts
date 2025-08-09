import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async list(
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.auditLogs.findAll({
      take: take ? Number(take) : undefined,
      cursor: cursor || null,
      userId: userId || null,
      action: action || null,
      entity: entity || null,
    });
  }

  @Get('/me/activity')
  @ApiOperation({ summary: 'My recent activity' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async myActivity(
    @Req() req: any,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.auditLogs.findMine(req.user.id, {
      take: take ? Number(take) : undefined,
      cursor: cursor || null,
    });
  }
}
