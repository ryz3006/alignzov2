import { Global, Module } from '@nestjs/common';
import { ValidatedConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { VaultModule } from '../vault/vault.module';

@Global()
@Module({
  imports: [VaultModule],
  providers: [ValidatedConfigService],
  controllers: [ConfigController],
  exports: [ValidatedConfigService],
})
export class AppConfigModule {}
