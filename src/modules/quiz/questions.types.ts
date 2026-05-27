import type { Prisma } from '@prisma/client';
import type { QuestionDifficultyDto } from '../difficulties/difficulties.types.js';
import type { QuestionTypeRefDto } from '../question-types/question-types.types.js';

export type { QuestionTypeRefDto };

export type QuestionDto = {
  id: number;
  app_id: number;
  difficulty_id: number;
  difficulty: QuestionDifficultyDto;
  question_type_id: number;
  question_type: QuestionTypeRefDto;
  question: Prisma.JsonValue;
  options: Prisma.JsonValue;
  answer: string;
  image_url: string | null;
  image_name: string | null;
  image_id: number | null;
  created_at: string;
};

export type AdminQuestionsListMeta = {
  total: number;
  limit: number | null;
  page: number | null;
  total_pages: number | null;
};

export type AdminQuestionsListResult = {
  data: QuestionDto[];
  meta: AdminQuestionsListMeta;
};

export type QuestionPublicDto = Omit<QuestionDto, 'answer'>;
