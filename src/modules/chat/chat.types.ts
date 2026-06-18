export type ChatMessageType = 'user' | 'system';

export type ChatMessageJson = {
  id: string;
  type: ChatMessageType;
  text: string;
  created_at: string;
  from_user_id?: number;
  image_url?: string;
};

export type ChatMessageDto = {
  id: string;
  type: ChatMessageType;
  text: string;
  created_at: string;
  from_user_id?: number;
  image_url?: string;
};

export type OnlineUserDto = {
  user_id: number;
  nickname: string;
  avatar_url: string | null;
  level: number;
  is_gm: boolean;
};

export type ChatPrivateConversationSummaryDto = {
  peer_user_id: number;
  peer_nickname: string;
  peer_avatar_url: string | null;
  last_message: ChatMessageDto | null;
  updated_at: string;
};

export type ChatPrivateHistoryDto = {
  peer_user_id: number;
  messages: ChatMessageDto[];
};

export type ChatHeartbeatResponseDto = {
  progress: {
    level: number;
    xp: number;
    xp_required_for_next_level: number | null;
    xp_to_next_level: number | null;
    is_max_level: boolean;
  };
  xp_gained?: number;
};

export type WsClientEvent =
  | { event: 'chat:join'; payload?: Record<string, never> }
  | { event: 'chat:global:send'; payload: { text: string; image_url?: string } }
  | { event: 'chat:private:send'; payload: { to_user_id: number; text: string; image_url?: string } }
  | { event: 'chat:presence:ping'; payload: { visible: boolean } };

export type WsServerEvent =
  | { event: 'chat:global:message'; payload: { message: ChatMessageDto } }
  | { event: 'chat:private:message'; payload: { peer_user_id: number; message: ChatMessageDto } }
  | { event: 'chat:presence:online'; payload: { users: OnlineUserDto[] } }
  | { event: 'chat:system'; payload: { text: string; code?: string } }
  | { event: 'chat:xp:update'; payload: { level: number; xp: number; gained?: number } };
