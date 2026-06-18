import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerDefinition } from './swagger.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function swaggerDocsExtension(): 'ts' | 'js' {
  return import.meta.url.endsWith('.ts') ? 'ts' : 'js';
}

const ext = swaggerDocsExtension();

const swaggerPaths = [
  path.join(__dirname, 'paths', `auth.paths.${ext}`),
  path.join(__dirname, 'paths', `users.paths.${ext}`),
  path.join(__dirname, 'paths', `admin.paths.${ext}`),
  path.join(__dirname, 'paths', `apps.paths.${ext}`),
  path.join(__dirname, 'paths', `questions.paths.${ext}`),
  path.join(__dirname, 'paths', `scores.paths.${ext}`),
  path.join(__dirname, 'paths', `chat.paths.${ext}`),
];

export function setupSwagger(app: Express): void {
  const options = {
    definition: swaggerDefinition,
    apis: swaggerPaths,
  };

  const spec = swaggerJsdoc(options);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}
