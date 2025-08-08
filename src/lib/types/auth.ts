// Authentication-related type definitions

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignupCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

export type UserRole = 'admin' | 'guest';

export interface PermissionCheck {
  canManageTrip: boolean;
  canEditItinerary: boolean;
  canManageBudget: boolean;
  canInviteUsers: boolean;
  canDeleteTrip: boolean;
}