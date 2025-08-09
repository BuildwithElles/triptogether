# TripTogether MVP Development Plan

A granular task breakdown for building the collaborative trip planning application. Each task is designed to take 15-30 minutes and has a single, specific deliverable.

## Phase 1: Setup Phase (Environment & Initial Structure)

### Task 1: Initialize Next.js Project Structure
- **Objective**: Create the basic Next.js 14 project with App Router and initial configuration
- **Files to modify/create**: 
  - `package.json`
  - `next.config.js`
  - `tsconfig.json`
  - `tailwind.config.js`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/globals.css`
- **Acceptance Criteria**: 
  - Next.js 14 project runs on `http://localhost:3000`
  - Tailwind CSS is configured and working
  - TypeScript compilation succeeds
  - Basic "Hello TripTogether" page displays
- **Dependencies**: None
- **Rollback**: Delete project directory and restart
- **Estimated time**: 20 minutes

### Task 2: Install and Configure Core Dependencies
- **Objective**: Install all required packages for Supabase, UI components, and utilities
- **Files to modify/create**: 
  - `package.json`
  - `components.json` (ShadCN config)
- **Acceptance Criteria**: 
  - All dependencies from architecture document installed
  - No package conflicts or vulnerabilities
  - `npm run build` succeeds
  - ShadCN UI configured properly
- **Dependencies**: Task 1
- **Rollback**: `git checkout package.json && npm install`
- **Estimated time**: 15 minutes

### Task 3: Create Environment Configuration
- **Objective**: Set up environment variables and configuration files
- **Files to modify/create**: 
  - `.env.local`
  - `.env.example`
  - `.gitignore`
  - `src/lib/utils/constants.ts`
- **Acceptance Criteria**: 
  - Environment variables template created
  - Local environment file configured (with placeholder values)
  - Constants file with app configuration
  - Sensitive files properly ignored by git
- **Dependencies**: Task 2
- **Rollback**: Remove environment files, use default Next.js config
- **Estimated time**: 15 minutes

### Task 4: Set Up Basic Folder Structure
- **Objective**: Create the complete folder structure as defined in architecture
- **Files to modify/create**: 
  - All directories from architecture document
  - Basic `index.ts` files for barrel exports
  - Placeholder components with TypeScript interfaces
- **Acceptance Criteria**: 
  - All folders exist as per architecture
  - No TypeScript compilation errors
  - Barrel exports work for main directories
  - Basic component structure in place
- **Dependencies**: Task 3
- **Rollback**: Remove created directories, keep only Next.js defaults
- **Estimated time**: 25 minutes

### Task 5: Configure Tailwind and ShadCN UI Base Components
- **Objective**: Set up the design system foundation with core UI components
- **Files to modify/create**: 
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`
  - `src/lib/utils/cn.ts`
  - Updated `tailwind.config.js`
- **Acceptance Criteria**: 
  - Basic UI components render correctly
  - Tailwind classes work as expected
  - Class name utility function works
  - Components follow ShadCN patterns
- **Dependencies**: Task 4
- **Rollback**: Remove UI components, use basic HTML elements
- **Estimated time**: 20 minutes

## Phase 2: Database Phase (Schema & Connections)

### Task 6: Set Up Supabase Project and Local Configuration
- **Objective**: Create Supabase project and configure local connection
- **Files to modify/create**: 
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - Updated `.env.local` with Supabase credentials
- **Acceptance Criteria**: 
  - Supabase project created and accessible
  - Client and server configurations work
  - Connection test succeeds from both client and server
  - Environment variables properly set
- **Dependencies**: Task 5
- **Rollback**: Remove Supabase config files, use mock data
- **Estimated time**: 25 minutes

### Task 7: Create Core Database Tables (trips, trip_users)
- **Objective**: Set up the foundational database schema for trips and user relationships
- **Files to modify/create**: 
  - SQL migration files in Supabase dashboard
  - `src/lib/types/database.ts` (generated types)
- **Acceptance Criteria**: 
  - `trips` table created with all columns
  - `trip_users` table created with proper relationships
  - Foreign key constraints working
  - RLS policies applied and tested
  - TypeScript types generated and imported
- **Dependencies**: Task 6
- **Rollback**: Drop created tables via Supabase dashboard
- **Estimated time**: 30 minutes

### Task 8: Create Invite System Tables (invite_tokens)
- **Objective**: Set up the invite token system for trip invitations
- **Files to modify/create**: 
  - SQL migration for `invite_tokens` table
  - Updated `src/lib/types/database.ts`
- **Acceptance Criteria**: 
  - `invite_tokens` table created with proper structure
  - Relationships to trips table working
  - Token uniqueness constraint enforced
  - Expiration logic testable
  - RLS policies for public invite access
- **Dependencies**: Task 7
- **Rollback**: Drop `invite_tokens` table
- **Estimated time**: 20 minutes

### Task 9: Create Feature Tables (itinerary_items, budget_items)
- **Objective**: Set up tables for core trip features
- **Files to modify/create**: 
  - SQL migrations for feature tables
  - Updated database types
- **Acceptance Criteria**: 
  - `itinerary_items` table with proper structure
  - `budget_items` and `budget_splits` tables created
  - All foreign key relationships working
  - Basic RLS policies applied
  - CRUD operations testable via Supabase dashboard
- **Dependencies**: Task 8
- **Rollback**: Drop feature tables, keep core trip structure
- **Estimated time**: 30 minutes

### Task 10: Create Remaining Tables (packing, outfits, messages, photos)
- **Objective**: Complete the database schema with remaining feature tables
- **Files to modify/create**: 
  - SQL migrations for remaining tables
  - Final database types update
  - Database triggers for updated_at timestamps
- **Acceptance Criteria**: 
  - All tables from architecture created
  - Triggers for timestamp updates working
  - Complete RLS policy coverage
  - All relationships properly constrained
  - Full TypeScript type coverage
- **Dependencies**: Task 9
- **Rollback**: Drop additional tables, keep core + feature tables
- **Estimated time**: 30 minutes

### Task 11: Set Up Supabase Storage Buckets
- **Objective**: Configure file storage for photos, avatars, and outfit images
- **Files to modify/create**: 
  - Storage bucket configurations in Supabase
  - Storage policies for access control
  - `src/lib/utils/storage.ts` helper functions
- **Acceptance Criteria**: 
  - Three storage buckets created (trip-photos, user-avatars, outfit-images)
  - Proper access policies applied
  - Upload/download functionality testable
  - File size and type restrictions enforced
- **Dependencies**: Task 10
- **Rollback**: Delete storage buckets and policies
- **Estimated time**: 25 minutes

## Phase 3: Authentication Phase (Auth Setup & Protected Routes)

### Task 12: Set Up Supabase Auth Configuration
- **Objective**: Configure Supabase authentication with email/password
- **Files to modify/create**: 
  - `src/lib/auth/config.ts`
  - `src/app/api/auth/callback/route.ts`
  - Auth settings in Supabase dashboard
- **Acceptance Criteria**: 
  - Email/password authentication enabled
  - Auth callback route working
  - User registration and login functional
  - Email confirmation flow configured
- **Dependencies**: Task 11
- **Rollback**: Disable auth in Supabase, remove auth files
- **Estimated time**: 25 minutes

### Task 13: Create Authentication Context and Hooks
- **Objective**: Set up React context for authentication state management
- **Files to modify/create**: 
  - `src/lib/context/AuthContext.tsx`
  - `src/lib/hooks/useAuth.ts`
  - `src/components/auth/AuthProvider.tsx`
- **Acceptance Criteria**: 
  - Auth context provides user state across app
  - useAuth hook returns current user and auth methods
  - Loading states handled properly
  - Auth state persists across page refreshes
- **Dependencies**: Task 12
- **Rollback**: Remove context files, use direct Supabase calls
- **Estimated time**: 20 minutes

### Task 14: Create Login and Signup Forms
- **Objective**: Build authentication UI components with form validation
- **Files to modify/create**: 
  - `src/components/auth/LoginForm.tsx`
  - `src/components/auth/SignupForm.tsx`
  - `src/lib/utils/validation.ts`
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/signup/page.tsx`
  - `src/app/(auth)/layout.tsx`
- **Acceptance Criteria**: 
  - Login form with email/password validation
  - Signup form with name, email, password fields
  - Form validation with error messages
  - Loading states during authentication
  - Redirect to dashboard after successful auth
- **Dependencies**: Task 13
- **Rollback**: Remove auth forms, use basic HTML forms
- **Estimated time**: 30 minutes

### Task 15: Implement Route Protection Middleware
- **Objective**: Set up middleware to protect authenticated routes
- **Files to modify/create**: 
  - `src/middleware.ts`
  - `src/lib/auth/helpers.ts`
- **Acceptance Criteria**: 
  - Unauthenticated users redirected to login
  - Protected routes require valid session
  - Redirect preserves intended destination
  - Admin-only routes properly protected
- **Dependencies**: Task 14
- **Rollback**: Remove middleware, allow open access to all routes
- **Estimated time**: 25 minutes

### Task 16: Create Protected Route HOC and Components
- **Objective**: Build reusable components for route protection
- **Files to modify/create**: 
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/components/common/LoadingSpinner.tsx`
  - `src/lib/utils/permissions.ts`
- **Acceptance Criteria**: 
  - ProtectedRoute component wraps protected pages
  - Loading spinner shows during auth checks
  - Permission utilities for role-based access
  - Graceful handling of auth failures
- **Dependencies**: Task 15
- **Rollback**: Remove protection components, use basic auth checks
- **Estimated time**: 20 minutes

## Phase 4: Core Features Phase (Main Functionality)

### Task 17: Create Basic Dashboard Layout and Navigation
- **Objective**: Build the main dashboard structure with navigation
- **Files to modify/create**: 
  - `src/app/(dashboard)/layout.tsx`
  - `src/components/dashboard/DashboardNav.tsx`
  - `src/app/(dashboard)/dashboard/page.tsx`
  - `src/components/common/EmptyState.tsx`
- **Acceptance Criteria**: 
  - Dashboard layout with sidebar navigation
  - Responsive design for mobile/desktop
  - Navigation highlights current page
  - Empty state for users with no trips
- **Dependencies**: Task 16
- **Rollback**: Use basic page layout without navigation
- **Estimated time**: 30 minutes

### Task 18: Implement Trip Creation API and Form
- **Objective**: Build trip creation functionality with API endpoint
- **Files to modify/create**: 
  - `src/app/api/trips/route.ts`
  - `src/components/dashboard/CreateTripForm.tsx`
  - `src/lib/hooks/useTrip.ts`
- **Acceptance Criteria**: 
  - POST /api/trips creates new trip
  - Form validates trip data (title, dates, destination)
  - Creator automatically added as admin
  - Success redirects to trip dashboard
  - Error handling with user feedback
- **Dependencies**: Task 17
- **Rollback**: Remove API route and form, use mock data
- **Estimated time**: 30 minutes

### Task 19: Create Trip List and Trip Cards
- **Objective**: Display user's trips in dashboard with trip cards
- **Files to modify/create**: 
  - `src/components/dashboard/TripCard.tsx`
  - `src/components/dashboard/TripList.tsx`
  - Updated dashboard page to show trips
- **Acceptance Criteria**: 
  - Trip cards show title, destination, dates
  - Cards link to individual trip dashboards
  - Loading state while fetching trips
  - Empty state when no trips exist
  - Responsive grid layout
- **Dependencies**: Task 18
- **Rollback**: Show static trip data instead of dynamic
- **Estimated time**: 25 minutes

**Task 20: Build Individual Trip Dashboard**
- **Objective**: Create the main trip dashboard page with trip details, members list, and navigation tabs.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/page.tsx`  
  - `src/components/trip/TripHeader.tsx`  
  - `src/components/trip/MembersList.tsx`  
  - `src/app/api/trips/[tripId]/route.ts`  
- **Acceptance Criteria**:  
  - Trip details display correctly (title, destination, dates).  
  - Members list shows all participants with role indicators (admin/guest).  
  - Navigation tabs visible for itinerary, budget, packing, chat, gallery, outfits.  
  - Invalid `tripId` returns a 404 page.  
- **Dependencies**: Task 19 completed.  
- **Rollback**: Revert the new files and changes using `git checkout` to last commit before task.  
- **Estimated time**: 25 minutes  

**Task 21: Implement Invite Link Generation**
- **Objective**: Allow admins to generate invite links with expiry and usage limits.
- **Files to modify/create**:  
  - `src/app/api/trips/[tripId]/invite/route.ts`  
  - `src/components/trip/InviteLink.tsx`  
  - `src/lib/utils/invite.ts`  
- **Acceptance Criteria**:  
  - Admin can click “Generate Invite” to create a link.  
  - Link includes expiration date and usage limit.  
  - Copy-to-clipboard works.  
  - Backend enforces expiry and usage limits.  
- **Dependencies**: Task 20 completed.  
- **Rollback**: Remove `InviteLink` component and API route; restore database to remove test invites.  
- **Estimated time**: 20 minutes  

**Task 22: Create Invite Preview and Join Flow**
- **Objective**: Build public preview page for invites and allow users to join trips.
- **Files to modify/create**:  
  - `src/app/invite/[token]/preview/page.tsx`  
  - `src/app/invite/[token]/join/page.tsx`  
  - `src/components/invite/InvitePreview.tsx`  
  - `src/app/api/invite/[token]/route.ts`  
- **Acceptance Criteria**:  
  - Invite preview shows trip info.  
  - Authenticated users can join directly; unauthenticated users are prompted to log in.  
  - Expired/invalid invites show error page.  
  - Invite usage tracking updates correctly.  
- **Dependencies**: Task 21 completed.  
- **Rollback**: Remove invite pages and API route; delete test invite tokens.  
- **Estimated time**: 30 minutes  

**Task 23: Build Basic Itinerary Management**
- **Objective**: CRUD operations for itinerary items.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/itinerary/page.tsx`  
  - `src/app/api/trips/[tripId]/itinerary/route.ts`  
  - `src/components/itinerary/ItineraryList.tsx`  
  - `src/components/itinerary/AddItineraryItem.tsx`  
  - `src/lib/hooks/useItinerary.ts`  
- **Acceptance Criteria**:  
  - List view displays items sorted by start date/time.  
  - Can add, edit, delete items with confirmation.  
  - Validations for required fields (title, date).  
- **Dependencies**: Task 22 completed.  
- **Rollback**: Remove itinerary components and API route.  
- **Estimated time**: 30 minutes  

**Task 24: Implement Basic Budget Tracking**
- **Objective**: Add trip expense tracking with equal splitting.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/budget/page.tsx`  
  - `src/app/api/trips/[tripId]/budget/route.ts`  
  - `src/components/budget/BudgetTracker.tsx`  
  - `src/components/budget/AddExpense.tsx`  
  - `src/lib/hooks/useBudget.ts`  
- **Acceptance Criteria**:  
  - Add expenses with amount and category.  
  - Show total budget and per-person equal split.  
  - Mark expenses as paid/unpaid.  
- **Dependencies**: Task 23 completed.  
- **Rollback**: Remove budget components and API route; drop test budget rows from DB.  
- **Estimated time**: 25 minutes  

**Task 25: Create Basic Packing List Feature**
- **Objective**: Personal packing list per user with categories and progress tracking.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/packing/page.tsx`  
  - `src/app/api/trips/[tripId]/packing/route.ts`  
  - `src/components/packing/PackingList.tsx`  
  - `src/components/packing/AddPackingItem.tsx`  
  - `src/lib/hooks/usePacking.ts`  
- **Acceptance Criteria**:  
  - Add/remove items.  
  - Mark items as packed/unpacked.  
  - Show packing completion progress.  
- **Dependencies**: Task 24 completed.  
- **Rollback**: Remove packing components and API route; delete test packing items from DB.  
- **Estimated time**: 25 minutes  

**Task 26: Implement Trip Chat (Realtime Messaging)**
- **Objective**: Group chat using `messages` table and Supabase Realtime.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/chat/page.tsx`  
  - `src/components/chat/ChatRoom.tsx`  
  - `src/components/chat/MessageList.tsx`  
  - `src/components/chat/MessageInput.tsx`  
  - `src/lib/hooks/useChat.ts`  
- **Acceptance Criteria**:  
  - Send, edit, delete messages.  
  - Messages appear instantly via realtime subscription.  
  - Support file attachments (optional).  
- **Dependencies**: Task 25 completed.  
- **Rollback**: Remove chat components and API usage; disable Supabase realtime on `messages` table.  
- **Estimated time**: 30 minutes  

**Task 27: Build Photo Gallery**
- **Objective**: Upload and display trip photos from `trip-photos` bucket.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/gallery/page.tsx`  
  - `src/components/gallery/PhotoGallery.tsx`  
  - `src/components/gallery/PhotoUpload.tsx`  
  - `src/components/gallery/PhotoGrid.tsx`  
  - `src/lib/hooks/useGallery.ts`  
- **Acceptance Criteria**:  
  - Upload, view, and delete photos.  
  - Group into albums; display captions/metadata.  
- **Dependencies**: Task 26 completed.  
- **Rollback**: Remove gallery components; delete test images from bucket.  
- **Estimated time**: 25 minutes  

**Task 28: Implement Outfit Planner**
- **Objective**: CRUD for outfits with optional weather integration.
- **Files to modify/create**:  
  - `src/app/(dashboard)/trips/[tripId]/outfits/page.tsx`  
  - `src/components/outfits/OutfitPlanner.tsx`  
  - `src/components/outfits/AddOutfit.tsx`  
  - `src/components/outfits/OutfitCalendar.tsx`  
  - `src/lib/hooks/useOutfits.ts`  
- **Acceptance Criteria**:  
  - Add/edit/delete outfits.  
  - Calendar view displays outfits per day.  
  - Weather API suggestions visible if API key set.  
- **Dependencies**: Task 27 completed.  
- **Rollback**: Remove outfit components; delete test outfits from DB.  
- **Estimated time**: 30 minutes  

**Task 29: Enable Supabase Realtime Sync Across Features**
- **Objective**: Add realtime updates to itinerary, budget, packing, chat, and gallery.
- **Files to modify/create**:  
  - Update relevant `useItinerary.ts`, `useBudget.ts`, `usePacking.ts`, `useChat.ts`, `useGallery.ts`.  
- **Acceptance Criteria**:  
  - Any changes in DB are reflected live in UI without refresh.  
  - No duplicate or stale data in state.  
- **Dependencies**: Task 28 completed.  
- **Rollback**: Remove realtime subscriptions from hooks; revert to SWR polling.  
- **Estimated time**: 20 minutes  

---

## Polish Phase (Error Handling, UX Improvements, Testing)

**Task 30: Implement Global Error Handling**
- **Objective**: Add app-wide error boundaries, 404 page, toast notifications, and error logging.
- **Files to modify/create**:  
  - `src/app/error.tsx`  
  - `src/app/not-found.tsx`  
  - `src/components/common/ErrorBoundary.tsx`  
  - `src/lib/context/ToastContext.tsx`  
  - `src/lib/utils/error-tracking.ts`  
- **Acceptance Criteria**:  
  - 404 page appears for missing routes.  
  - Errors in components are caught and logged.  
  - Toast notifications for errors and successes.  
- **Dependencies**: Task 29 completed.  
- **Rollback**: Remove error handling components; revert to default Next.js error pages.  
- **Estimated time**: 25 minutes  

**Task 31: Add Loading States and Optimistic Updates**
- **Objective**: Improve UX with skeleton screens, spinners, and optimistic UI.
- **Files to modify/create**:  
  - `src/app/(dashboard)/loading.tsx`  
  - `src/components/common/LoadingSpinner.tsx`  
  - Skeleton components for dashboard and trip pages.  
- **Acceptance Criteria**:  
  - Loading spinners appear during data fetch.  
  - Optimistic updates show immediate UI changes before server response.  
- **Dependencies**: Task 30 completed.  
- **Rollback**: Remove skeleton components and optimistic logic.  
- **Estimated time**: 20 minutes  

**Task 32: Implement Comprehensive Form Validation and User Feedback**
- **Objective**: Standardize form validation with Zod schemas and consistent feedback.
- **Files to modify/create**:  
  - Update `src/lib/utils/validation.ts`  
  - Enhance all form components with validation messages.  
- **Acceptance Criteria**:  
  - All forms have client-side validation.  
  - Clear error and success messages displayed.  
- **Dependencies**: Task 31 completed.  
- **Rollback**: Revert validation logic to HTML5 defaults.  
- **Estimated time**: 25 minutes  

**Task 33: Add Responsive Design Polish**
- **Objective**: Ensure app works perfectly on all screen sizes.
- **Files to modify/create**:  
  - Adjust Tailwind breakpoints in `tailwind.config.js`  
  - Update navigation and grid layouts for mobile/tablet.  
- **Acceptance Criteria**:  
  - No horizontal scrolling on mobile.  
  - All components are touch-friendly.  
- **Dependencies**: Task 32 completed.  
- **Rollback**: Revert CSS and layout changes.  
- **Estimated time**: 30 minutes  

**Task 34: Implement Automated E2E Testing**
- **Objective**: Configure Playwright to test all core flows in CI.
- **Files to modify/create**:  
  - `playwright.config.ts`  
  - Tests in `tests/playwright/` for auth, trips, itinerary, budget, chat.  
  - GitHub Actions workflow for CI test runs.  
- **Acceptance Criteria**:  
  - All E2E tests pass locally and in CI pipeline.  
- **Dependencies**: Task 33 completed.  
- **Rollback**: Remove test files and workflow config.  
- **Estimated time**: 30 minutes  

**Task 35: Final Bug Fixes and Performance Optimizations**
- **Objective**: Resolve critical bugs and optimize app load times.
- **Files to modify/create**:  
  - Various bug fix commits across components.  
  - Performance tweaks (lazy loading, image optimization).  
- **Acceptance Criteria**:  
  - No known critical bugs.  
  - App meets acceptable performance benchmarks (Lighthouse ≥ 90).  
- **Dependencies**: Task 34 completed.  
- **Rollback**: Revert performance changes causing instability.  
- **Estimated time**: 25 minutes 

---

## Development Notes

### Key Principles
- **One deliverable per task**: Each task has a single, testable outcome
- **15-30 minute timeboxes**: Tasks are sized for focused development sessions
- **Clear dependencies**: Tasks build logically on previous work
- **Rollback strategy**: Every task has a clear way to undo changes
- **Testable acceptance criteria**: Each task can be verified objectively

### Testing Strategy
- Test each task's acceptance criteria before moving to the next
- Use browser dev tools to verify functionality
- Test on both desktop and mobile viewports
- Verify database operations in Supabase dashboard
- Check network requests in browser dev tools

### Risk Mitigation
- Start with core functionality before adding polish
- Keep tasks small to minimize risk of large failures
- Have rollback plans for every change
- Test frequently to catch issues early
- Focus on MVP features first, advanced features later

### Success Metrics
- All 30 tasks completed successfully
- Core user journey works end-to-end (signup → create trip → invite member → manage trip)
- App is responsive and usable on mobile devices
- No critical bugs in core functionality
- Ready for user testing and feedback

---

*Total estimated time: 12.5-15 hours of focused development*
*Recommended schedule: 2-3 tasks per development session*