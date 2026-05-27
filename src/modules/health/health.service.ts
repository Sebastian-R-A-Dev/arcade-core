import type { DatabaseHealthResponse, LivenessResponse, ServiceName } from './health.types.js';
import { healthRepository } from './health.repository.js';

const SERVICE_NAME: ServiceName = 'ArcadeCore';

export const healthService = {
  getLiveness(): LivenessResponse {
    return {
      service: SERVICE_NAME,
      status: 'active',
    };
  },

  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    try {
      await healthRepository.pingDatabase();
      return {
        service: SERVICE_NAME,
        database: 'connected',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        service: SERVICE_NAME,
        database: 'failed',
        message,
      };
    }
  },
};
