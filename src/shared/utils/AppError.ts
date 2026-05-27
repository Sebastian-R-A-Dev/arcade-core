import { HttpError } from '../constants/httpError.js';

export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number = HttpError.BAD_REQUEST) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
