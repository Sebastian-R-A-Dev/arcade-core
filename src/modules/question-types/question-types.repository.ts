import type { QuestionTypeCatalog } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type CreateQuestionTypeRowInput = {
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type UpdateQuestionTypeRowInput = {
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export const questionTypesRepository = {
  async create(data: CreateQuestionTypeRowInput): Promise<QuestionTypeCatalog> {
    return prisma.questionTypeCatalog.create({ data });
  },

  async findById(id: number): Promise<QuestionTypeCatalog | null> {
    return prisma.questionTypeCatalog.findUnique({ where: { id } });
  },

  async findBySlug(slug: string): Promise<QuestionTypeCatalog | null> {
    return prisma.questionTypeCatalog.findUnique({ where: { slug } });
  },

  async findMany(includeInactive: boolean): Promise<QuestionTypeCatalog[]> {
    return prisma.questionTypeCatalog.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  },

  async updateById(id: number, data: UpdateQuestionTypeRowInput): Promise<QuestionTypeCatalog> {
    return prisma.questionTypeCatalog.update({ where: { id }, data });
  },

  async deleteById(id: number): Promise<void> {
    await prisma.questionTypeCatalog.delete({ where: { id } });
  },

  async countQuestions(id: number): Promise<number> {
    return prisma.question.count({ where: { questionTypeId: id } });
  },
};
