export interface Score {
  id: string;
  holeId: string;
  playerId: string;
  gameId?: string; // Denormalized for queries
  strokes: number; // 0-15
  handicap: number; // 0-2
  isUp?: boolean; // Per-player 2x multiplier (deprecated - use multiplier instead)
  isBurn?: boolean; // Per-player 3x multiplier (deprecated - use multiplier instead)
  multiplier?: number; // Multiplier value: 1 (none), 2, 3, 4, or 6
}

export interface ScoreData extends Omit<Score, 'id'> {}

export interface ScoreWithDetails extends Score {
  playerName?: string;
  netScore: number;
}
