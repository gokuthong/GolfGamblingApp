export type UserRole = 'guest' | 'user' | 'super_admin';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  userNumber: string;
  avatarUrl?: string;
  createdAt: Date;
  settings: UserSettings;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  isOffline: boolean;
}

export interface UserData extends Omit<User, 'id' | 'createdAt'> {
  createdAt: any;
}

export interface UserSettings {
  darkMode: boolean;
  hapticFeedback: boolean;
  defaultHandicap: number;
}

export interface PendingUser {
  id: string;
  email: string;
  displayName: string;
  userNumber: string;
  createdAt: Date;
  avatarUrl?: string;
}
