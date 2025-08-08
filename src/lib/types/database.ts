/**
 * Database schema types for TripTogether application
 * This file contains TypeScript interfaces that match the Supabase database schema
 */

// Core database types
export interface Database {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
      };
      trip_users: {
        Row: TripUser;
        Insert: TripUserInsert;
        Update: TripUserUpdate;
      };
      invite_tokens: {
        Row: InviteToken;
        Insert: InviteTokenInsert;
        Update: InviteTokenUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      trip_status: 'planning' | 'active' | 'completed' | 'cancelled';
      user_role: 'admin' | 'guest';
    };
  };
}

// Trips table
export interface Trip {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  status: Database['public']['Enums']['trip_status'];
  created_by: string; // UUID reference to auth.users
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  budget_total: number | null;
  max_members: number | null;
  is_public: boolean;
  invite_code: string | null;
  archived: boolean;
}

export interface TripInsert {
  id?: string;
  title: string;
  description?: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  status?: Database['public']['Enums']['trip_status'];
  created_by: string;
  created_at?: string;
  updated_at?: string;
  budget_total?: number | null;
  max_members?: number | null;
  is_public?: boolean;
  invite_code?: string | null;
  archived?: boolean;
}

export interface TripUpdate {
  id?: string;
  title?: string;
  description?: string | null;
  destination?: string;
  start_date?: string;
  end_date?: string;
  status?: Database['public']['Enums']['trip_status'];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  budget_total?: number | null;
  max_members?: number | null;
  is_public?: boolean;
  invite_code?: string | null;
  archived?: boolean;
}

// Trip Users (membership) table
export interface TripUser {
  id: string;
  trip_id: string; // UUID reference to trips table
  user_id: string; // UUID reference to auth.users
  role: Database['public']['Enums']['user_role'];
  joined_at: string; // ISO timestamp
  invited_by: string | null; // UUID reference to auth.users
  invitation_accepted_at: string | null; // ISO timestamp
  last_activity_at: string | null; // ISO timestamp
  is_active: boolean;
  nickname: string | null; // Optional nickname for this trip
}

export interface TripUserInsert {
  id?: string;
  trip_id: string;
  user_id: string;
  role?: Database['public']['Enums']['user_role'];
  joined_at?: string;
  invited_by?: string | null;
  invitation_accepted_at?: string | null;
  last_activity_at?: string | null;
  is_active?: boolean;
  nickname?: string | null;
}

export interface TripUserUpdate {
  id?: string;
  trip_id?: string;
  user_id?: string;
  role?: Database['public']['Enums']['user_role'];
  joined_at?: string;
  invited_by?: string | null;
  invitation_accepted_at?: string | null;
  last_activity_at?: string | null;
  is_active?: boolean;
  nickname?: string | null;
}

// Invite Tokens table
export interface InviteToken {
  id: string;
  token: string;
  trip_id: string; // UUID reference to trips table
  created_by: string; // UUID reference to auth.users
  email: string | null; // Optional: specific email for targeted invites
  max_uses: number; // How many times this token can be used
  current_uses: number; // How many times it has been used
  expires_at: string; // ISO timestamp
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface InviteTokenInsert {
  id?: string;
  token: string;
  trip_id: string;
  created_by: string;
  email?: string | null;
  max_uses?: number;
  current_uses?: number;
  expires_at: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InviteTokenUpdate {
  id?: string;
  token?: string;
  trip_id?: string;
  created_by?: string;
  email?: string | null;
  max_uses?: number;
  current_uses?: number;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Utility types for common queries
export type TripWithMembers = Trip & {
  trip_users: (TripUser & {
    user: {
      id: string;
      email: string;
      user_metadata: {
        full_name?: string;
        avatar_url?: string;
      };
    };
  })[];
};

export type TripMember = TripUser & {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
};

// Helper type for creating new trips with the creator as admin
export type CreateTripData = Omit<TripInsert, 'created_by'>;

// Helper type for trip membership status
export type MembershipStatus = 'admin' | 'guest' | 'not_member';

// Invite token utility types
export type InviteTokenWithTrip = InviteToken & {
  trip: {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    status: Database['public']['Enums']['trip_status'];
  };
};

export type ValidateInviteTokenResult = {
  token_id: string;
  trip_id: string;
  trip_title: string;
  trip_destination: string;
  is_valid: boolean;
  uses_remaining: number;
  expires_at: string;
};

// Helper type for creating invite tokens
export type CreateInviteTokenData = Omit<InviteTokenInsert, 'created_by' | 'created_at' | 'updated_at'>;

// Helper type for invite token status
export type InviteTokenStatus = 'active' | 'expired' | 'exhausted' | 'inactive';

// Export the main Database type as default
export type { Database as default };
