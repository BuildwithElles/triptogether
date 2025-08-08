// Trip-related type definitions
// Core Trip and TripUser types are now defined in database.ts
// InviteToken is also now defined in database.ts with the complete schema

export interface ItineraryItem {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  paid_by?: string;
  split_type: 'equal' | 'custom' | 'percentage';
  is_paid: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  is_packed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}