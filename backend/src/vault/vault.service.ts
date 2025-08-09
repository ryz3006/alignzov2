import { Injectable } from '@nestjs/common';
import Vault from 'node-vault';

@Injectable()
export class VaultService {
  private readonly vault;

  constructor() {
    // Initialize only if Vault is configured; otherwise create a shim
    if (process.env.VAULT_ADDR && process.env.VAULT_TOKEN) {
      this.vault = Vault({
        apiVersion: 'v1',
        endpoint: process.env.VAULT_ADDR,
        token: process.env.VAULT_TOKEN,
      });
    } else {
      this.vault = null;
    }
  }

  async readSecret(path: string): Promise<any> {
    if (!this.vault) {
      return {};
    }
    const { data } = await this.vault.read(path);
    return data;
  }
}
