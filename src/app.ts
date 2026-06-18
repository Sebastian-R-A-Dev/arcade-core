import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './shared/config/env.js';
import { healthRouter } from './modules/health/health.routes.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { setupSwagger } from './shared/swagger/swagger.js';
import { apiV1Router } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        callback(null, env.corsOrigins.includes(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.redirect(302, '/health');
  });

  setupSwagger(app);

  app.use('/health', healthRouter);

  app.use('/api/v1', apiV1Router);

  app.use(errorHandler);

  return app;
}
