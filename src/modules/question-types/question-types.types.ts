export type QuestionTypeDto = {
  id: number;
  slug: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type QuestionTypeRefDto = {
  id: number;
  slug: string;
  label: string;
  is_active: boolean;
};
