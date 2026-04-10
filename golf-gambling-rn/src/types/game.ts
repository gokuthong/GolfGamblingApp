export interface Game {
  id: string;
  date: Date;
  status: 'active' | 'completed';
  playerIds: string[];
  createdBy?: string; // User ID
  createdAt?: Date;
  completedAt?: Date;
  courseId?: string; // Course ID
  courseName?: string; // Course name
  // Handicaps between player pairs, per hole
  // First key: "fromPlayerId_toPlayerId" (directional, NOT alphabetically sorted)
  // Second key: hole number as string (e.g., "1", "2", "3")
  // Value: number of strokes toPlayerId receives from fromPlayerId on that specific hole
  // Example: handicaps["playerA_playerB"]["1"] = 2 means on hole 1, playerB receives 2 strokes from playerA
  handicaps?: { [pairKey: string]: { [holeNumber: string]: number } };
}

export interface GameData extends Omit<Game, 'id' | 'date' | 'createdAt' | 'completedAt'> {
  date: any; // Firestore Timestamp
  createdAt?: any;
  completedAt?: any;
}
