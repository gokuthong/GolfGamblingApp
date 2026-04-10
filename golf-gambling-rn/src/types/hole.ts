export interface Hole {
  id: string;
  gameId: string;
  holeNumber: number; // 1-18
  par: number; // 3, 4, or 5
  index?: number; // Difficulty ranking (1 = hardest, 18 = easiest)
  isUp: boolean; // DEPRECATED - now per-player in Score
  isBurn: boolean; // DEPRECATED - now per-player in Score
  confirmed?: boolean; // Whether the hole has been confirmed (Next button pressed)
}

export interface HoleData extends Omit<Hole, 'id'> {}
