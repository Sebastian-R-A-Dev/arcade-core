import { MAX_PLAYER_LEVEL } from './progression.js';

export const LEVEL_MILESTONE_STEP = 100;

/** Hito de mensaje para un nivel de jugador (0, 100, …, 1000). */
export function playerLevelMilestone(level: number): number {
  const clamped = Math.min(Math.max(Math.floor(level), 0), MAX_PLAYER_LEVEL);
  if (clamped >= MAX_PLAYER_LEVEL) return MAX_PLAYER_LEVEL;
  return Math.floor(clamped / LEVEL_MILESTONE_STEP) * LEVEL_MILESTONE_STEP;
}

export function formatPlayerLevelLabel(level: number): string {
  const clamped = Math.min(Math.max(Math.floor(level), 0), MAX_PLAYER_LEVEL);
  if (clamped >= MAX_PLAYER_LEVEL) return 'Max level';
  return String(clamped);
}

export function isValidMilestoneLevel(level: number): boolean {
  if (!Number.isInteger(level) || level < 0 || level > MAX_PLAYER_LEVEL) return false;
  return level === 0 || level % LEVEL_MILESTONE_STEP === 0;
}
