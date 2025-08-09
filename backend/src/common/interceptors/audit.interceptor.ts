import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuditProducerService } from '../../audit-logs/audit.producer.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly producerService: AuditProducerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const method = req?.method as string;
          if (
            !method ||
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) === false
          ) {
            return;
          }

          const auditMetadata = this.reflector.get<AuditMetadata>(
            AUDIT_METADATA_KEY,
            context.getHandler(),
          );

          const userId: string | undefined = req?.user?.id;
          const path: string = req?.originalUrl || req?.url;
          const userAgent: string | undefined = req?.get?.('user-agent');
          const ipAddress: string | undefined =
            req?.ip || req?.connection?.remoteAddress;
          const sessionId: string | undefined = req?.headers?.[
            'x-session-id'
          ] as string;

          let entityId: string | null = null;
          if (auditMetadata?.entityIdParam && req.params?.[auditMetadata.entityIdParam]) {
            entityId = req.params[auditMetadata.entityIdParam];
          } else if (data?.id) {
            // Fallback for POST requests where ID is in response body
            entityId = String(data.id);
          }

          setImmediate(async () => {
            try {
              await this.producerService.addToAuditLog({
                userId: userId || null,
                action: `${auditMetadata?.entity || 'http_request'}.${context.getHandler().name}`,
                entity: auditMetadata?.entity || 'http_request',
                entityId,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
                sessionId: sessionId || null,
                metadata: {
                  path,
                  statusCode: res.statusCode,
                  correlationId: req?.headers?.['x-correlation-id'] || null,
                  processingMs: Date.now() - now,
                },
              });
            } catch (err) {
              console.error('Failed to write to audit log:', err);
            }
          });
        },
        error: async (error) => {
          const method = req?.method as string;
          if (
            !method ||
            !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
          ) {
            return;
          }

          const auditMetadata = this.reflector.get<AuditMetadata>(
            AUDIT_METADATA_KEY,
            context.getHandler(),
          );

          const userId: string | undefined = req?.user?.id;
          const path: string = req?.originalUrl || req?.url;
          const userAgent: string | undefined = req?.get?.('user-agent');
          const ipAddress: string | undefined =
            req?.ip || req?.connection?.remoteAddress;
          const sessionId: string | undefined = req?.headers?.[
            'x-session-id'
          ] as string;

          setImmediate(async () => {
            try {
              await this.producerService.addToAuditLog({
                userId: userId || null,
                action: `failed:${auditMetadata?.entity || 'http_request'}.${context.getHandler().name}`,
                entity: auditMetadata?.entity || 'http_request',
                entityId: req.params?.[auditMetadata?.entityIdParam || ''] || null,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
                sessionId: sessionId || null,
                metadata: {
                  path,
                  statusCode: error.status || 500,
                  error: error.message,
                  correlationId: req?.headers?.['x-correlation-id'] || null,
                  processingMs: Date.now() - now,
                },
              });
            } catch (err) {
              console.error('Failed to write to audit log on error:', err);
            }
          });
        },
      }),
    );
  }
}
