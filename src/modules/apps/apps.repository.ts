import type { AppType } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type CreateAppRowInput = {
  name: string;
  url: string;
  type: AppType;
  isActive: boolean;
};

export const appsRepository = {
  async create({ name, url, type, isActive }: CreateAppRowInput) {
    return prisma.app.create({
      data: {
        name,
        url,
        type,
        isActive,
      },
    });
  },

  async findAll() {
    return prisma.app.findMany({
      orderBy: { id: 'asc' },
    });
  },

  async findById(id: number) {
    return prisma.app.findUnique({ where: { id } });
  },

  async findByName(name: string) {
    return prisma.app.findUnique({ where: { name } });
  },

  async updateById(
    id: number,
    data: { name: string; url: string; type: AppType; isActive: boolean },
  ) {
    return prisma.app.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        type: data.type,
        isActive: data.isActive,
      },
    });
  },

  async deleteById(id: number) {
    return prisma.app.delete({ where: { id } });
  },
};
