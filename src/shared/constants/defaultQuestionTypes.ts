/** Catálogo inicial de tipos de pregunta (slug estable para UI y validación). */
export const DEFAULT_QUESTION_TYPES = [
  {
    slug: 'fill_blank',
    label: 'Fill in the blank',
    description: 'Text with a gap; answer must match one option.',
    sort_order: 10,
  },
  {
    slug: 'multiple_choice',
    label: 'Multiple choice',
    description: 'One correct option from a list.',
    sort_order: 20,
  },
  {
    slug: 'word_order',
    label: 'Word order',
    description: 'Reorder tokens into the correct sentence.',
    sort_order: 30,
  },
  {
    slug: 'image_multiple_choice',
    label: 'Image multiple choice',
    description: 'Image plus options; answer must match one option.',
    sort_order: 40,
  },
] as const;

export type DefaultQuestionTypeSlug = (typeof DEFAULT_QUESTION_TYPES)[number]['slug'];
