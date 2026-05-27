import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type QuestionFilters = {
  appId?: number;
  difficultyId?: number;
  questionTypeId?: number;
  limit?: number;
  offset?: number;
  recent?: boolean;
};

function buildWhere(filters: Pick<QuestionFilters, 'appId' | 'difficultyId' | 'questionTypeId'>) {
  return {
    ...(filters.appId != null ? { appId: filters.appId } : {}),
    ...(filters.difficultyId != null ? { difficultyId: filters.difficultyId } : {}),
    ...(filters.questionTypeId != null ? { questionTypeId: filters.questionTypeId } : {}),
  };
}

export type CreateQuestionRowInput = {
  appId: number;
  difficultyId: number;
  questionTypeId: number;
  question: Prisma.InputJsonValue;
  options: Prisma.InputJsonValue;
  answer: string;
  imageUrl?: string | null;
  imageName?: string | null;
  imageId?: number | null;
};

const questionInclude = {
  difficulty: true,
  questionType: true,
} as const;

export const questionsRepository = {
  async create({
    appId,
    difficultyId,
    questionTypeId,
    question,
    options,
    answer,
    imageUrl,
    imageName,
    imageId,
  }: CreateQuestionRowInput) {
    return prisma.question.create({
      data: {
        appId,
        difficultyId,
        questionTypeId,
        question,
        options,
        answer,
        imageUrl: imageUrl ?? null,
        imageName: imageName ?? null,
        imageId: imageId ?? null,
      },
      include: questionInclude,
    });
  },

  async findMany(filters: QuestionFilters) {
    return prisma.question.findMany({
      where: buildWhere(filters),
      orderBy: filters.recent ? [{ createdAt: 'desc' }] : [{ id: 'asc' }],
      include: questionInclude,
      ...(filters.offset != null ? { skip: filters.offset } : {}),
      ...(filters.limit != null ? { take: filters.limit } : {}),
    });
  },

  async count(filters: Pick<QuestionFilters, 'appId' | 'difficultyId' | 'questionTypeId'>) {
    return prisma.question.count({ where: buildWhere(filters) });
  },

  async findIds(filters: QuestionFilters) {
    return prisma.question.findMany({
      where: buildWhere(filters),
      select: { id: true },
    });
  },

  async findById(id: number) {
    return prisma.question.findUnique({
      where: { id },
      include: questionInclude,
    });
  },

  async updateById(
    id: number,
    data: {
      difficultyId: number;
      question: Prisma.InputJsonValue;
      options: Prisma.InputJsonValue;
      answer: string;
      imageUrl: string | null;
      imageName: string | null;
      imageId: number | null;
    },
  ) {
    return prisma.question.update({
      where: { id },
      data: {
        difficultyId: data.difficultyId,
        question: data.question,
        options: data.options,
        answer: data.answer,
        imageUrl: data.imageUrl,
        imageName: data.imageName,
        imageId: data.imageId,
      },
      include: questionInclude,
    });
  },

  async deleteById(id: number) {
    return prisma.question.delete({ where: { id } });
  },
};
