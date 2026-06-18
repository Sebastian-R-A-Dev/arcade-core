import { HttpError } from '../../shared/constants/httpError.js';
import {
  formatPlayerLevelLabel,
  isValidMilestoneLevel,
  playerLevelMilestone,
} from '../../shared/progression/level-milestone.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import { levelMessagesRepository } from './level-messages.repository.js';

export type LevelMilestoneMessageDto = {
  app_id: number;
  level: number;
  message: string;
  updated_at: string;
};

function toDto(row: {
  appId: number;
  level: number;
  message: string;
  updatedAt: Date;
}): LevelMilestoneMessageDto {
  return {
    app_id: row.appId,
    level: row.level,
    message: row.message,
    updated_at: row.updatedAt.toISOString(),
  };
}

const DEFAULT_MESSAGE = 'Keep playing to level up.';

async function resolveAppId(appName: string): Promise<number> {
  const app = await appsRepository.findByName(appName);
  if (!app) {
    throw new AppError(`App not found: ${appName}`, HttpError.NOT_FOUND);
  }
  return app.id;
}

export const levelMessagesService = {
  async resolveForPlayerLevel(playerLevel: number, appId: number): Promise<string> {
    const milestone = playerLevelMilestone(playerLevel);
    const row = await levelMessagesRepository.findByAppAndMilestoneLevel(appId, milestone);
    return row?.message ?? DEFAULT_MESSAGE;
  },

  async resolveForPlayerLevelByAppName(playerLevel: number, appName: string): Promise<string> {
    const appId = await resolveAppId(appName);
    return this.resolveForPlayerLevel(playerLevel, appId);
  },

  async listForAdmin(appId: number): Promise<LevelMilestoneMessageDto[]> {
    const rows = await levelMessagesRepository.findManyByApp(appId);
    return rows.map(toDto);
  },

  async upsertForAdmin(
    appId: number,
    level: number,
    message: string,
  ): Promise<LevelMilestoneMessageDto> {
    const app = await appsRepository.findById(appId);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }
    if (!isValidMilestoneLevel(level)) {
      throw new AppError(
        'level must be 0 or a multiple of 100 up to 1000',
        HttpError.BAD_REQUEST,
      );
    }
    const trimmed = message.trim();
    if (!trimmed) {
      throw new AppError('message is required', HttpError.BAD_REQUEST);
    }
    const row = await levelMessagesRepository.upsert(appId, level, trimmed);
    return toDto(row);
  },

  async deleteForAdmin(appId: number, level: number): Promise<void> {
    if (!isValidMilestoneLevel(level)) {
      throw new AppError(
        'level must be 0 or a multiple of 100 up to 1000',
        HttpError.BAD_REQUEST,
      );
    }
    await levelMessagesRepository.deleteByAppAndLevel(appId, level);
  },

  formatPlayerLevelLabel,
};
