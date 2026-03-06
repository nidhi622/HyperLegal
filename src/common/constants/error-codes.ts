import { HttpStatus } from '@nestjs/common';

export const API_ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  HTTP: 'HTTP_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export const mapHttpStatusToErrorCode = (status: number): ApiErrorCode => {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return API_ERROR_CODES.VALIDATION;
    case HttpStatus.NOT_FOUND:
      return API_ERROR_CODES.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return API_ERROR_CODES.CONFLICT;
    default:
      return API_ERROR_CODES.HTTP;
  }
};
