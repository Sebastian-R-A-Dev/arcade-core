import type { NextFunction, Request, Response } from 'express';
import { leaderboardService } from './leaderboard.service.js';
import type { LeaderboardQuery } from './leaderboard.validation.js';

export const leaderboardController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as LeaderboardQuery;
      const data = await leaderboardService.listForApp(query.app_name, query.limit);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
