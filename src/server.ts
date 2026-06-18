import http from 'node:http';
import { env } from './shared/config/env.js';
import { createApp } from './app.js';
import { setupChatWebSocket } from './modules/chat/chat.ws.js';

const app = createApp();
const server = http.createServer(app);

setupChatWebSocket(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`ArcadeCore listening on port ${env.port}`);
});
