import { z } from 'zod';

export const chatHeartbeatSchema = z.object({
  visible: z.boolean(),
});

export const chatPeerUserIdParamsSchema = z.object({
  peerUserId: z.coerce.number().int().positive(),
});

export type ChatHeartbeatBody = z.infer<typeof chatHeartbeatSchema>;
