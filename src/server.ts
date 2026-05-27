import { env } from './shared/config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`ArcadeCore listening on port ${env.port}`);
});
