export interface Game {
  id: string;
  date: Date;
  status: 'active' | 'completed';
  playerIds: string[];
  createdBy?: string;
  createdAt?: Date;
  completedAt?: Date;
  courseId?: string;
  courseName?: string;
  handicaps?: { [pairKey: string]: { [holeNumber: string]: number } };
}

export interface GameData extends Omit<Game, 'id' | 'date' | 'createdAt' | 'completedAt'> {
  date: any;
  createdAt?: any;
  completedAt?: any;
}
