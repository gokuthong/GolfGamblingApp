export interface Hole {
  id: string;
  gameId: string;
  holeNumber: number;
  par: number;
  index?: number;
  isUp: boolean;
  isBurn: boolean;
  confirmed?: boolean;
  holeMultiplier?: number;
  second9Applied?: boolean;
}

export interface HoleData extends Omit<Hole, "id"> {}
