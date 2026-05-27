/**
 * Códigos HTTP más usados en la API.
 * Uso: `new AppError('mensaje', HttpError.NOT_FOUND)` o `res.status(HttpError.CREATED)`.
 */
export const HttpError = {
  OK: 200,
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpErrorCode = (typeof HttpError)[keyof typeof HttpError];
