import { ApiErrorCode } from 'src/common/constants/error-codes';

export type ErrorDetail = Record<string, any>;

export type ApiSuccessResponse<T = any> = {
  success: true;
  message: string;
  data: T;
  // make structure, make meta :T
  meta: Record<string, any>;
  
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details: ErrorDetail[];
  };
};

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export const successResponse = <T = any>(
  message: string,
  data: T,
  meta: Record<string, any> = {},
): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data,
  meta,
});

export const errorResponse = (
  code: ApiErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): ApiErrorResponse => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
});
