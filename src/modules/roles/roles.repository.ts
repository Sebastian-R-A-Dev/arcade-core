import { prisma } from '../../shared/database/prisma.js';

export const rolesRepository = {
  async findBySlug(slug: string) {
    return prisma.role.findUnique({ where: { slug } });
  },

  async findById(id: number) {
    return prisma.role.findUnique({ where: { id } });
  },

  async findMany() {
    return prisma.role.findMany({ orderBy: { id: 'asc' } });
  },
};
