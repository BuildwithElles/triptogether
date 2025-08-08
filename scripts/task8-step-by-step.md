# Task 8: Create Invite System Tables - Step by Step Guide

## Overview
This task creates the `invite_tokens` table with proper relationships, constraints, indexes, RLS policies, and helper functions for the invite system.

## Prerequisites
- Task 7 completed (Core database tables exist)
- Access to Supabase dashboard
- Environment variables configured

## Step-by-Step Instructions

### Step 1: Execute SQL Migration
1. Open Supabase Dashboard
2. Navigate to your TripTogether project
3. Go to SQL Editor
4. Create a new query
5. Copy and paste the contents of `scripts/task8-invite-tokens.sql`
6. Execute the query
7. Verify no errors occurred

### Step 2: Verify Database Changes
Run the verification script to ensure everything was created properly:

```bash
# Make sure you're in the project root
cd c:\Users\loben\triptogether

# Run the verification script
node scripts/verify-invite-tokens.js
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

### Database Table: `invite_tokens`
- **Columns**: id, token, trip_id, created_by, email, max_uses, current_uses, expires_at, is_active, created_at, updated_at
- **Constraints**: Token uniqueness, usage limits, expiration validation
- **Foreign Keys**: References to trips and auth.users tables

### Indexes (5 total)
- `idx_invite_tokens_token` - Unique index on token for fast lookup
- `idx_invite_tokens_trip_id` - Index on trip_id for listing trip invites
- `idx_invite_tokens_created_by` - Index on created_by for user's sent invites
- `idx_invite_tokens_expires_at` - Index on expires_at for cleanup queries
- `idx_invite_tokens_active_valid` - Composite index for active, non-expired tokens

### RLS Policies (5 total)
- Trip admins can view invite tokens for their trips
- Trip admins can create invite tokens for their trips
- Trip admins can update invite tokens for their trips
- Trip admins can delete invite tokens for their trips
- Public access to valid invite tokens (for preview/join flow)

### Helper Functions (2 total)
- `validate_invite_token(token_value)` - Returns invite and trip info
- `use_invite_token(token_value, user_id)` - Uses token and adds user to trip

### Triggers (1 total)
- Automatic `updated_at` timestamp updates

## Acceptance Criteria Verification

After completing the steps above, verify:

✅ `invite_tokens` table created with proper structure  
✅ Relationships to trips table working  
✅ Token uniqueness constraint enforced  
✅ Expiration logic testable  
✅ RLS policies for public invite access  
✅ TypeScript types updated and working  
✅ Helper functions accessible  
✅ No TypeScript compilation errors  
✅ Build process succeeds  

## Troubleshooting

### Common Issues

1. **Foreign key constraint errors**
   - Ensure Task 7 was completed successfully
   - Verify trips table exists

2. **Permission errors**
   - Check that you're using the service role key
   - Verify Supabase project access

3. **TypeScript compilation errors**
   - Check that all import paths are correct
   - Ensure no missing type definitions

4. **RLS policy conflicts**
   - Policies may already exist from previous runs
   - SQL script handles this with IF NOT EXISTS checks

### Rollback Instructions

If you need to rollback this task:

```sql
-- Drop the invite_tokens table (this will cascade and remove policies, triggers, etc.)
DROP TABLE IF EXISTS public.invite_tokens CASCADE;

-- Drop the helper functions
DROP FUNCTION IF EXISTS public.validate_invite_token(TEXT);
DROP FUNCTION IF EXISTS public.use_invite_token(TEXT, UUID);
```

## Next Steps

After successful completion:
- Update status.md to mark Task 8 as completed
- Proceed to Task 9: Create Feature Tables (itinerary_items, budget_items)

## Files Modified in This Task

- `scripts/task8-invite-tokens.sql` - New SQL migration script
- `scripts/verify-invite-tokens.js` - New verification script  
- `src/lib/types/database.ts` - Updated with invite_tokens types
- `status.md` - Updated task status (to be done after completion)

## Key Features Enabled

This task enables:
- Secure invite link generation for trips
- Token-based trip joining system
- Expiration and usage limit controls
- Public preview of trip invitations
- Admin-only invite management
- Automatic user addition to trips via tokens
