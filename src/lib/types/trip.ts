// Trip-related type definitions
// Core Trip, TripUser, InviteToken, ItineraryItem, and BudgetItem types are now defined in database.ts
// This file contains additional utility types and interfaces for specific use cases

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