import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse,
  ApiBody 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceSessionsService } from './device-sessions.service';
import { Audit } from '../common/decorators/audit.decorator';

interface RecordSessionRequestDto {
  deviceId: string;
  platform?: string;
  appVersion?: string;
  deviceName?: string;
  osVersion?: string;
}

@ApiTags('Device Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/device-sessions')
export class DeviceSessionsController {
  constructor(private readonly deviceSessionsService: DeviceSessionsService) {}

  @Get('me')
  @ApiOperation({ summary: "Get current user's device sessions" })
  @ApiResponse({ 
    status: 200, 
    description: 'Device sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              deviceId: { type: 'string' },
              platform: { type: 'string' },
              appVersion: { type: 'string' },
              deviceName: { type: 'string' },
              osVersion: { type: 'string' },
              lastUsedAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' }
            }
          }
        }
      }
    }
  })
  async findMySessions(@Request() req) {
    const sessions = await this.deviceSessionsService.findUserSessions(req.user.id);
    return {
      success: true,
      data: sessions
    };
  }

  @Get('me/stats')
  @ApiOperation({ summary: "Get current user's device session statistics" })
  @ApiResponse({ 
    status: 200, 
    description: 'Device session stats retrieved successfully' 
  })
  async getMySessionStats(@Request() req) {
    const stats = await this.deviceSessionsService.getSessionStats(req.user.id);
    return {
      success: true,
      data: stats
    };
  }

  @Post('record')
  @Audit({ entity: 'DeviceSession' })
  @ApiOperation({ summary: 'Record or update a device session' })
  @ApiBody({
    description: 'Device session information',
    schema: {
      type: 'object',
      required: ['deviceId'],
      properties: {
        deviceId: { 
          type: 'string', 
          description: 'Unique device identifier',
          example: 'mobile-12345-abcdef'
        },
        platform: { 
          type: 'string', 
          description: 'Device platform',
          example: 'ios',
          enum: ['ios', 'android', 'web', 'desktop']
        },
        appVersion: { 
          type: 'string', 
          description: 'Application version',
          example: '1.2.3'
        },
        deviceName: { 
          type: 'string', 
          description: 'User-friendly device name',
          example: "John's iPhone"
        },
        osVersion: { 
          type: 'string', 
          description: 'Operating system version',
          example: 'iOS 17.1'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Device session recorded successfully' 
  })
  async recordSession(@Request() req, @Body() body: RecordSessionRequestDto) {
    const session = await this.deviceSessionsService.recordSession({
      userId: req.user.id,
      ...body
    });
    
    return {
      success: true,
      data: session,
      message: 'Device session recorded successfully'
    };
  }

  @Delete(':id')
  @Audit({ entity: 'DeviceSession', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific device session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Device session revoked successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Device session not found' 
  })
  async revokeSession(@Request() req, @Param('id') sessionId: string) {
    await this.deviceSessionsService.revokeSession(req.user.id, sessionId);
    return {
      success: true,
      message: 'Device session revoked successfully'
    };
  }

  @Delete('me/all')
  @Audit({ entity: 'DeviceSession' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all device sessions for current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'All device sessions revoked successfully' 
  })
  async revokeAllSessions(@Request() req) {
    const result = await this.deviceSessionsService.revokeAllSessions(req.user.id);
    return {
      success: true,
      data: { revokedCount: result.count },
      message: 'All device sessions revoked successfully'
    };
  }
}
