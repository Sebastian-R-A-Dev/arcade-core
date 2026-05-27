import { Prisma, type QuestionTypeCatalog } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import type { QuestionTypeDto } from './question-types.types.js';
import { questionTypesRepository } from './question-types.repository.js';
import type {
  AdminListQuestionTypesQuery,
  CreateQuestionTypeBody,
  UpdateQuestionTypeBody,
} from './question-types.validation.js';

function toDto(row: QuestionTypeCatalog): QuestionTypeDto {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    sort_order: row.sortOrder,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
  };
}

export const questionTypesService = {
  async createQuestionType(payload: CreateQuestionTypeBody): Promise<QuestionTypeDto> {
    try {
      const row = await questionTypesRepository.create({
        slug: payload.slug,
        label: payload.label,
        description: payload.description?.trim() ? payload.description.trim() : null,
        sortOrder: payload.sort_order ?? 0,
        isActive: payload.is_active ?? true,
      });
      return toDto(row);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Question type slug already exists', HttpError.CONFLICT);
      }
      throw err;
    }
  },

  async list(query: AdminListQuestionTypesQuery): Promise<QuestionTypeDto[]> {
    const rows = await questionTypesRepository.findMany(query.include_inactive === 'true');
    return rows.map(toDto);
  },

  async updateQuestionType(id: number, payload: UpdateQuestionTypeBody): Promise<QuestionTypeDto> {
    const existing = await questionTypesRepository.findById(id);
    if (!existing) {
      throw new AppError('Question type not found', HttpError.NOT_FOUND);
    }
    const row = await questionTypesRepository.updateById(id, {
      label: payload.label,
      description:
        payload.description === undefined
          ? existing.description
          : payload.description?.trim()
            ? payload.description.trim()
            : null,
      sortOrder: payload.sort_order,
      isActive: payload.is_active,
    });
    return toDto(row);
  },

  async deleteQuestionType(id: number): Promise<void> {
    const existing = await questionTypesRepository.findById(id);
    if (!existing) {
      throw new AppError('Question type not found', HttpError.NOT_FOUND);
    }
    const linked = await questionTypesRepository.countQuestions(id);
    if (linked > 0) {
      throw new AppError(
        'Cannot delete question type while questions are linked to it',
        HttpError.CONFLICT,
      );
    }
    await questionTypesRepository.deleteById(id);
  },

  async assertActiveForQuestion(questionTypeId: number): Promise<QuestionTypeCatalog> {
    const row = await questionTypesRepository.findById(questionTypeId);
    if (!row) {
      throw new AppError('Question type not found', HttpError.NOT_FOUND);
    }
    if (!row.isActive) {
      throw new AppError('Question type is not active', HttpError.BAD_REQUEST);
    }
    return row;
  },
};
