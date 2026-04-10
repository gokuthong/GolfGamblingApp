export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  createdBy?: string; // User who created
  stats?: PlayerStats;
  isGuest?: boolean; // True for temporary guest players
  userId?: string; // Firebase Auth UID for registered users
  userNumber?: string; // e.g., "001" - only for registered users
}

export interface PlayerData extends Omit<Player, 'id'> {}

export interface PlayerStats {
  gamesPlayed: number;
  totalPoints: number;
  wins: number;
  birdies: number;
  eagles: number;
}
