export interface HoleResult {
  holeNumber: number;
  par: number;
  isUp: boolean;
  isBurn: boolean;
  playerResults: PlayerHoleResult[];
}

export interface PlayerHoleResult {
  playerId: string;
  playerName: string;
  strokes: number;
  handicap: number;
  netScore: number;
  points: number;
  multipliers: MultiplierInfo;
}

export interface MultiplierInfo {
  isUp: boolean;
  isBurn: boolean;
  isBirdie: boolean;
  isEagle: boolean;
  isAlbatross?: boolean;
  isHoleInOne?: boolean;
  totalMultiplier: number;
}

export interface MatchupResult {
  player1Id: string;
  player2Id: string;
  player1Net: number;
  player2Net: number;
  winnerId?: string;
  basePoints: number;
}

export interface RunningTotal {
  [playerId: string]: number;
}
