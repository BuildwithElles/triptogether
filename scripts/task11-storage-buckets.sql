-- Task 11: Set Up Supabase Storage Buckets
-- This script creates storage buckets and policies for file management in TripTogether

-- Create storage buckets
DO $$
BEGIN
  -- Create trip-photos bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets 
    WHERE name = 'trip-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'trip-photos',
      'trip-photos',
      true,
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    );
    RAISE NOTICE 'Created trip-photos bucket';
  ELSE
    RAISE NOTICE 'Bucket trip-photos already exists';
  END IF;

  -- Create user-avatars bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets 
    WHERE name = 'user-avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'user-avatars',
      'user-avatars',
      true,
      2097152, -- 2MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    );
    RAISE NOTICE 'Created user-avatars bucket';
  ELSE
    RAISE NOTICE 'Bucket user-avatars already exists';
  END IF;

  -- Create outfit-images bucket
  IF NOT EXISTS (
    SELECT FROM storage.buckets 
    WHERE name = 'outfit-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'outfit-images',
      'outfit-images',
      true,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    );
    RAISE NOTICE 'Created outfit-images bucket';
  ELSE
    RAISE NOTICE 'Bucket outfit-images already exists';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating storage buckets: %', SQLERRM;
END $$;

-- Create storage policies for trip-photos bucket
DO $$
BEGIN
  -- Policy: Trip members can view trip photos
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Trip members can view trip photos'
  ) THEN
    CREATE POLICY "Trip members can view trip photos" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'trip-photos' AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          JOIN public.trips t ON t.id = tu.trip_id
          WHERE tu.user_id = auth.uid()
            AND tu.is_active = true
            AND (name LIKE tu.trip_id || '/%' OR name LIKE t.id || '/%')
        )
      );
    RAISE NOTICE 'Created policy: Trip members can view trip photos';
  END IF;

  -- Policy: Trip members can upload trip photos
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Trip members can upload trip photos'
  ) THEN
    CREATE POLICY "Trip members can upload trip photos" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'trip-photos' AND
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          JOIN public.trips t ON t.id = tu.trip_id
          WHERE tu.user_id = auth.uid()
            AND tu.is_active = true
            AND (name LIKE tu.trip_id || '/%' OR name LIKE t.id || '/%')
        )
      );
    RAISE NOTICE 'Created policy: Trip members can upload trip photos';
  END IF;

  -- Policy: Users can delete their own trip photos
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete their own trip photos'
  ) THEN
    CREATE POLICY "Users can delete their own trip photos" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'trip-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    RAISE NOTICE 'Created policy: Users can delete their own trip photos';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating trip-photos policies: %', SQLERRM;
END $$;

-- Create storage policies for user-avatars bucket
DO $$
BEGIN
  -- Policy: Users can view all avatars (public)
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Anyone can view user avatars'
  ) THEN
    CREATE POLICY "Anyone can view user avatars" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'user-avatars');
    RAISE NOTICE 'Created policy: Anyone can view user avatars';
  END IF;

  -- Policy: Users can upload their own avatars
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload their own avatars'
  ) THEN
    CREATE POLICY "Users can upload their own avatars" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'user-avatars' AND
        auth.uid() IS NOT NULL AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    RAISE NOTICE 'Created policy: Users can upload their own avatars';
  END IF;

  -- Policy: Users can update their own avatars
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update their own avatars'
  ) THEN
    CREATE POLICY "Users can update their own avatars" ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    RAISE NOTICE 'Created policy: Users can update their own avatars';
  END IF;

  -- Policy: Users can delete their own avatars
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete their own avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    RAISE NOTICE 'Created policy: Users can delete their own avatars';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user-avatars policies: %', SQLERRM;
END $$;

-- Create storage policies for outfit-images bucket
DO $$
BEGIN
  -- Policy: Trip members can view outfit images
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Trip members can view outfit images'
  ) THEN
    CREATE POLICY "Trip members can view outfit images" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'outfit-images' AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          JOIN public.trips t ON t.id = tu.trip_id
          WHERE tu.user_id = auth.uid()
            AND tu.is_active = true
            AND (name LIKE tu.trip_id || '/%' OR name LIKE t.id || '/%')
        )
      );
    RAISE NOTICE 'Created policy: Trip members can view outfit images';
  END IF;

  -- Policy: Trip members can upload outfit images
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Trip members can upload outfit images'
  ) THEN
    CREATE POLICY "Trip members can upload outfit images" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'outfit-images' AND
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          JOIN public.trips t ON t.id = tu.trip_id
          WHERE tu.user_id = auth.uid()
            AND tu.is_active = true
            AND (name LIKE tu.trip_id || '/%' OR name LIKE t.id || '/%')
        )
      );
    RAISE NOTICE 'Created policy: Trip members can upload outfit images';
  END IF;

  -- Policy: Users can manage their own outfit images
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can manage their own outfit images'
  ) THEN
    CREATE POLICY "Users can manage their own outfit images" ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'outfit-images' AND
        auth.uid()::text = (storage.foldername(name))[2] -- User ID is second folder level
      );
    RAISE NOTICE 'Created policy: Users can manage their own outfit images';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating outfit-images policies: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count buckets
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE name IN ('trip-photos', 'user-avatars', 'outfit-images');
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%trip photos%' 
     OR policyname LIKE '%avatars%' 
     OR policyname LIKE '%outfit images%';
  
  -- Report results
  RAISE NOTICE '=== STORAGE BUCKETS SETUP SUMMARY ===';
  RAISE NOTICE 'Storage buckets created: %', bucket_count;
  RAISE NOTICE 'Storage policies created: %', policy_count;
  
  IF bucket_count = 3 AND policy_count >= 9 THEN
    RAISE NOTICE 'SUCCESS: Storage buckets and policies setup completed successfully!';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some storage components may not have been created properly';
  END IF;
END $$;
