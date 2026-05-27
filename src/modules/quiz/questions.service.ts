import type { Prisma } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import { difficultiesService } from '../difficulties/difficulties.service.js';
import { ImageKind } from '@prisma/client';
import { assertImageKind } from '../images/image.service.js';
import { questionTypesService } from '../question-types/question-types.service.js';
import type { AdminQuestionsListResult, QuestionDto, QuestionPublicDto } from './questions.types.js';
import { questionsRepository } from './questions.repository.js';
import type {
  AdminListQuestionsQuery,
  CreateQuestionBody,
  MyQuestionsQuery,
  UpdateQuestionBody,
} from './questions.validation.js';

type QuestionRow = Awaited<ReturnType<typeof questionsRepository.findById>> & {};

function assertQuestionShape(
  typeSlug: string,
  question: CreateQuestionBody['question'] | UpdateQuestionBody['question'],
  options: string[],
): void {
  if (typeSlug === 'fill_blank' || typeSlug === 'multiple_choice' || typeSlug === 'image_multiple_choice') {
    if (typeof question !== 'string') {
      throw new AppError('question must be a string for this type', HttpError.BAD_REQUEST);
    }
  }
  if (typeSlug === 'word_order') {
    if (typeof question !== 'string') {
      throw new AppError('question must be a help-text string for word_order', HttpError.BAD_REQUEST);
    }
    if (!Array.isArray(options)) {
      throw new AppError('options must be an array', HttpError.BAD_REQUEST);
    }
  }
}

function assertWordOrderPayload(helpText: string, options: string[], answer: string): void {
  if (!helpText.trim()) {
    throw new AppError('question help text is required for word_order', HttpError.BAD_REQUEST);
  }
  if (options.length < 3) {
    throw new AppError('word_order word pool must contain at least 3 words', HttpError.BAD_REQUEST);
  }
  const ans = answer.trim();
  if (!ans) {
    throw new AppError('answer is required for word_order', HttpError.BAD_REQUEST);
  }
  const answerWords = ans.split(/\s+/).filter(Boolean);
  if (answerWords.length < 2) {
    throw new AppError('word_order answer must contain at least 2 words', HttpError.BAD_REQUEST);
  }
  const poolSet = new Set(options);
  for (const word of answerWords) {
    if (!poolSet.has(word)) {
      throw new AppError(
        `word_order answer contains "${word}" which is not in the word pool`,
        HttpError.BAD_REQUEST,
      );
    }
  }
}

function assertAnswerMatchesOptions(typeSlug: string, options: string[], answer: string): void {
  if (typeSlug === 'word_order') {
    return;
  }
  if (typeSlug === 'fill_blank' || typeSlug === 'multiple_choice' || typeSlug === 'image_multiple_choice') {
    if (options.length < 1) {
      throw new AppError('options must contain at least one choice', HttpError.BAD_REQUEST);
    }
    if (!options.includes(answer)) {
      throw new AppError('answer must be exactly one of the options', HttpError.BAD_REQUEST);
    }
  }
}

function assertImageFieldsForType(
  typeSlug: string,
  payload: { image_url?: string; image_name?: string; image_id?: number },
): void {
  if (typeSlug === 'image_multiple_choice') {
    const hasUrl = Boolean(payload.image_url?.trim());
    const hasId = payload.image_id != null;
    if (!hasUrl && !hasId) {
      throw new AppError(
        'For image_multiple_choice provide image_id (library) or image_url (public URL)',
        HttpError.BAD_REQUEST,
      );
    }
    return;
  }
  if (payload.image_id != null) {
    throw new AppError('image_id is only allowed for image_multiple_choice', HttpError.BAD_REQUEST);
  }
  if (payload.image_url != null && String(payload.image_url).trim() !== '') {
    throw new AppError('image_url is only allowed for image_multiple_choice', HttpError.BAD_REQUEST);
  }
  if (payload.image_name != null && String(payload.image_name).trim() !== '') {
    throw new AppError('image_name is only allowed for image_multiple_choice', HttpError.BAD_REQUEST);
  }
}

function toDto(row: NonNullable<QuestionRow>): QuestionDto {
  return {
    id: row.id,
    app_id: row.appId,
    difficulty_id: row.difficultyId,
    difficulty: {
      id: row.difficulty.id,
      name: row.difficulty.name,
      is_active: row.difficulty.isActive,
    },
    question_type_id: row.questionTypeId,
    question_type: {
      id: row.questionType.id,
      slug: row.questionType.slug,
      label: row.questionType.label,
      is_active: row.questionType.isActive,
    },
    question: row.question,
    options: row.options,
    answer: row.answer,
    image_url: row.imageUrl,
    image_name: row.imageName,
    image_id: row.imageId,
    created_at: row.createdAt.toISOString(),
  };
}

function toPublicDto(row: NonNullable<QuestionRow>): QuestionPublicDto {
  const full = toDto(row);
  const { answer: _answer, ...rest } = full;
  return rest;
}

export const questionsService = {
  toPublicQuestion(row: NonNullable<QuestionRow>): QuestionPublicDto {
    return toPublicDto(row);
  },

  async createQuestion(payload: CreateQuestionBody): Promise<QuestionDto> {
    const app = await appsRepository.findById(payload.app_id);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }
    if (!app.isActive) {
      throw new AppError('App is not active', HttpError.BAD_REQUEST);
    }

    await difficultiesService.assertDifficultyForQuestion(payload.app_id, payload.difficulty_id);
    const questionType = await questionTypesService.assertActiveForQuestion(payload.question_type_id);

    const options = payload.options ?? [];
    assertImageFieldsForType(questionType.slug, payload);
    assertQuestionShape(questionType.slug, payload.question, options);
    if (questionType.slug === 'word_order') {
      assertWordOrderPayload(payload.question, options, payload.answer);
    } else {
      assertAnswerMatchesOptions(questionType.slug, options, payload.answer);
    }

    let imageUrl: string | null = null;
    let imageName: string | null = null;
    let imageId: number | null = null;

    if (questionType.slug === 'image_multiple_choice') {
      if (payload.image_id != null) {
        const lib = await assertImageKind(payload.image_id, ImageKind.generic);
        imageId = lib.id;
        imageUrl = lib.publicUrl;
        imageName = payload.image_name?.trim() ? payload.image_name.trim() : lib.displayName;
      } else {
        imageUrl = payload.image_url!.trim();
        imageName = payload.image_name?.trim() ?? null;
      }
    }

    const row = await questionsRepository.create({
      appId: payload.app_id,
      difficultyId: payload.difficulty_id,
      questionTypeId: payload.question_type_id,
      question: payload.question,
      options,
      answer: payload.answer,
      imageUrl,
      imageName,
      imageId,
    });

    return toDto(row);
  },

  async updateQuestion(id: number, payload: UpdateQuestionBody): Promise<QuestionDto> {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw new AppError('Question not found', HttpError.NOT_FOUND);
    }

    await difficultiesService.assertDifficultyBelongsToApp(
      existing.appId,
      payload.difficulty_id,
    );

    const typeSlug = existing.questionType.slug;
    const options = payload.options ?? [];

    assertImageFieldsForType(typeSlug, payload);
    assertQuestionShape(typeSlug, payload.question, options);
    if (typeSlug === 'word_order') {
      assertWordOrderPayload(payload.question, options, payload.answer);
    } else {
      assertAnswerMatchesOptions(typeSlug, options, payload.answer);
    }

    let imageUrl: string | null = existing.imageUrl;
    let imageName: string | null = existing.imageName;
    let imageId: number | null = existing.imageId;

    if (typeSlug === 'image_multiple_choice') {
      if (payload.image_id != null) {
        const lib = await assertImageKind(payload.image_id, ImageKind.generic);
        imageId = lib.id;
        imageUrl = lib.publicUrl;
        imageName = payload.image_name?.trim() ? payload.image_name.trim() : lib.displayName;
      } else if (payload.image_url != null && payload.image_url.trim() !== '') {
        imageUrl = payload.image_url.trim();
        imageName = payload.image_name?.trim() ?? null;
        imageId = null;
      }
    }

    const row = await questionsRepository.updateById(id, {
      difficultyId: payload.difficulty_id,
      question: payload.question as Prisma.InputJsonValue,
      options: options as Prisma.InputJsonValue,
      answer: payload.answer,
      imageUrl,
      imageName,
      imageId,
    });

    return toDto(row);
  },

  async deleteQuestion(id: number): Promise<void> {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw new AppError('Question not found', HttpError.NOT_FOUND);
    }
    await questionsRepository.deleteById(id);
  },

  async listQuestionsAdmin(query: AdminListQuestionsQuery): Promise<AdminQuestionsListResult> {
    const baseFilters = {
      appId: query.app_id ?? undefined,
      difficultyId: query.difficulty_id ?? undefined,
      questionTypeId: query.question_type_id ?? undefined,
    };
    const limit = query.limit ?? undefined;
    const page = query.page ?? 1;
    const offset = limit != null ? (page - 1) * limit : undefined;

    const [total, rows] = await Promise.all([
      questionsRepository.count(baseFilters),
      questionsRepository.findMany({
        ...baseFilters,
        limit,
        offset,
        recent: query.recent ?? undefined,
      }),
    ]);

    const totalPages = limit != null ? Math.max(1, Math.ceil(total / limit)) : 1;

    return {
      data: rows.map(toDto),
      meta: {
        total,
        limit: limit ?? null,
        page: limit != null ? page : null,
        total_pages: limit != null ? totalPages : null,
      },
    };
  },

  async listQuestionsForApp(appId: number, query: MyQuestionsQuery): Promise<QuestionPublicDto[]> {
    const rows = await questionsRepository.findMany({
      appId,
      difficultyId: query.difficulty_id ?? undefined,
      questionTypeId: query.question_type_id ?? undefined,
    });
    return rows.map(toPublicDto);
  },

  async randomQuestionForApp(appId: number, query: MyQuestionsQuery): Promise<QuestionPublicDto> {
    const filters = {
      appId,
      difficultyId: query.difficulty_id ?? undefined,
      questionTypeId: query.question_type_id ?? undefined,
    };
    const ids = await questionsRepository.findIds(filters);
    if (ids.length === 0) {
      throw new AppError('No questions match the criteria', HttpError.NOT_FOUND);
    }
    const pick = ids[Math.floor(Math.random() * ids.length)]!;
    const row = await questionsRepository.findById(pick.id);
    if (!row) {
      throw new AppError('No questions match the criteria', HttpError.NOT_FOUND);
    }
    return toPublicDto(row);
  },
};
