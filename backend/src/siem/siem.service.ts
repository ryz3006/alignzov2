import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/services/logger.service';

// Conditional import for Elasticsearch
let Client: any;
try {
  const elasticsearch = require('@elastic/elasticsearch');
  Client = elasticsearch.Client;
} catch (error) {
  // Elasticsearch not installed, use mock
  Client = class MockClient {
    async index() { return { result: 'created' }; }
    async cluster() { return { health: () => ({ status: 'green' }) }; }
    async indices() { 
      return { 
        exists: () => true, 
        create: () => true, 
        stats: () => ({ indices: {} }) 
      }; 
    }
  };
}

@Injectable()
export class SiemService implements OnModuleInit {
  private readonly client: any;
  private readonly isEnabled: boolean;
  private readonly indexName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const elasticsearchUrl = this.configService.get<string>('ELASTICSEARCH_URL');
    this.isEnabled = !!elasticsearchUrl && elasticsearchUrl !== '';
    this.indexName = this.configService.get<string>('ELASTICSEARCH_AUDIT_INDEX', 'audit-logs');

    if (this.isEnabled) {
      this.client = new Client({
        node: elasticsearchUrl,
        auth: {
          username: this.configService.get<string>('ELASTICSEARCH_USERNAME', ''),
          password: this.configService.get<string>('ELASTICSEARCH_PASSWORD', ''),
        },
        requestTimeout: 10000,
        maxRetries: 3,
      });
    }
  }

  async onModuleInit() {
    if (this.isEnabled) {
      try {
        // Test connection and create index if needed
        await this.ensureIndexExists();
        this.logger.log('SIEM service connected to Elasticsearch successfully');
      } catch (error) {
        this.logger.warn(`Failed to initialize SIEM service: ${error.message}`);
      }
    } else {
      this.logger.log('SIEM service disabled - no Elasticsearch URL configured');
    }
  }

  async streamAuditLog(log: any): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug('SIEM streaming disabled, skipping audit log');
      return;
    }

    try {
      const enrichedLog = {
        ...log,
        '@timestamp': log.timestamp || new Date().toISOString(),
        service: 'alignzo',
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        version: this.configService.get<string>('APP_VERSION', '1.0.0'),
      };

      await this.client.index({
        index: this.indexName,
        body: enrichedLog,
      });

      this.logger.debug(`Audit log streamed to SIEM index ${this.indexName}`, {
        auditLogId: log.id,
        action: log.action,
        entity: log.entity,
      });
    } catch (error) {
      this.logger.error(`Failed to stream audit log to SIEM: ${error.message}`, error.stack, {
        auditLogId: log.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Ensure the audit logs index exists with proper mapping
   */
  private async ensureIndexExists(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                '@timestamp': { type: 'date' },
                id: { type: 'keyword' },
                userId: { type: 'keyword' },
                action: { type: 'keyword' },
                entity: { type: 'keyword' },
                entityId: { type: 'keyword' },
                ipAddress: { type: 'ip' },
                userAgent: { type: 'text', analyzer: 'standard' },
                sessionId: { type: 'keyword' },
                oldValues: { type: 'object', enabled: false },
                newValues: { type: 'object', enabled: false },
                metadata: { type: 'object', enabled: false },
                service: { type: 'keyword' },
                environment: { type: 'keyword' },
                version: { type: 'keyword' },
                timestamp: { type: 'date' },
              },
            },
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              'index.lifecycle.name': 'audit-logs-policy',
              'index.lifecycle.rollover_alias': 'audit-logs',
            },
          },
        });

        this.logger.log(`Created SIEM index: ${this.indexName}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to ensure SIEM index exists: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for SIEM service
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled) {
      return true; // Service is disabled, consider it healthy
    }

    try {
      const health = await this.client.cluster.health();
      return health.status === 'green' || health.status === 'yellow';
    } catch (error) {
      this.logger.warn(`SIEM health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get SIEM service status
   */
  async getStatus(): Promise<any> {
    if (!this.isEnabled) {
      return {
        enabled: false,
        status: 'disabled',
        message: 'SIEM service is disabled',
      };
    }

    try {
      const health = await this.client.cluster.health();
      const indexStats = await this.client.indices.stats({
        index: this.indexName,
      });

      return {
        enabled: true,
        status: health.status,
        cluster: {
          name: health.cluster_name,
          status: health.status,
          nodes: health.number_of_nodes,
        },
        index: {
          name: this.indexName,
          docs: indexStats.indices?.[this.indexName]?.total?.docs?.count || 0,
          size: indexStats.indices?.[this.indexName]?.total?.store?.size_in_bytes || 0,
        },
      };
    } catch (error) {
      return {
        enabled: true,
        status: 'error',
        error: error.message,
      };
    }
  }
}
