import { Prisma } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';

function uniqueViolationTargets(err: Prisma.PrismaClientKnownRequestError): string[] {
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return [];
}

export function rethrowUserWriteError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const targets = uniqueViolationTargets(err);
    if (targets.some((t) => t.includes('nickname') || t.includes('app_id_nickname'))) {
      throw new AppError('Nickname already taken in this app', HttpError.CONFLICT);
    }
    throw new AppError('Email already registered for this app', HttpError.CONFLICT);
  }
  throw err;
}
