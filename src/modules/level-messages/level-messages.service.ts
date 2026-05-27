import { HttpError } from '../../shared/constants/httpError.js';
import {
  formatPlayerLevelLabel,
  isValidMilestoneLevel,
  playerLevelMilestone,
} from '../../shared/progression/level-milestone.js';
import { AppError } from '../../shared/utils/AppError.js';
import { levelMessagesRepository } from './level-messages.repository.js';

export type LevelMilestoneMessageDto = {
  level: number;
  message: string;
  updated_at: string;
};

function toDto(row: { level: number; message: string; updatedAt: Date }): LevelMilestoneMessageDto {
  return {
    level: row.level,
    message: row.message,
    updated_at: row.updatedAt.toISOString(),
  };
}

const DEFAULT_MESSAGE = 'Keep playing to level up.';

export const levelMessagesService = {
  async resolveForPlayerLevel(playerLevel: number): Promise<string> {
    const milestone = playerLevelMilestone(playerLevel);
    const row = await levelMessagesRepository.findByMilestoneLevel(milestone);
    return row?.message ?? DEFAULT_MESSAGE;
  },

  async listForAdmin(): Promise<LevelMilestoneMessageDto[]> {
    const rows = await levelMessagesRepository.findMany();
    return rows.map(toDto);
  },

  async upsertForAdmin(level: number, message: string): Promise<LevelMilestoneMessageDto> {
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
    const row = await levelMessagesRepository.upsert(level, trimmed);
    return toDto(row);
  },

  async deleteForAdmin(level: number): Promise<void> {
    if (!isValidMilestoneLevel(level)) {
      throw new AppError(
        'level must be 0 or a multiple of 100 up to 1000',
        HttpError.BAD_REQUEST,
      );
    }
    await levelMessagesRepository.deleteByLevel(level);
  },

  formatPlayerLevelLabel,
};
