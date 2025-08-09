import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createHash } from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const etag = createHash('sha1')
          .update(JSON.stringify(data))
          .digest('hex');
        
        response.header('ETag', etag);

        if (request.headers['if-none-match'] === etag) {
          response.status(304);
          return;
        }

        return data;
      }),
    );
  }
}
