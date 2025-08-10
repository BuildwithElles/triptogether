// Library barrel exports
export * from './supabase';
export * from './auth';
export * from './api';
export * from './hooks';
export * from './context';
export * from './utils';

// Export types selectively to avoid conflicts
export type {
  Database,
  BudgetItem,
  BudgetItemInsert,
  BudgetItemUpdate,
  BudgetSplit,
  BudgetSplitInsert,
  BudgetSplitUpdate,
  ItineraryItem,
  ItineraryItemInsert,
  ItineraryItemUpdate,
  Trip,
  TripInsert,
  TripUpdate,
  TripUser,
  TripUserInsert,
  TripUserUpdate,
  InviteToken,
  InviteTokenInsert,
  InviteTokenUpdate,
} from './types/database';