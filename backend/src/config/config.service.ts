import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { VaultService } from '../vault/vault.service';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

@Injectable()
export class ValidatedConfigService {
  private readonly env: AppEnv;

  constructor(private readonly vaultService: VaultService) {
    // Parse environment
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new Error(`Invalid environment configuration: ${issues}`);
    }
    this.env = parsed.data;

    // Best-effort secret loading from Vault; skip if not configured
    this.loadSecrets();
  }

  private async loadSecrets() {
    try {
      const hasVaultConfig = !!process.env.VAULT_ADDR && !!process.env.VAULT_TOKEN;
      if (!hasVaultConfig) {
        return; // Vault not configured in this environment
      }
      const secrets = await this.vaultService.readSecret('secret/data/alignzo');
      if (secrets && typeof secrets === 'object') {
        Object.assign(this.env, secrets);
      }
    } catch (error) {
      // Do not block application startup if Vault is unavailable
      // eslint-disable-next-line no-console
      console.warn('Vault secrets load skipped:', (error as Error)?.message || error);
    }
  }

  get<T extends keyof AppEnv>(key: T): AppEnv[T] {
    return this.env[key];
  }

  getUiConfig() {
    return {
      featureFlags: {
        newOnboardingFlow: true,
      },
      minAppVersion: '1.2.0',
    };
  }
}
