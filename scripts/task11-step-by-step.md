# Task 11 Step-by-Step Guide: Set Up Supabase Storage Buckets

## Overview
This guide will walk you through setting up Supabase storage buckets for TripTogether's file management needs.

## Prerequisites
- Supabase project is set up and accessible
- Environment variables are configured in `.env.local`
- Database tables from previous tasks are in place

## Step 1: Execute Storage Buckets SQL Script

### Option A: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to `SQL Editor`
3. Click `New Query`
4. Copy the contents of `scripts/task11-storage-buckets.sql`
5. Paste into the SQL editor
6. Click `Run` to execute the script

### Option B: Using psql Command Line
```bash
# If you have psql installed and configured
psql -h db.your-project-ref.supabase.co -U postgres -d postgres -f scripts/task11-storage-buckets.sql
```

## Step 2: Verify Bucket Creation

### In Supabase Dashboard:
1. Navigate to `Storage` in the left sidebar
2. You should see three buckets:
   - `trip-photos` (10MB limit, public)
   - `user-avatars` (2MB limit, public)
   - `outfit-images` (5MB limit, public)

### Using Verification Script:
```bash
# Run the verification script
node scripts/verify-storage-buckets.mjs
```

## Step 3: Configure Storage Policies

The SQL script automatically creates the following policies:

### trip-photos bucket:
- ✅ Trip members can view trip photos
- ✅ Trip members can upload trip photos  
- ✅ Users can delete their own trip photos

### user-avatars bucket:
- ✅ Anyone can view user avatars (public)
- ✅ Users can upload their own avatars
- ✅ Users can update their own avatars
- ✅ Users can delete their own avatars

### outfit-images bucket:
- ✅ Trip members can view outfit images
- ✅ Trip members can upload outfit images
- ✅ Users can manage their own outfit images

## Step 4: Test Storage Functionality

### Manual Testing in Supabase Dashboard:
1. Go to `Storage` > `trip-photos`
2. Try uploading a test image
3. Verify the file appears in the bucket
4. Test downloading the file
5. Repeat for other buckets

### Automated Testing:
```bash
# Run comprehensive verification
node scripts/verify-storage-buckets.mjs

# Should show:
# ✅ All required buckets exist
# ✅ Bucket configurations are correct
# ✅ File upload functionality works
# ✅ Storage policies are in place
```

## Step 5: Update Environment Variables (if needed)

Ensure your `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## File Structure After Completion

```
src/lib/utils/
├── storage.ts          # ✅ Storage utility functions
├── constants.ts        # ✅ Storage bucket constants  
└── index.ts           # ✅ Exports storage utilities

scripts/
├── task11-storage-buckets.sql     # ✅ SQL script for buckets/policies
└── verify-storage-buckets.mjs     # ✅ Verification script
```

## Storage Utility Functions Available

The `storage.ts` file provides these functions:

### Upload Functions:
- `uploadTripPhoto(tripId, userId, file, metadata?)`
- `uploadUserAvatar(userId, file)`  
- `uploadOutfitImage(tripId, userId, file, metadata?)`

### Download Functions:
- `downloadFile(bucket, path)`
- `getPublicUrl(bucket, path)`

### Management Functions:
- `deleteFile(bucket, path)`
- `listFiles(bucket, folder?)`

### Validation Functions:
- `validateImageFile(file, bucketType)`
- `generateStoragePath(bucket, ...segments)`

## Troubleshooting

### Common Issues:

1. **Buckets not created:**
   - Check SQL script execution for errors
   - Verify you have admin permissions
   - Try creating buckets manually in dashboard

2. **Upload failures:**
   - Check file size limits (2MB-10MB depending on bucket)
   - Verify file MIME types are allowed
   - Ensure user is authenticated

3. **Permission denied:**
   - Verify RLS policies are created correctly
   - Check user has proper trip membership
   - Ensure storage policies allow the operation

4. **Environment variables:**
   - Verify SUPABASE_URL and keys are correct
   - Check `.env.local` file exists and is loaded
   - Restart development server after changes

## Verification Checklist

- [ ] 3 storage buckets created successfully
- [ ] All buckets have proper size limits and MIME type restrictions
- [ ] Storage policies prevent unauthorized access
- [ ] File upload/download functionality works
- [ ] Storage utilities are properly exported
- [ ] Verification script passes all tests

## Next Steps

After completing Task 11:
1. Storage buckets are ready for use in the application
2. Photo upload features can be implemented in trip gallery
3. User avatar functionality can be added to profiles
4. Outfit image features can be integrated into packing lists

## Security Notes

- All buckets are configured as public for ease of access
- RLS policies control access based on user authentication and trip membership
- File size limits prevent abuse and excessive storage usage
- MIME type restrictions ensure only valid image files are uploaded
- Users can only manage their own files (except viewing shared trip content)
