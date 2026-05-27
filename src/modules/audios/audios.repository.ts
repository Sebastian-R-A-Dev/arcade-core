import { prisma } from '../../shared/database/prisma.js';

export type CreateAppAudioRowInput = {
  uuid: string;
  displayName: string;
  publicUrl: string;
  storagePath: string;
};

export const audiosRepository = {
  async create(data: CreateAppAudioRowInput) {
    return prisma.appAudio.create({
      data: {
        uuid: data.uuid,
        displayName: data.displayName,
        publicUrl: data.publicUrl,
        storagePath: data.storagePath,
      },
    });
  },

  async searchByDisplayName(query: string, take = 200) {
    const q = query.trim();
    const where = q ? { displayName: { contains: q, mode: 'insensitive' as const } } : {};
    return prisma.appAudio.findMany({
      where,
      orderBy: { id: 'desc' },
      take: Math.min(take, 200),
    });
  },
};
