import { ImageKind } from '@prisma/client';
import { imagesRepository } from './images.repository.js';

export type PublicAvatarDto = {
  id: number;
  public_url: string;
  display_name: string;
};

export const avatarsService = {
  async listPublic(limit = 10): Promise<PublicAvatarDto[]> {
    const rows = await imagesRepository.findRecentByKind(ImageKind.avatar, limit);
    return rows.map((row) => ({
      id: row.id,
      public_url: row.publicUrl,
      display_name: row.displayName,
    }));
  },
};
