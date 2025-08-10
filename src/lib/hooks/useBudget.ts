'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { BudgetItem, BudgetSplit } from '@/lib/types/database';

// Types for budget API responses
export interface BudgetSummary {
  total_budget: number;
  paid_amount: number;
  unpaid_amount: number;
  per_person_amount: number;
  member_count: number;
  currency: string;
}

export interface TripMember {
  user_id: string;
  auth: {
    id: string;
    raw_user_meta_data: {
      name?: string;
      email?: string;
    };
  };
}

export interface BudgetResponse {
  budget_items: (BudgetItem & {
    paid_by_user?: {
      id: string;
      raw_user_meta_data: { name?: string; email?: string };
    };
    created_by_user?: {
      id: string;
      raw_user_meta_data: { name?: string; email?: string };
    };
    budget_splits?: (BudgetSplit & {
      user: {
        id: string;
        raw_user_meta_data: { name?: string; email?: string };
      };
    })[];
  })[];
  summary: BudgetSummary;
  trip_members: TripMember[];
}

export interface CreateBudgetItemData {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category: string;
  paid_by?: string;
  split_type?: 'equal' | 'custom' | 'percentage';
  is_paid?: boolean;
}

export interface UpdateBudgetItemData extends Partial<CreateBudgetItemData> {
  id: string;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch budget data');
  }
  return response.json();
};

// Custom hook for budget management
export function useBudget(tripId: string) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch budget data with SWR
  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR<BudgetResponse>(
    tripId ? `/api/trips/${tripId}/budget` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );

  // Create a new budget item
  const createBudgetItem = useCallback(async (itemData: CreateBudgetItemData) => {
    if (!tripId) throw new Error('Trip ID is required');

    setIsCreating(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create budget item');
      }

      const newItem = await response.json();
      
      // Optimistic update - add new item to the list
      if (data) {
        const updatedData = {
          ...data,
          budget_items: [newItem, ...data.budget_items],
          summary: {
            ...data.summary,
            total_budget: data.summary.total_budget + newItem.amount,
            unpaid_amount: newItem.is_paid 
              ? data.summary.unpaid_amount 
              : data.summary.unpaid_amount + newItem.amount,
            paid_amount: newItem.is_paid 
              ? data.summary.paid_amount + newItem.amount 
              : data.summary.paid_amount,
            per_person_amount: (data.summary.total_budget + newItem.amount) / data.summary.member_count
          }
        };
        mutate(updatedData, false);
      }

      // Revalidate to get the actual server state
      mutate();
      return newItem;
    } catch (error) {
      console.error('Error creating budget item:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [tripId, data, mutate]);

  // Update a budget item
  const updateBudgetItem = useCallback(async (itemId: string, updates: Partial<CreateBudgetItemData>) => {
    if (!tripId) throw new Error('Trip ID is required');

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/budget/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update budget item');
      }

      const updatedItem = await response.json();
      
      // Optimistic update - update item in the list
      if (data) {
        const updatedItems = data.budget_items.map(item => 
          item.id === itemId ? updatedItem : item
        );
        
        // Recalculate summary
        const totalBudget = updatedItems.reduce((sum, item) => sum + item.amount, 0);
        const paidAmount = updatedItems.filter(item => item.is_paid).reduce((sum, item) => sum + item.amount, 0);
        
        const updatedData = {
          ...data,
          budget_items: updatedItems,
          summary: {
            ...data.summary,
            total_budget: totalBudget,
            paid_amount: paidAmount,
            unpaid_amount: totalBudget - paidAmount,
            per_person_amount: totalBudget / data.summary.member_count
          }
        };
        mutate(updatedData, false);
      }

      // Revalidate to get the actual server state
      mutate();
      return updatedItem;
    } catch (error) {
      console.error('Error updating budget item:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [tripId, data, mutate]);

  // Delete a budget item
  const deleteBudgetItem = useCallback(async (itemId: string) => {
    if (!tripId) throw new Error('Trip ID is required');

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/budget/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete budget item');
      }

      // Optimistic update - remove item from the list
      if (data) {
        const itemToDelete = data.budget_items.find(item => item.id === itemId);
        const updatedItems = data.budget_items.filter(item => item.id !== itemId);
        
        if (itemToDelete) {
          const updatedData = {
            ...data,
            budget_items: updatedItems,
            summary: {
              ...data.summary,
              total_budget: data.summary.total_budget - itemToDelete.amount,
              unpaid_amount: itemToDelete.is_paid 
                ? data.summary.unpaid_amount 
                : data.summary.unpaid_amount - itemToDelete.amount,
              paid_amount: itemToDelete.is_paid 
                ? data.summary.paid_amount - itemToDelete.amount 
                : data.summary.paid_amount,
              per_person_amount: (data.summary.total_budget - itemToDelete.amount) / data.summary.member_count
            }
          };
          mutate(updatedData, false);
        }
      }

      // Revalidate to get the actual server state
      mutate();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [tripId, data, mutate]);

  // Toggle paid status of a budget item
  const togglePaidStatus = useCallback(async (itemId: string, isPaid: boolean) => {
    return updateBudgetItem(itemId, { is_paid: isPaid });
  }, [updateBudgetItem]);

  // Calculate per-person amounts for a specific item
  const calculatePersonalAmount = useCallback((budgetItem: BudgetItem, userId: string) => {
    if (!data) return 0;
    
    // Find the split for this user
    const userSplit = (budgetItem as any).budget_splits?.find(
      (split: BudgetSplit) => split.user_id === userId
    );
    
    if (userSplit) {
      return userSplit.amount;
    }
    
    // Fall back to equal split if no specific split found
    return budgetItem.amount / data.summary.member_count;
  }, [data]);

  // Get budget categories with counts
  const getBudgetCategories = useCallback(() => {
    if (!data) return [];
    
    const categoryMap = new Map<string, { count: number; total: number }>();
    
    data.budget_items.forEach(item => {
      const existing = categoryMap.get(item.category) || { count: 0, total: 0 };
      categoryMap.set(item.category, {
        count: existing.count + 1,
        total: existing.total + item.amount
      });
    });
    
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats
    }));
  }, [data]);

  return {
    // Data
    budgetItems: data?.budget_items || [],
    summary: data?.summary || {
      total_budget: 0,
      paid_amount: 0,
      unpaid_amount: 0,
      per_person_amount: 0,
      member_count: 0,
      currency: 'USD'
    },
    tripMembers: data?.trip_members || [],
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Actions
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    togglePaidStatus,
    
    // Utilities
    calculatePersonalAmount,
    getBudgetCategories,
    refresh: mutate,
  };
}

// Export the hook as default
export default useBudget;
