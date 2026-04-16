export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  createdBy?: string;
  stats?: PlayerStats;
  isGuest?: boolean;
  userId?: string;
  userNumber?: string;
}

export interface PlayerData extends Omit<Player, "id"> {}

export interface PlayerStats {
  gamesPlayed: number;
  totalPoints: number;
  wins: number;
  birdies: number;
  eagles: number;
}
