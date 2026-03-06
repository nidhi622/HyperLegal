import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  API_ERROR_CODES,
  ApiErrorCode,
  mapHttpStatusToErrorCode,
} from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {

    console.log('exception: ', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ApiErrorCode = API_ERROR_CODES.INTERNAL;
    let message = 'Something went wrong.';
    let details: Array<Record<string, any>> = [];
    console.log("excpetion", exception);
    if (exception instanceof HttpException) {
      
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = mapHttpStatusToErrorCode(status);
      } else {
        const payload = exceptionResponse as Record<string, any>;
        const rawMessage = payload.message;

        if (Array.isArray(rawMessage)) {
          message = rawMessage[0] ?? 'Invalid input provided.';
          details = rawMessage.map((issue) => ({ issue }));
          code = API_ERROR_CODES.VALIDATION;
        } else if (payload.code && payload.message) {
          message = payload.message;
          code = payload.code as ApiErrorCode;
          details = Array.isArray(payload.details) ? payload.details : [];
        } else {
          message = rawMessage ?? payload.error ?? 'Request failed.';
          code = mapHttpStatusToErrorCode(status);
        }
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  }
}
