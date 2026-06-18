import type { IncomingMessage, Server as HttpServer } from 'node:http';
import { URL } from 'node:url';
import { AppType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { appsRepository } from '../apps/apps.repository.js';
import { env } from '../../shared/config/env.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { validateImageUrl } from './chat.image-validator.js';
import { moderateOutgoingMessage } from './chat.moderation.js';
import { chatRepository } from './chat.repository.js';
import { chatService } from './chat.service.js';
import { chatXpHeartbeat } from './chat.xp-heartbeat.js';
import type { ChatMessageDto, WsClientEvent, WsServerEvent } from './chat.types.js';

type AuthPayload = {
  sub: string;
  email: string;
  appId: number;
  app_name?: string;
};

type ChatClient = {
  ws: WebSocket;
  userId: number;
  appId: number;
  joinTimestamp: number;
};

const clientsByApp = new Map<number, Map<number, ChatClient>>();

function getAppRoom(appId: number): Map<number, ChatClient> {
  let room = clientsByApp.get(appId);
  if (!room) {
    room = new Map();
    clientsByApp.set(appId, room);
  }
  return room;
}

function send(ws: WebSocket, event: WsServerEvent) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

function sendSystem(ws: WebSocket, text: string, code?: string) {
  send(ws, { event: 'chat:system', payload: { text, code } });
}

function broadcastToApp(appId: number, event: WsServerEvent, excludeUserId?: number) {
  const room = clientsByApp.get(appId);
  if (!room) return;
  for (const [userId, client] of room) {
    if (excludeUserId !== undefined && userId === excludeUserId) continue;
    send(client.ws, event);
  }
}

async function buildOnlineList(appId: number) {
  const room = clientsByApp.get(appId);
  if (!room) return [];
  const users = await Promise.all(
    [...room.keys()].map(async (userId) => {
      const user = await chatRepository.findUserWithProfile(userId);
      if (!user) return null;
      return chatService.toOnlineUserDto(user);
    }),
  );
  return users.filter((u): u is NonNullable<typeof u> => u !== null);
}

async function broadcastOnline(appId: number) {
  const users = await buildOnlineList(appId);
  broadcastToApp(appId, { event: 'chat:presence:online', payload: { users } });
}

function verifyToken(token: string): AuthPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.appId !== 'number'
  ) {
    throw new AppError('Invalid access token', HttpError.UNAUTHORIZED);
  }
  return payload as AuthPayload;
}

async function assertChatApp(appId: number) {
  const app = await appsRepository.findById(appId);
  if (!app || app.type !== AppType.chat) {
    throw new AppError('WebSocket requires a chat app token', HttpError.FORBIDDEN);
  }
  return app;
}

function extractTokenAndPath(req: IncomingMessage): { token: string | null; pathname: string } {
  try {
    const host = req.headers.host ?? 'localhost';
    const url = new URL(req.url ?? '/', `http://${host}`);
    const token = url.searchParams.get('token')?.trim() ?? null;
    return { token, pathname: url.pathname };
  } catch {
    return { token: null, pathname: '' };
  }
}

function parseClientEvent(raw: string): WsClientEvent | null {
  try {
    const parsed = JSON.parse(raw) as { event?: string; payload?: unknown };
    if (!parsed || typeof parsed.event !== 'string') return null;
    return parsed as WsClientEvent;
  } catch {
    return null;
  }
}

async function deliverPrivateMessage(
  appId: number,
  fromUserId: number,
  toUserId: number,
  message: ChatMessageDto,
) {
  const room = clientsByApp.get(appId);
  if (!room) return;
  const recipient = room.get(toUserId);
  if (recipient) {
    send(recipient.ws, {
      event: 'chat:private:message',
      payload: { peer_user_id: fromUserId, message },
    });
  }
  const sender = room.get(fromUserId);
  if (sender) {
    send(sender.ws, {
      event: 'chat:private:message',
      payload: { peer_user_id: toUserId, message },
    });
  }
}

async function handleGlobalSend(client: ChatClient, text: string, imageUrl?: string) {
  const moderation = moderateOutgoingMessage(client.userId, client.appId, text);
  if (!moderation.ok) {
    sendSystem(client.ws, moderation.message, moderation.code);
    return;
  }

  let normalizedText = text;
  try {
    normalizedText = chatService.normalizeOutgoingText(text);
  } catch (err) {
    if (err instanceof AppError) {
      sendSystem(client.ws, err.message);
      return;
    }
    throw err;
  }

  if (imageUrl?.trim()) {
    const validation = await validateImageUrl(imageUrl.trim());
    if (!validation.ok) {
      sendSystem(client.ws, validation.message, validation.code);
      return;
    }
  }

  const message = chatService.createUserMessage(
    client.userId,
    normalizedText,
    imageUrl?.trim() || undefined,
  );
  const dto = chatService.toMessageDto(message);
  broadcastToApp(client.appId, { event: 'chat:global:message', payload: { message: dto } });
}

async function handlePrivateSend(
  client: ChatClient,
  toUserId: number,
  text: string,
  imageUrl?: string,
) {
  if (toUserId === client.userId) {
    sendSystem(client.ws, 'No puedes enviarte mensajes a ti mismo.', 'invalid_peer');
    return;
  }

  const peer = await chatRepository.findUserWithProfile(toUserId);
  if (!peer || peer.appId !== client.appId) {
    sendSystem(client.ws, 'Usuario no encontrado.', 'peer_not_found');
    return;
  }

  const moderation = moderateOutgoingMessage(client.userId, client.appId, text);
  if (!moderation.ok) {
    sendSystem(client.ws, moderation.message, moderation.code);
    return;
  }

  let normalizedText = text;
  try {
    normalizedText = chatService.normalizeOutgoingText(text);
  } catch (err) {
    if (err instanceof AppError) {
      sendSystem(client.ws, err.message);
      return;
    }
    throw err;
  }

  if (imageUrl?.trim()) {
    const validation = await validateImageUrl(imageUrl.trim());
    if (!validation.ok) {
      sendSystem(client.ws, validation.message, validation.code);
      return;
    }
  }

  const message = chatService.createUserMessage(
    client.userId,
    normalizedText,
    imageUrl?.trim() || undefined,
  );
  await chatRepository.appendPrivateMessage(client.appId, client.userId, toUserId, message);
  const dto = chatService.toMessageDto(message);
  await deliverPrivateMessage(client.appId, client.userId, toUserId, dto);
}

async function handlePresencePing(client: ChatClient, visible: boolean) {
  const result = await chatXpHeartbeat.tick(client.userId, client.appId, visible);
  if (result && result.gained > 0) {
    send(client.ws, {
      event: 'chat:xp:update',
      payload: {
        level: result.progress.level,
        xp: result.progress.xp,
        gained: result.gained,
      },
    });
  }
}

async function handleClientMessage(client: ChatClient, raw: string) {
  const event = parseClientEvent(raw);
  if (!event) {
    sendSystem(client.ws, 'Evento no reconocido.', 'invalid_event');
    return;
  }

  switch (event.event) {
    case 'chat:join':
      await broadcastOnline(client.appId);
      break;
    case 'chat:global:send':
      await handleGlobalSend(client, event.payload.text, event.payload.image_url);
      break;
    case 'chat:private:send':
      await handlePrivateSend(
        client,
        event.payload.to_user_id,
        event.payload.text,
        event.payload.image_url,
      );
      break;
    case 'chat:presence:ping':
      await handlePresencePing(client, event.payload.visible);
      break;
    default:
      sendSystem(client.ws, 'Evento no reconocido.', 'invalid_event');
  }
}

function removeClient(client: ChatClient) {
  const room = clientsByApp.get(client.appId);
  if (!room) return;
  room.delete(client.userId);
  if (room.size === 0) {
    clientsByApp.delete(client.appId);
  } else {
    void broadcastOnline(client.appId);
  }
  chatXpHeartbeat.reset(client.userId, client.appId);
}

function attachClient(ws: WebSocket, userId: number, appId: number) {
  const client: ChatClient = {
    ws,
    userId,
    appId,
    joinTimestamp: Date.now(),
  };

  const room = getAppRoom(client.appId);
  const existing = room.get(client.userId);
  if (existing) {
    existing.ws.close();
    room.delete(client.userId);
  }
  room.set(client.userId, client);

  void broadcastOnline(client.appId);

  ws.on('message', (data) => {
    const raw = typeof data === 'string' ? data : data.toString();
    void handleClientMessage(client, raw).catch(() => {
      sendSystem(ws, 'Error al procesar el mensaje.', 'internal_error');
    });
  });

  ws.on('close', () => {
    removeClient(client);
  });
}

export function setupChatWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });
  const wsPath = env.chatWsPath;

  server.on('upgrade', (req, socket, head) => {
    const { token, pathname } = extractTokenAndPath(req);
    if (pathname !== wsPath) {
      socket.destroy();
      return;
    }

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    void (async () => {
      try {
        const payload = verifyToken(token);
        await assertChatApp(payload.appId);
        const userId = Number.parseInt(payload.sub, 10);
        if (!Number.isFinite(userId)) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const user = await chatRepository.findUserWithProfile(userId);
        if (!user || user.appId !== payload.appId || !user.isActive) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
          attachClient(ws, userId, payload.appId);
        });
      } catch {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
      }
    })();
  });

  console.log(`Chat WebSocket ready at ${wsPath}`);
}
