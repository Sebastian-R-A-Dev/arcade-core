import type { RequestHandler } from 'express';
import { chatService } from './chat.service.js';
import type { ChatHeartbeatBody } from './chat.validation.js';

export const chatController = {
  listPrivate: (async (req, res, next) => {
    try {
      if (!req.user) return next();
      const data = await chatService.listPrivateConversations(req.user.id, req.user.appId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  getPrivateHistory: (async (req, res, next) => {
    try {
      if (!req.user) return next();
      const peerUserId = Number(req.params.peerUserId);
      const data = await chatService.getPrivateHistory(req.user.id, req.user.appId, peerUserId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  heartbeat: (async (req, res, next) => {
    try {
      if (!req.user) return next();
      const data = await chatService.heartbeat(
        req.user.id,
        req.user.appId,
        req.body as ChatHeartbeatBody,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  me: (async (req, res, next) => {
    try {
      if (!req.user) return next();
      const data = await chatService.getMe(req.user.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
