# Identified Issues and Bugs

## High - Inconsistent Data after Failed Budget Split Creation

**File(s):** src/app/api/trips/[tripId]/budget/route.ts

**Description:** When creating a new budget item with an 'equal' split type, the budget item is inserted first, followed by the creation of budget splits for each member. These operations are not wrapped in a database transaction. If the budget item is created successfully but the subsequent insertion of budget splits fails (e.g., due to a database error), the budget item will exist without its corresponding splits, leading to inconsistent data where the item's split details are missing.

**Potential Cause:** Lack of database transaction to ensure atomicity of the budget item and budget split insertion operations.

## High - Inconsistent Data after Failed Invite Token Update

**File(s):** src/app/api/invite/[token]/route.ts

**Description:** In the POST request handler for joining a trip via invite token, the user is added to the `trip_users` table first, and then the invite token's usage count is updated. These operations are not within a transaction. If adding the member succeeds but updating the invite token fails, the user will join the trip, but the invite's usage count won't be incremented. This could allow the same invite token to be used more times than intended.

**Potential Cause:** Lack of database transaction to ensure atomicity of the trip user insertion and invite token update operations.

## Medium - Misleading Error Handling in Logout

**File(s):** src/app/api/auth/logout/route.ts

**Description:** In the `catch` block of the POST handler, the API returns a success response (default status 200 for `NextResponse.json`) even if an unexpected error occurred during the `supabase.auth.signOut()` operation or within the `try` block. This makes it difficult to diagnose actual logout failures on the client-side.

**Potential Cause:** Error handling in the `catch` block does not propagate the error status to the response.

## Medium - Basic Validation in Signup

**File(s):** src/app/api/auth/signup/route.ts

**Description:** The email and password validation in the POST handler is quite basic (regex for email format, minimum length for password). While it prevents some invalid inputs, it doesn't cover more complex validation rules or use a dedicated validation library consistently used elsewhere (like Zod).

**Potential Cause:** Incomplete input validation implementation.

## Medium - Inconsistent User Data Handling in Outfits

**File(s):** src/app/api/trips/[tripId]/outfits/route.ts, src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts

**Description:** The outfit GET and POST handlers in `src/app/api/trips/[tripId]/outfits/route.ts`, and the PATCH handler in `src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts` fetch outfit data but then manually add `user_name` and `user_email` fields with `null` values in the response transformation. This is inconsistent with how user data is fetched and included in responses for other features like chat and itinerary, where user information is fetched directly in the Supabase query.

**Potential Cause:** Inconsistent data fetching and transformation logic across different API routes.

## Medium - Missing Validation Schema in Outfits POST/PATCH

**File(s):** src/app/api/trips/[tripId]/outfits/route.ts, src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts

**Description:** The POST request handler in `src/app/api/trips/[tripId]/outfits/route.ts` and the PATCH request handler in `src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts` lack a Zod validation schema for the incoming request body. They perform only basic checks (e.g., for empty name). This can lead to invalid data being processed or inserted into the database.

**Potential Cause:** Missing input validation using a schema.

## Medium - Inaccurate Per Person Budget Calculation in GET

**File(s):** src/app/api/trips/[tripId]/budget/route.ts

**Description:** The calculation of `per_person_amount` in the GET handler for budget items divides the `totalBudget` by the `memberCount`. This assumes all budget items are split equally among all members, which may not be true if 'custom' or 'percentage' split types are used. The per-person amount should reflect the actual amount owed/due by each user based on the `budget_splits` table.

**Potential Cause:** Simplified calculation that does not consider the actual budget split distribution.

## Medium - Currency Handling in Budget Summary

**File(s):** src/app/api/trips/[tripId]/budget/route.ts

**Description:** The currency in the budget summary in the GET response is taken from the first budget item found (`budgetItems?.[0]?.currency`). This assumes a single currency for all budget items within a trip. The application might need to handle multiple currencies or enforce a single currency per trip more explicitly.

**Potential Cause:** Assumption of single currency without explicit enforcement or multi-currency handling.

## Medium - Limited Scope of Packing Items in GET

**File(s):** src/app/api/trips/[tripId]/packing/route.ts

**Description:** The GET request for packing items only fetches items belonging to the current authenticated user (`.eq('user_id', user.id)`). While this is appropriate for a personal packing list, there might be a need for trip organizers or members to view an aggregated or summary view of all members' packing items.

**Potential Cause:** Design choice to limit the scope of the GET request to individual user's packing items.

## Medium - Hardcoded `is_public` in Photo Upload POST

**File(s):** src/app/api/trips/[tripId]/photos/route.ts

**Description:** When a new photo record is created in the database after a successful upload (POST request), the `is_public` field is hardcoded to `true`. This might not align with requirements for private photos within a trip or different visibility settings.

**Potential Cause:** Hardcoded value without considering potential privacy requirements.

## Low - Cookie Handling in Auth Callback

**File(s):** src/app/api/auth/callback/route.ts

**Description:** In the `createServerClient` call within the GET handler, cookies are set directly on the `request.cookies` object. In Next.js API routes, cookies should typically be set on the `response` object to be sent back to the client.

**Potential Cause:** Incorrect approach to setting cookies in a Next.js API route handler.

## Low - Error Handling for Budget Splits Deletion

**File(s):** src/app/api/trips/[tripId]/budget/route.ts

**Description:** In the DELETE handler for budget items, if the deletion of associated budget splits fails, the error is logged (`console.error`), but the function proceeds to attempt to delete the budget item. This could leave orphaned budget items if the splits deletion consistently fails.

**Potential Cause:** Incomplete error handling for dependent record deletion.

## Low - Error Handling for Zod Validation Details

**File(s):** src/app/api/trips/route.ts, src/app/api/trips/[tripId]/budget/route.ts, src/app/api/trips/[tripId]/chat/route.ts, src/app/api/trips/[tripId]/itinerary/route.ts, src/app/api/trips/[tripId]/packing/route.ts, src/app/api/trips/[tripId]/messages/route.ts

**Description:** In several API routes that use Zod for validation (trip creation, budget items, chat messages, itinerary items, packing items, message updates), the raw `validationResult.error.issues` or `validationResult.error.flatten().fieldErrors` are returned to the client in case of validation failures. While this is informative during development, it might expose internal details or be less user-friendly in a production environment.

**Potential Cause:** Returning raw validation error objects directly to the client.

## Low - Basic Time Validation in Itinerary

**File(s):** src/app/api/trips/[tripId]/itinerary/route.ts

**Description:** The time validation in the POST and PUT handlers only checks if the `end_time` is not before or equal to the `start_time`. It doesn't include checks for creating itinerary items with start times in the past or significantly unrealistic future dates, which might be desirable depending on application requirements.

**Potential Cause:** Limited scope of time validation.

## Low - Authorization Logic Duplication

**File(s):** src/app/api/trips/[tripId]/messages/route.ts, src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts, src/app/api/trips/[tripId]/packing/route.ts, src/app/api/trips/[tripId]/photos/route.ts, src/app/api/trips/[tripId]/budget/route.ts, src/app/api/trips/[tripId]/itinerary/route.ts, src/app/api/trips/[tripId]/invite/route.ts

**Description:** The logic for checking if a user is a member of a trip and/or has a specific role (like admin) is repeated across multiple API route handlers for trip-specific features. This leads to code duplication.

**Potential Cause:** Lack of a centralized access control or middleware function.

## Low - Redundant Outfit Existence Check

**File(s):** src/app/api/trips/[tripId]/outfits/[outfitId]/route.ts

**Description:** In both the PATCH and DELETE handlers, a database query is executed first to check if the outfit item exists and to retrieve its `user_id` and `trip_id` for authorization. This query is duplicated in both methods.

**Potential Cause:** Repeated database query within different handlers in the same route file.
