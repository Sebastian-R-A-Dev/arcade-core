import { Prisma, type Difficulty } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import type { DifficultyDto } from './difficulties.types.js';
import { difficultiesRepository } from './difficulties.repository.js';
import type {
  AdminListDifficultiesQuery,
  CreateDifficultyBody,
  UpdateDifficultyBody,
} from './difficulties.validation.js';

function toDto(row: Difficulty): DifficultyDto {
  return {
    id: row.id,
    app_id: row.appId,
    name: row.name,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
  };
}

async function assertTargetApp(appId: number): Promise<void> {
  const app = await appsRepository.findById(appId);
  if (!app) {
    throw new AppError('App not found', HttpError.NOT_FOUND);
  }
  if (!app.isActive) {
    throw new AppError('App is not active', HttpError.BAD_REQUEST);
  }
}

export const difficultiesService = {
  async createDifficulty(payload: CreateDifficultyBody): Promise<DifficultyDto> {
    await assertTargetApp(payload.app_id);
    const isActive = payload.is_active ?? true;
    try {
      const row = await difficultiesRepository.create({
        appId: payload.app_id,
        name: payload.name,
        isActive,
      });
      return toDto(row);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Difficulty name already exists for this app', HttpError.CONFLICT);
      }
      throw err;
    }
  },

  async listByApp(query: AdminListDifficultiesQuery): Promise<DifficultyDto[]> {
    await assertTargetApp(query.app_id);
    const rows = await difficultiesRepository.findManyByApp(
      query.app_id,
      query.include_inactive === 'true',
    );
    return rows.map(toDto);
  },

  async updateDifficulty(id: number, payload: UpdateDifficultyBody): Promise<DifficultyDto> {
    const existing = await difficultiesRepository.findById(id);
    if (!existing) {
      throw new AppError('Difficulty not found', HttpError.NOT_FOUND);
    }
    try {
      const row = await difficultiesRepository.updateById(id, {
        name: payload.name,
        isActive: payload.is_active,
      });
      return toDto(row);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Difficulty name already exists for this app', HttpError.CONFLICT);
      }
      throw err;
    }
  },

  async deleteDifficulty(id: number): Promise<void> {
    const existing = await difficultiesRepository.findById(id);
    if (!existing) {
      throw new AppError('Difficulty not found', HttpError.NOT_FOUND);
    }
    const linked = await difficultiesRepository.countQuestions(id);
    if (linked > 0) {
      throw new AppError(
        'Cannot delete difficulty while questions are linked to it',
        HttpError.CONFLICT,
      );
    }
    await difficultiesRepository.deleteById(id);
  },

  /** Validates difficulty exists, belongs to app, and is active (for new questions). */
  async assertDifficultyForQuestion(appId: number, difficultyId: number): Promise<Difficulty> {
    const difficulty = await difficultiesRepository.findById(difficultyId);
    if (!difficulty) {
      throw new AppError('Difficulty not found', HttpError.NOT_FOUND);
    }
    if (difficulty.appId !== appId) {
      throw new AppError('Difficulty does not belong to this app', HttpError.BAD_REQUEST);
    }
    if (!difficulty.isActive) {
      throw new AppError('Difficulty is not active', HttpError.BAD_REQUEST);
    }
    return difficulty;
  },

  /** For updates: must belong to same app; inactive allowed if already assigned. */
  async assertDifficultyBelongsToApp(appId: number, difficultyId: number): Promise<Difficulty> {
    const difficulty = await difficultiesRepository.findById(difficultyId);
    if (!difficulty) {
      throw new AppError('Difficulty not found', HttpError.NOT_FOUND);
    }
    if (difficulty.appId !== appId) {
      throw new AppError('Difficulty does not belong to this app', HttpError.BAD_REQUEST);
    }
    return difficulty;
  },
};
