# Task 23 Step-by-Step Implementation Guide

**Task**: Build Basic Itinerary Management  
**Objective**: CRUD operations for itinerary items  
**Estimated Time**: 30 minutes  

## Step 1: Create API Route (10 minutes)

### File: `src/app/api/trips/[tripId]/itinerary/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const itineraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  category: z.string().min(1, 'Category is required'),
});

// Implement GET, POST, PUT, DELETE methods
// Include trip member verification for all operations
// Add comprehensive error handling
```

**Key Features**:
- Trip member authentication for all operations
- Zod validation for data integrity
- User attribution with profile joining
- Time order validation (end > start)

## Step 2: Create Custom Hook (8 minutes)

### File: `src/lib/hooks/useItinerary.ts`

```typescript
import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';

export function useItinerary(tripId: string) {
  const { data: items = [], error, mutate: mutateItems } = useSWR(
    tripId ? `/api/trips/${tripId}/itinerary` : null,
    fetcher
  );

  // Implement addItem, updateItem, deleteItem functions
  // Return items, loading states, and CRUD functions
}

export const ITINERARY_CATEGORIES_LIST = [
  'Transportation', 'Accommodation', 'Activity', 
  'Dining', 'Sightseeing', 'Meeting', 'Other'
] as const;
```

**Key Features**:
- SWR integration for caching and optimistic updates
- Loading and error state management
- Category constants for consistency

## Step 3: Create UI Components (5 minutes)

### Install missing dependencies:
```bash
npm install @radix-ui/react-alert-dialog
```

### Add required ShadCN components:
- `src/components/ui/select.tsx`
- `src/components/ui/dropdown-menu.tsx`

Copy standard ShadCN implementations for these components.

## Step 4: Create Add Item Component (12 minutes)

### File: `src/components/itinerary/AddItineraryItem.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const addItineraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

export function AddItineraryItem({ tripId, onSuccess, onCancel }) {
  // Implement form with React Hook Form
  // Include validation and error handling
  // Professional UI with ShadCN components
}
```

**Key Features**:
- React Hook Form with Zod validation
- DateTime input handling
- Category selection dropdown
- Professional form design

## Step 5: Create List Component (10 minutes)

### File: `src/components/itinerary/ItineraryList.tsx`

```typescript
'use client';

import { format, parseISO } from 'date-fns';

export function ItineraryList({ tripId, onEditItem }) {
  const { items, isLoading, error, deleteItem } = useItinerary(tripId);

  // Group items by date
  const groupedItems = items.reduce((groups, item) => {
    const groupKey = item.start_time 
      ? format(parseISO(item.start_time), 'yyyy-MM-dd')
      : 'No Date';
    // ... grouping logic
  }, {});

  // Render grouped items with actions
}
```

**Key Features**:
- Date grouping and sorting
- Category badges with colors
- Edit/delete action menus
- User attribution display

## Step 6: Create Main Page (5 minutes)

### File: `src/app/(dashboard)/trips/[tripId]/itinerary/page.tsx`

```typescript
'use client';

import { TripProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { AddItineraryItem } from '@/components/itinerary/AddItineraryItem';

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return (
    <TripProtectedRoute tripId={tripId}>
      {/* Header, Add Form, List Components */}
    </TripProtectedRoute>
  );
}
```

**Key Features**:
- Protected route wrapper
- Integrated add/list functionality
- Professional page layout

## Step 7: Update Exports (2 minutes)

### Update barrel exports:
- `src/components/itinerary/index.ts`
- `src/lib/hooks/index.ts`
- `src/components/ui/index.ts`

## Step 8: Test and Verify (3 minutes)

### Run verification commands:
```bash
npx tsc --noEmit          # Check TypeScript
npm run build            # Verify production build
npm run dev              # Start development server
```

### Test functionality:
- Navigate to `/trips/[tripId]/itinerary`
- Add new itinerary items
- Verify data persistence
- Test delete functionality
- Check responsive design

## Acceptance Criteria Checklist

- ✅ List view displays items sorted by start date/time
- ✅ Can add, edit, delete items with confirmation
- ✅ Validations for required fields (title, category)
- ✅ Professional UI with proper error handling
- ✅ Mobile-responsive design
- ✅ Trip member authentication

## Common Issues and Solutions

### Issue: TypeScript errors with Radix components
**Solution**: Install missing dependencies and create proper UI components

### Issue: Date formatting errors
**Solution**: Use date-fns with proper error handling for invalid dates

### Issue: Authentication errors
**Solution**: Ensure proper trip member verification in API routes

### Issue: SWR caching issues
**Solution**: Use proper mutate functions after CRUD operations

## Performance Considerations

- Use SWR for efficient data fetching and caching
- Implement optimistic updates for better UX
- Group database queries to minimize requests
- Use proper loading states and error boundaries

## Security Considerations

- Verify trip membership for all operations
- Validate all input data with Zod schemas
- Use proper RLS policies in database
- Sanitize user input in forms

## Next Steps

After completing Task 23:
1. Test all functionality thoroughly
2. Verify responsive design
3. Check TypeScript compilation
4. Run production build
5. Update status documentation
6. Ready for Task 24: Budget Tracking

**Total Implementation Time**: ~45 minutes (including UI component setup)
**Difficulty Level**: Medium
**Dependencies**: Tasks 1-22 completed
