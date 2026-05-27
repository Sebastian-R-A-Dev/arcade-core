export type LeaderboardEntryDto = {
  position: number;
  player: string;
  /** Nivel mostrado (número o "Max level"). */
  level_label: string;
  player_level: number;
  score: number;
  wins: number;
};
