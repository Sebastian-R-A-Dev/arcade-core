import type { AppType } from '@prisma/client';

export type AppDto = {
  id: number;
  name: string;
  url: string;
  type: AppType;
  is_active: boolean;
  created_at: string;
};
