'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Check, 
  X, 
  Edit2, 
  Trash2,
  MoreHorizontal,
  Receipt,
  PiggyBank
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { BudgetItemSkeleton, ListSkeleton } from '@/components/common/SkeletonComponents';
import { useBudget, type BudgetResponse } from '@/lib/hooks/useBudget';
import { AddExpense } from './AddExpense';

interface BudgetTrackerProps {
  tripId: string;
}

export function BudgetTracker({ tripId }: BudgetTrackerProps) {
  const {
    budgetItems,
    summary,
    tripMembers,
    isLoading,
    error,
    togglePaidStatus,
    deleteBudgetItem,
    isUpdating,
    isDeleting,
    getBudgetCategories
  } = useBudget(tripId);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleTogglePaid = async (itemId: string, currentStatus: boolean) => {
    try {
      await togglePaidStatus(itemId, !currentStatus);
    } catch (error) {
      console.error('Error toggling paid status:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await deleteBudgetItem(itemId);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const formatCurrency = (amount: number, currency: string = summary.currency) => {
    const currencySymbol = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    }[currency] || '$';
    
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const getUserDisplayName = (user: any) => {
    return user?.raw_user_meta_data?.name || user?.raw_user_meta_data?.email || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Budget items skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <ListSkeleton 
            itemCount={4}
            renderItem={() => <BudgetItemSkeleton />}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">Error loading budget</div>
        <div className="text-sm text-muted-foreground">{error.message}</div>
      </div>
    );
  }

  const categories = getBudgetCategories();

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.total_budget)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetItems.length} expense{budgetItems.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(summary.paid_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.total_budget > 0 
                ? `${((summary.paid_amount / summary.total_budget) * 100).toFixed(1)}% of total`
                : '0% of total'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(summary.unpaid_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.total_budget > 0 
                ? `${((summary.unpaid_amount / summary.total_budget) * 100).toFixed(1)}% remaining`
                : '0% remaining'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Person</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(summary.per_person_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.member_count} member{summary.member_count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expenses</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage trip expenses with automatic splitting
          </p>
        </div>
        <AddExpense tripId={tripId} tripMembers={tripMembers} />
      </div>

      {/* Category Summary */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(({ category, count, total }) => (
                <div key={category} className="text-center">
                  <div className="text-sm font-medium">{category}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {count} item{count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {budgetItems.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No expenses yet"
          description="Start tracking your trip expenses by adding your first expense item"
          action={
            <AddExpense 
              tripId={tripId} 
              tripMembers={tripMembers}
              trigger={
                <Button>
                  <Receipt className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="space-y-3">
          {budgetItems.map((item) => (
            <Card key={item.id} className={`transition-all ${item.is_paid ? 'bg-green-50 border-green-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base truncate">{item.title}</h4>
                      <Badge variant={item.is_paid ? 'default' : 'secondary'} className="shrink-0">
                        {item.category}
                      </Badge>
                      {item.is_paid && (
                        <Badge variant="outline" className="shrink-0 text-green-600 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-lg text-foreground">
                        {formatCurrency(item.amount, item.currency)}
                      </span>
                      {item.paid_by_user && (
                        <span>
                          Paid by {getUserDisplayName(item.paid_by_user)}
                        </span>
                      )}
                      <span>
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </span>
                      <span>
                        Split: {item.split_type === 'equal' ? 'Equal' : item.split_type}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Per-person breakdown for equal splits */}
                    {item.split_type === 'equal' && summary.member_count > 1 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">
                          {formatCurrency(item.amount / summary.member_count)} per person
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant={item.is_paid ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleTogglePaid(item.id, item.is_paid)}
                      disabled={isUpdating}
                      className={item.is_paid ? "text-green-600 border-green-200" : ""}
                    >
                      {isUpdating ? (
                        <LoadingSpinner className="h-3 w-3" />
                      ) : item.is_paid ? (
                        <X className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span className="ml-1 hidden sm:inline">
                        {item.is_paid ? 'Unpaid' : 'Paid'}
                      </span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => toggleExpanded(item.id)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedItems.has(item.id) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Created by:</span>
                        <div className="text-muted-foreground">
                          {item.created_by_user ? getUserDisplayName(item.created_by_user) : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Added on:</span>
                        <div className="text-muted-foreground">
                          {format(new Date(item.created_at), 'PPp')}
                        </div>
                      </div>
                    </div>
                    
                    {(item as any).budget_splits && (item as any).budget_splits.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Split Details:</span>
                        <div className="mt-1 space-y-1">
                          {(item as any).budget_splits.map((split: any) => (
                            <div key={split.id} className="flex justify-between text-sm">
                              <span>{getUserDisplayName(split.user)}</span>
                              <span>{formatCurrency(split.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default BudgetTracker;
