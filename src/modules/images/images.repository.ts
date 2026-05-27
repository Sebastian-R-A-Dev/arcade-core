import type { ImageKind } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type CreateImageRowInput = {
  uuid: string;
  kind: ImageKind;
  displayName: string;
  publicUrl: string;
  storagePath: string;
};

export const imagesRepository = {
  async create(data: CreateImageRowInput) {
    return prisma.image.create({
      data: {
        uuid: data.uuid,
        kind: data.kind,
        displayName: data.displayName,
        publicUrl: data.publicUrl,
        storagePath: data.storagePath,
      },
    });
  },

  async findById(id: number) {
    return prisma.image.findUnique({ where: { id } });
  },

  async deleteById(id: number) {
    return prisma.image.delete({ where: { id } });
  },

  async countProfilesUsingAvatarImage(imageId: number) {
    return prisma.userProfile.count({ where: { avatarImageId: imageId } });
  },

  async findRecentByKind(kind: ImageKind, take: number) {
    return prisma.image.findMany({
      where: { kind },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 50),
    });
  },

  async searchByDisplayName(query: string, kind: ImageKind | undefined, take = 100) {
    const q = query.trim();
    const where = {
      ...(kind ? { kind } : {}),
      ...(q ? { displayName: { contains: q, mode: 'insensitive' as const } } : {}),
    };
    return prisma.image.findMany({
      where,
      orderBy: { id: 'desc' },
      take: Math.min(take, 100),
    });
  },
};
