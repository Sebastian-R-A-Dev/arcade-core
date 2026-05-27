import { z } from 'zod';

const optionalImageUrl = z.preprocess((val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') return val.trim();
  return val;
}, z.string().url().optional());

const optionalImageName = z.preprocess((val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') return val.trim();
  return val;
}, z.string().min(1).max(256).optional());

const optionalImageId = z.preprocess((val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
}, z.coerce.number().int().positive().optional());

const difficultyIdField = z.coerce.number().int().positive();
const questionTypeIdField = z.coerce.number().int().positive();

export const createQuestionSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  difficulty_id: difficultyIdField,
  question_type_id: questionTypeIdField,
  question: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1),
  image_url: optionalImageUrl,
  image_name: optionalImageName,
  image_id: optionalImageId,
});

export const adminListQuestionsQuerySchema = z.object({
  app_id: z.coerce.number().int().positive().optional(),
  difficulty_id: difficultyIdField.optional(),
  question_type_id: questionTypeIdField.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  page: z.coerce.number().int().min(1).optional(),
  /** Si true, ordena por created_at desc (útil con limit para preview reciente). */
  recent: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return val === true || val === 'true' || val === '1';
  }, z.boolean().optional()),
});

export const myQuestionsQuerySchema = z.object({
  difficulty_id: difficultyIdField.optional(),
  question_type_id: questionTypeIdField.optional(),
});

export const updateQuestionBodySchema = z.object({
  difficulty_id: difficultyIdField,
  question: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1),
  image_url: optionalImageUrl,
  image_name: optionalImageName,
  image_id: optionalImageId,
});

export const adminQuestionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateQuestionBody = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>;
export type AdminListQuestionsQuery = z.infer<typeof adminListQuestionsQuerySchema>;
export type MyQuestionsQuery = z.infer<typeof myQuestionsQuerySchema>;
