import type { ProgressSnapshot } from '../../shared/progression/progression.js';
import type { QuestionPublicDto } from '../quiz/questions.types.js';

export type ChallengeStartDto = {
  session_id: number;
  total_questions: number;
  question_seconds: number;
  ui_grace_seconds: number;
  status: 'active';
};

export type ChallengeSpinDto = {
  difficulty: { id: number; name: string };
  question: QuestionPublicDto;
  expires_at: string;
  question_seconds: number;
  ui_grace_seconds: number;
  correct_count: number;
  total_questions: number;
  status: 'active';
};

export type ChallengeAnswerResultDto = {
  correct: boolean;
  correct_count: number;
  total_questions: number;
  status: 'active' | 'completed' | 'failed';
  timed_out?: boolean;
  xp_earned?: number;
  progress?: ProgressSnapshot & { games_played: number };
};

export type ChallengeForfeitDto = {
  correct_count: number;
  total_questions: number;
  status: 'failed';
  reason: string;
};
