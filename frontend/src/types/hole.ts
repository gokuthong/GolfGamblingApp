export interface Hole {
  id: string;
  gameId: string;
  holeNumber: number;
  par: number;
  index?: number;
  isUp: boolean;
  isBurn: boolean;
  confirmed?: boolean;
}

export interface HoleData extends Omit<Hole, 'id'> {}
