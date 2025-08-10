# Task 22: Create Invite Preview and Join Flow - Step by Step Implementation

## Overview
Build public preview pages for trip invites and allow users to join trips through invite tokens. This enables the full invite flow: generate → preview → join.

## Implementation Steps

### Step 1: Create Invite API Route
- **File**: `src/app/api/invite/[token]/route.ts`
- **Purpose**: Handle invite token validation and trip joining
- **Methods**: GET (validate/preview), POST (join trip)
- **Features**:
  - Validate invite tokens (check expiry, usage limits, active status)
  - Return trip information for preview
  - Handle trip joining for authenticated users
  - Update invite usage tracking

### Step 2: Create InvitePreview Component
- **File**: `src/components/invite/InvitePreview.tsx`
- **Purpose**: Display trip information and invite details
- **Features**:
  - Trip information display (title, destination, dates, description)
  - Invite status and expiry information
  - Member count and trip details
  - Call-to-action buttons based on user auth status

### Step 3: Create Invite Preview Page
- **File**: `src/app/invite/[token]/preview/page.tsx`
- **Purpose**: Public preview page for invite tokens
- **Features**:
  - Public access (no authentication required)
  - Invite validation and trip information display
  - Error handling for invalid/expired tokens
  - Navigation to join flow

### Step 4: Create Invite Join Page
- **File**: `src/app/invite/[token]/join/page.tsx`
- **Purpose**: Handle trip joining flow
- **Features**:
  - Authentication check and redirect logic
  - Join trip functionality for authenticated users
  - Success/error handling with user feedback
  - Automatic redirect to trip dashboard after joining

## Technical Requirements

### API Route Implementation
```typescript
// GET /api/invite/[token]
// - Validate token without authentication
// - Return trip information and invite status
// - Handle expired/invalid tokens

// POST /api/invite/[token]
// - Require authentication
// - Join user to trip with guest role
// - Update invite usage tracking
// - Return success/error status
```

### Component Design
- **Error States**: Invalid token, expired invite, usage limit reached
- **Loading States**: Token validation, trip joining
- **Success States**: Valid invite, successful join
- **User Feedback**: Clear messaging for all states

### Security Considerations
- Validate tokens server-side
- Check user authentication for join operations
- Prevent duplicate joins
- Respect invite usage limits and expiry

### User Experience Flow
1. **Unauthenticated User**: Preview → Login/Signup → Join → Trip Dashboard
2. **Authenticated User**: Preview → Join → Trip Dashboard
3. **Invalid Token**: Error message with explanation
4. **Expired Token**: Error message with contact information

## File Structure
```
src/
  app/
    api/
      invite/
        [token]/
          route.ts          # API endpoint for token operations
    invite/
      [token]/
        preview/
          page.tsx          # Public preview page
        join/
          page.tsx          # Authenticated join page
  components/
    invite/
      InvitePreview.tsx     # Preview component
      index.ts              # Barrel exports
```

## Expected Outcomes
- Public invite previews working correctly
- Authenticated users can join trips via invites
- Unauthenticated users are prompted to log in
- Invite usage tracking updates properly
- Error handling for all edge cases
- Seamless integration with existing authentication system

## Testing Checklist
- [ ] Valid invite tokens show trip preview
- [ ] Invalid tokens show error message
- [ ] Expired invites handled gracefully
- [ ] Authenticated users can join trips
- [ ] Unauthenticated users redirected to login
- [ ] Usage tracking updates correctly
- [ ] Duplicate joins prevented
- [ ] Navigation flows work properly
