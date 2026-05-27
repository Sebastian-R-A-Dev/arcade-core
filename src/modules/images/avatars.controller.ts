import type { NextFunction, Request, Response } from 'express';
import { avatarsService } from './avatars.service.js';
import type { PublicListAvatarsQuery } from './image.validation.js';

export const avatarsController = {
  async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as PublicListAvatarsQuery;
      const limit = query.limit ?? 10;
      const data = await avatarsService.listPublic(limit);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
