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

    this.loadSecrets();
  }

  private async loadSecrets() {
    const secrets = await this.vaultService.readSecret('secret/data/alignzo');
    Object.assign(this.env, secrets);
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
