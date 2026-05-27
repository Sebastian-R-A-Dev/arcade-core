import { formatPlayerLevelLabel } from '../../shared/progression/level-milestone.js';
import { appsRepository } from '../apps/apps.repository.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { userProgressRepository } from '../user-progress/user-progress.repository.js';
import type { LeaderboardEntryDto } from './leaderboard.types.js';

export const leaderboardService = {
  async listForApp(appName: string, limit: number): Promise<LeaderboardEntryDto[]> {
    const app = await appsRepository.findByName(appName.trim());
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const rows = await userProgressRepository.findTopForLeaderboard(app.name, limit);
    return rows.map((row, index) => ({
      position: index + 1,
      player: row.user.profile?.nickname ?? `Player #${row.userId}`,
      level_label: formatPlayerLevelLabel(row.level),
      player_level: row.level,
      score: row.totalScore,
      wins: row.wins,
    }));
  },
};
