export interface Course {
  id: string;
  name: string;
  holes: CourseHole[];
  createdBy?: string; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseHole {
  holeNumber: number;
  par: number;
  index?: number; // Difficulty ranking (1 = hardest, 18 = easiest)
}

export interface CourseData extends Omit<Course, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}
