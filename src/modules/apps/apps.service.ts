import { Prisma, type App } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import type { AppDto } from './apps.types.js';
import { appsRepository } from './apps.repository.js';
import type { CreateAppBody, UpdateAppBody } from './apps.validation.js';
import { parseAbsoluteHttpUrl } from './apps.url.js';

/** Public base URL where the app is served (http/https only). */
export function validateAbsoluteHttpUrl(raw: string): string {
  try {
    return parseAbsoluteHttpUrl(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid app URL';
    throw new AppError(msg, HttpError.BAD_REQUEST);
  }
}

function toDto(app: App): AppDto {
  return {
    id: app.id,
    name: app.name,
    url: app.url,
    type: app.type,
    is_active: app.isActive,
    created_at: app.createdAt.toISOString(),
  };
}

export const appsService = {
  async createApp(payload: CreateAppBody): Promise<AppDto> {
    const url = validateAbsoluteHttpUrl(payload.url);

    const existingName = await appsRepository.findByName(payload.name);
    if (existingName) {
      throw new AppError('App name already exists', HttpError.CONFLICT);
    }

    const isActive = payload.is_active ?? true;
    try {
      const app = await appsRepository.create({
        name: payload.name,
        url,
        type: payload.type,
        isActive,
      });
      return toDto(app);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('App name already exists', HttpError.CONFLICT);
      }
      throw err;
    }
  },

  async listApps(): Promise<AppDto[]> {
    const apps = await appsRepository.findAll();
    return apps.map(toDto);
  },

  async updateApp(id: number, payload: UpdateAppBody): Promise<AppDto> {
    const existing = await appsRepository.findById(id);
    if (!existing) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const url = validateAbsoluteHttpUrl(payload.url);
    const nameTrim = payload.name.trim();
    const other = await appsRepository.findByName(nameTrim);
    if (other && other.id !== id) {
      throw new AppError('App name already exists', HttpError.CONFLICT);
    }

    const isActive = payload.is_active ?? existing.isActive;

    try {
      const app = await appsRepository.updateById(id, {
        name: nameTrim,
        url,
        type: payload.type,
        isActive,
      });
      return toDto(app);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('App name already exists', HttpError.CONFLICT);
      }
      throw err;
    }
  },

  async deleteApp(id: number): Promise<void> {
    const existing = await appsRepository.findById(id);
    if (!existing) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }
    await appsRepository.deleteById(id);
  },
};
