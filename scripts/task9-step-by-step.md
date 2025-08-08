# Task 9: Create Feature Tables - Step by Step Guide

## Overview
This task creates the core feature tables for trip planning functionality: `itinerary_items`, `budget_items`, and `budget_splits` with proper relationships, constraints, indexes, and RLS policies.

## Prerequisites
- Task 8 completed (invite_tokens table exists)
- Access to Supabase dashboard
- Environment variables configured

## Step-by-Step Instructions

### Step 1: Execute SQL Migration
1. Open Supabase Dashboard
2. Navigate to your TripTogether project
3. Go to SQL Editor
4. Create a new query
5. Copy and paste the contents of `scripts/task9-feature-tables.sql`
6. Execute the query
7. Verify no errors occurred

### Step 2: Verify Database Changes
Run the verification script to ensure everything was created properly:

```bash
# Make sure you're in the project root
cd c:\Users\loben\triptogether

# Run the verification script
node scripts/verify-feature-tables.js
```

### Step 3: Test TypeScript Compilation
Verify that the updated types work correctly:

```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test build process
npm run build
```

## What This Task Creates

### Database Tables (3 total)

#### 1. `itinerary_items` table
- **Columns**: id, trip_id, title, description, location, start_time, end_time, category, created_by, created_at, updated_at
- **Purpose**: Store trip itinerary items and activities
- **Constraints**: Non-empty title/category, valid time ranges
- **Foreign Keys**: References trips and auth.users tables

#### 2. `budget_items` table  
- **Columns**: id, trip_id, title, description, amount, currency, category, paid_by, split_type, is_paid, created_by, created_at, updated_at
- **Purpose**: Store trip expenses and budget items
- **Constraints**: Positive amounts, valid currency format, valid split types
- **Foreign Keys**: References trips and auth.users tables

#### 3. `budget_splits` table
- **Columns**: id, budget_item_id, user_id, amount, percentage, is_paid, created_at, updated_at
- **Purpose**: Handle custom expense splitting among trip members
- **Constraints**: Non-negative amounts, valid percentages (0-100)
- **Foreign Keys**: References budget_items and auth.users tables
- **Unique Constraint**: One split per user per budget item

### Indexes (8 total)
- `idx_itinerary_items_trip_id` - For listing trip itinerary items
- `idx_itinerary_items_start_time` - For chronological ordering
- `idx_itinerary_items_category` - For filtering by category
- `idx_budget_items_trip_id` - For listing trip budget items
- `idx_budget_items_paid_by` - For tracking who paid
- `idx_budget_items_category` - For filtering by category
- `idx_budget_splits_budget_item_id` - For loading splits per budget item
- `idx_budget_splits_user_id` - For user-specific split queries

### RLS Policies (6 total)
- Trip members can view itinerary items for their trips
- Trip members can manage (CRUD) itinerary items for their trips
- Trip members can view budget items for their trips
- Trip members can manage (CRUD) budget items for their trips
- Users can view budget splits for trips they're members of
- Trip members can manage (CRUD) budget splits for their trips

### Triggers (3 total)
- Automatic `updated_at` timestamp updates for all feature tables

## Acceptance Criteria Verification

After completing the steps above, verify:

✅ `itinerary_items` table with proper structure  
✅ `budget_items` and `budget_splits` tables created  
✅ All foreign key relationships working  
✅ Basic RLS policies applied  
✅ CRUD operations testable via Supabase dashboard  
✅ TypeScript types updated and working  
✅ No TypeScript compilation errors  
✅ Build process succeeds  

## Key Features Enabled

This task enables:
- **Itinerary Management**: Add, edit, and organize trip activities
- **Budget Tracking**: Track expenses and spending for trips
- **Expense Splitting**: Split costs among trip members using different methods:
  - Equal splits (default)
  - Custom amounts per person
  - Percentage-based splits
- **Payment Tracking**: Mark expenses as paid/unpaid
- **Categorization**: Organize itinerary and budget items by categories

## Database Schema Details

### Itinerary Items Features
- Flexible scheduling with optional start/end times
- Location tracking for activities
- Category-based organization
- Creator tracking for accountability

### Budget Items Features
- Multi-currency support
- Three splitting methods (equal, custom, percentage)
- Payment status tracking
- Detailed expense categorization

### Budget Splits Features
- Precise amount tracking per user
- Percentage-based calculations
- Individual payment status
- Automatic relationship management

## Troubleshooting

### Common Issues

1. **Foreign key constraint errors**
   - Ensure Tasks 7 and 8 were completed successfully
   - Verify trips and invite_tokens tables exist

2. **Type compilation errors**
   - Check that database.ts exports all new interfaces
   - Ensure no duplicate type definitions

3. **RLS policy conflicts**
   - Policies may already exist from previous runs
   - SQL script handles this with IF NOT EXISTS checks

### Rollback Instructions

If you need to rollback this task:

```sql
-- Drop all feature tables (this will cascade and remove policies, triggers, etc.)
DROP TABLE IF EXISTS public.budget_splits CASCADE;
DROP TABLE IF EXISTS public.budget_items CASCADE;
DROP TABLE IF EXISTS public.itinerary_items CASCADE;
```

## Next Steps

After successful completion:
- Update status.md to mark Task 9 as completed
- Proceed to Task 10: Create Remaining Tables (packing, outfits, messages, photos)

## Files Modified in This Task

- `scripts/task9-feature-tables.sql` - New SQL migration script
- `scripts/verify-feature-tables.js` - New verification script  
- `scripts/task9-step-by-step.md` - This implementation guide
- `src/lib/types/database.ts` - Updated with feature table types
- `src/lib/types/trip.ts` - Cleaned up to avoid duplicates
- `status.md` - Updated task status (to be done after completion)

## API Development Ready

With these tables in place, you can now build APIs for:
- **Itinerary Management**: Create, read, update, delete itinerary items
- **Budget Management**: Full CRUD operations for budget items
- **Expense Splitting**: Automatic and custom split calculations
- **Trip Overview**: Combined view of itinerary and budget data

The database foundation is now ready for implementing the core trip planning features!
