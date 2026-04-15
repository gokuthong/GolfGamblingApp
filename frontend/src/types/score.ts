export interface Score {
  id: string;
  holeId: string;
  playerId: string;
  gameId?: string;
  strokes: number;
  handicap: number;
  isUp?: boolean;
  isBurn?: boolean;
  multiplier?: number;
}

export interface ScoreData extends Omit<Score, 'id'> {}

export interface ScoreWithDetails extends Score {
  playerName?: string;
  netScore: number;
}
