import { HttpError } from '../../shared/constants/httpError.js';
import { env } from '../../shared/config/env.js';
import {
  MAX_ANSWER_ATTEMPTS_PER_QUESTION,
  sessionXpFromCorrectAnswers,
} from '../../shared/progression/progression.js';
import { AppError } from '../../shared/utils/AppError.js';
import { questionsRepository } from '../quiz/questions.repository.js';
import { questionsService } from '../quiz/questions.service.js';
import { userProgressRepository } from '../user-progress/user-progress.repository.js';
import { userProgressService } from '../user-progress/user-progress.service.js';
import { isAnswerCorrect } from './challenge.answer.js';
import { challengeRepository } from './challenge.repository.js';
import type {
  ChallengeAnswerResultDto,
  ChallengeForfeitDto,
  ChallengeSpinDto,
  ChallengeStartDto,
} from './challenge.types.js';
import type {
  ChallengeAnswerBody,
  ChallengeForfeitBody,
  ChallengeTimeoutBody,
} from './challenge.validation.js';

function timingConfig() {
  return {
    questionSeconds: env.challengeQuestionSeconds,
    uiGraceSeconds: env.challengeUiGraceSeconds,
  };
}

function computeExpiresAt(now: Date): Date {
  const { questionSeconds, uiGraceSeconds } = timingConfig();
  return new Date(now.getTime() + (questionSeconds + uiGraceSeconds) * 1000);
}

async function assertActiveSession(
  userId: number,
  appId: number,
  sessionId: number,
) {
  const session = await challengeRepository.findSessionById(sessionId);
  if (!session) {
    throw new AppError('Challenge session not found', HttpError.NOT_FOUND);
  }
  if (session.userId !== userId || session.appId !== appId) {
    throw new AppError('Challenge session does not belong to this user', HttpError.FORBIDDEN);
  }
  if (session.status !== 'active') {
    throw new AppError('Challenge session is not active', HttpError.BAD_REQUEST);
  }
  return session;
}

async function failSession(
  sessionId: number,
  userId: number,
  correctCount: number,
  totalQuestions: number,
): Promise<ChallengeAnswerResultDto> {
  await challengeRepository.endSession(sessionId, 'failed', 0);
  await userProgressRepository.applyChallengeEnd(userId, {
    completed: false,
    correctCount,
    totalQuestions,
    sessionXp: 0,
  });
  return {
    correct: false,
    correct_count: correctCount,
    total_questions: totalQuestions,
    status: 'failed',
  };
}

async function completeSession(
  sessionId: number,
  userId: number,
  correctCount: number,
  totalQuestions: number,
): Promise<ChallengeAnswerResultDto> {
  const xpEarned = sessionXpFromCorrectAnswers(correctCount, totalQuestions);
  await challengeRepository.endSession(sessionId, 'completed', xpEarned);
  const progressRow = await userProgressRepository.applyChallengeEnd(userId, {
    completed: true,
    correctCount,
    totalQuestions,
    sessionXp: xpEarned,
  });
  const progress = await userProgressService.getForUser(userId);
  return {
    correct: true,
    correct_count: correctCount,
    total_questions: totalQuestions,
    status: 'completed',
    xp_earned: xpEarned,
    progress: {
      ...progress,
      games_played: progressRow.gamesPlayed,
    },
  };
}

export const challengeService = {
  async startChallenge(userId: number, appId: number): Promise<ChallengeStartDto> {
    const poolSize = await challengeRepository.countQuestionsForApp(appId);
    if (poolSize === 0) {
      throw new AppError('No questions available for this app', HttpError.BAD_REQUEST);
    }

    const totalQuestions = Math.min(env.challengeQuestionsPerSession, poolSize);

    await challengeRepository.cancelActiveSessions(userId, appId);
    const session = await challengeRepository.createSession(userId, appId, totalQuestions);
    const { questionSeconds, uiGraceSeconds } = timingConfig();

    return {
      session_id: session.id,
      total_questions: totalQuestions,
      question_seconds: questionSeconds,
      ui_grace_seconds: uiGraceSeconds,
      status: 'active',
    };
  },

  async spinQuestion(
    userId: number,
    appId: number,
    sessionId: number,
  ): Promise<ChallengeSpinDto> {
    const session = await assertActiveSession(userId, appId, sessionId);
    const { questionSeconds, uiGraceSeconds } = timingConfig();

    const pending = await challengeRepository.findUnansweredIssue(sessionId);
    if (pending) {
      if (new Date() <= pending.expiresAt) {
        throw new AppError('Finish the current question before spinning again', HttpError.BAD_REQUEST);
      }
      await challengeRepository.recordAttempt(sessionId, pending.questionId, false);
      await challengeRepository.markIssueAnswered(sessionId, pending.questionId);
      await failSession(sessionId, userId, session.correctCount, session.totalQuestions);
      throw new AppError('Time expired for the current question', HttpError.BAD_REQUEST);
    }

    if (session.correctCount >= session.totalQuestions) {
      throw new AppError('Challenge already completed', HttpError.BAD_REQUEST);
    }

    const usedIds = await challengeRepository.getIssuedQuestionIds(sessionId);
    const difficulties = await challengeRepository.findActiveDifficultiesWithQuestions(
      appId,
      usedIds,
    );
    if (difficulties.length === 0) {
      await completeSession(sessionId, userId, session.correctCount, session.totalQuestions);
      throw new AppError('Challenge completed — no more questions', HttpError.BAD_REQUEST);
    }

    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]!;
    const row = await challengeRepository.findRandomQuestionForDifficulty(
      appId,
      difficulty.id,
      usedIds,
    );
    if (!row) {
      throw new AppError('No questions available for the selected difficulty', HttpError.NOT_FOUND);
    }

    const now = new Date();
    const expiresAt = computeExpiresAt(now);
    await challengeRepository.createIssue({
      sessionId,
      questionId: row.id,
      difficultyId: difficulty.id,
      expiresAt,
    });

    return {
      difficulty: { id: difficulty.id, name: difficulty.name },
      question: questionsService.toPublicQuestion(row),
      expires_at: expiresAt.toISOString(),
      question_seconds: questionSeconds,
      ui_grace_seconds: uiGraceSeconds,
      correct_count: session.correctCount,
      total_questions: session.totalQuestions,
      status: 'active',
    };
  },

  async submitAnswer(
    userId: number,
    appId: number,
    sessionId: number,
    payload: ChallengeAnswerBody,
  ): Promise<ChallengeAnswerResultDto> {
    const session = await assertActiveSession(userId, appId, sessionId);

    const issue = await challengeRepository.findIssue(sessionId, payload.question_id);
    if (!issue || issue.answeredAt != null) {
      throw new AppError('Question was not issued for this session', HttpError.BAD_REQUEST);
    }

    const questionRow = await questionsRepository.findById(payload.question_id);
    if (!questionRow || questionRow.appId !== appId) {
      throw new AppError('Question not found for this app', HttpError.NOT_FOUND);
    }

    if (await challengeRepository.hasCorrectAttempt(sessionId, payload.question_id)) {
      throw new AppError('Question already answered correctly in this challenge', HttpError.BAD_REQUEST);
    }

    const attemptCount = await challengeRepository.countAttemptsForQuestion(
      sessionId,
      payload.question_id,
    );
    if (attemptCount >= MAX_ANSWER_ATTEMPTS_PER_QUESTION) {
      throw new AppError(
        `Maximum ${MAX_ANSWER_ATTEMPTS_PER_QUESTION} attempts reached for this question`,
        HttpError.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date();
    const timedOut = now > issue.expiresAt;
    const correct = !timedOut && isAnswerCorrect(questionRow.answer, payload.answer);

    await challengeRepository.markIssueAnswered(sessionId, payload.question_id);
    await challengeRepository.recordAttempt(sessionId, payload.question_id, correct);

    if (!correct) {
      return failSession(sessionId, userId, session.correctCount, session.totalQuestions);
    }

    const updated = await challengeRepository.incrementCorrectCount(sessionId);

    if (updated.correctCount >= updated.totalQuestions) {
      const completed = await completeSession(
        sessionId,
        userId,
        updated.correctCount,
        updated.totalQuestions,
      );
      return { ...completed, timed_out: timedOut };
    }

    return {
      correct: true,
      correct_count: updated.correctCount,
      total_questions: updated.totalQuestions,
      status: 'active',
      timed_out: timedOut,
    };
  },

  async submitTimeout(
    userId: number,
    appId: number,
    sessionId: number,
    payload: ChallengeTimeoutBody,
  ): Promise<ChallengeAnswerResultDto> {
    const session = await assertActiveSession(userId, appId, sessionId);
    const issue = await challengeRepository.findIssue(sessionId, payload.question_id);
    if (!issue || issue.answeredAt != null) {
      throw new AppError('Question was not issued for this session', HttpError.BAD_REQUEST);
    }

    await challengeRepository.markIssueAnswered(sessionId, payload.question_id);
    await challengeRepository.recordAttempt(sessionId, payload.question_id, false);
    return failSession(sessionId, userId, session.correctCount, session.totalQuestions);
  },

  async forfeitChallenge(
    userId: number,
    appId: number,
    sessionId: number,
    payload: ChallengeForfeitBody,
  ): Promise<ChallengeForfeitDto> {
    const session = await assertActiveSession(userId, appId, sessionId);

    const pending = await challengeRepository.findUnansweredIssue(sessionId);
    if (pending) {
      await challengeRepository.markIssueAnswered(sessionId, pending.questionId);
      await challengeRepository.recordAttempt(sessionId, pending.questionId, false);
    }

    await failSession(sessionId, userId, session.correctCount, session.totalQuestions);

    return {
      correct_count: session.correctCount,
      total_questions: session.totalQuestions,
      status: 'failed',
      reason: payload.reason ?? 'user_exit',
    };
  },
};
