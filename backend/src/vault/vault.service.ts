import { Injectable } from '@nestjs/common';
import * as Vault from 'node-vault';

@Injectable()
export class VaultService {
  private readonly vault;

  constructor() {
    this.vault = Vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN,
    });
  }

  async readSecret(path: string): Promise<any> {
    const { data } = await this.vault.read(path);
    return data;
  }
}
