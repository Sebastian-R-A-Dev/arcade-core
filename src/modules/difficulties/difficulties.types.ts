export type DifficultyDto = {
  id: number;
  app_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type QuestionDifficultyDto = {
  id: number;
  name: string;
  is_active: boolean;
};
