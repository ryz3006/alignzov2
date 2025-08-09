import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ValidatedConfigService } from './config.service';

@ApiTags('Config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ValidatedConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get server-driven UI configuration' })
  getConfig() {
    return this.configService.getUiConfig();
  }
}
