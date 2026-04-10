export type UserRole = 'guest' | 'user' | 'super_admin';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  email: string | null; // Allow null for guest users
  displayName: string;
  userNumber: string; // e.g., "001", "002", "003"
  avatarUrl?: string;
  createdAt: Date;
  settings: UserSettings;
  // NEW FIELDS
  role: UserRole; // 'guest' | 'user' | 'super_admin'
  approvalStatus: ApprovalStatus; // 'approved' | 'pending' | 'rejected'
  isOffline: boolean; // Tracks offline/guest mode
}

export interface UserData extends Omit<User, 'id' | 'createdAt'> {
  createdAt: any; // Firestore Timestamp
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
