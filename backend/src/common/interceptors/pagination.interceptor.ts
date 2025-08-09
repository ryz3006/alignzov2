import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const limit = parseInt(request.query.limit as string, 10) || 20;

    return next.handle().pipe(
      map((data) => {
        if (!Array.isArray(data)) {
          return data;
        }

        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, limit) : data;
        const nextCursor = hasMore ? items[items.length - 1]?.id : null;

        return {
          items,
          meta: {
            total: data.length,
            perPage: limit,
            hasMore,
            nextCursor,
          },
        };
      }),
    );
  }
}
