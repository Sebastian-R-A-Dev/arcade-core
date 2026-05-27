export type ServiceName = 'ArcadeCore';

export type LivenessResponse = {
  service: ServiceName;
  status: 'active';
};

export type DatabaseHealthResponse = {
  service: ServiceName;
  database: 'connected' | 'failed';
  message?: string;
};
