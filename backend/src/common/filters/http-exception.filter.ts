import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpErrorEnvelopeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp ? exception.message : 'Internal server error';

    const errorResponse = isHttp ? exception.getResponse() : undefined;

    const correlationId =
      (request.headers['x-correlation-id'] as string) || undefined;

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        details: typeof errorResponse === 'object' ? errorResponse : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.originalUrl || request.url,
        method: request.method,
        correlationId,
      },
    });
  }
}
