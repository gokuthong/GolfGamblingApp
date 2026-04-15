export interface Course {
  id: string;
  name: string;
  holes: CourseHole[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseHole {
  holeNumber: number;
  par: number;
  index?: number;
}

export interface CourseData extends Omit<Course, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: any;
  updatedAt?: any;
}
