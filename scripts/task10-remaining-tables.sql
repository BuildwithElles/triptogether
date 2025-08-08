-- Task 10: Create Remaining Tables (packing, outfits, messages, photos)
-- This script creates the final feature tables for complete trip planning functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create packing_items table
DO $$
BEGIN
  -- Create the packing_items table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'packing_items'
  ) THEN
    CREATE TABLE public.packing_items (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip and user relationships
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Packing item details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL DEFAULT 'general',
      quantity INTEGER NOT NULL DEFAULT 1,
      is_packed BOOLEAN DEFAULT false,
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      
      -- Optional shared item tracking
      is_shared BOOLEAN DEFAULT false,
      shared_with UUID[] DEFAULT '{}',
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT packing_items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
      CONSTRAINT packing_items_category_not_empty CHECK (LENGTH(TRIM(category)) > 0),
      CONSTRAINT packing_items_quantity_positive CHECK (quantity > 0),
      CONSTRAINT packing_items_valid_priority CHECK (
        priority IN ('low', 'medium', 'high', 'essential')
      )
    );
    
    RAISE NOTICE 'Created packing_items table successfully';
  ELSE
    RAISE NOTICE 'Table packing_items already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating packing_items table: %', SQLERRM;
END $$;

-- Create outfit_items table
DO $$
BEGIN
  -- Create the outfit_items table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'outfit_items'
  ) THEN
    CREATE TABLE public.outfit_items (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip and user relationships
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Outfit details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      occasion VARCHAR(100) NOT NULL DEFAULT 'casual',
      weather VARCHAR(50),
      date_planned DATE,
      
      -- Clothing items (JSON array of clothing pieces)
      clothing_items JSONB DEFAULT '[]'::jsonb,
      
      -- Image reference
      image_url TEXT,
      
      -- Status tracking
      is_worn BOOLEAN DEFAULT false,
      is_favorite BOOLEAN DEFAULT false,
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT outfit_items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
      CONSTRAINT outfit_items_occasion_not_empty CHECK (LENGTH(TRIM(occasion)) > 0),
      CONSTRAINT outfit_items_valid_clothing_items CHECK (
        jsonb_typeof(clothing_items) = 'array'
      )
    );
    
    RAISE NOTICE 'Created outfit_items table successfully';
  ELSE
    RAISE NOTICE 'Table outfit_items already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating outfit_items table: %', SQLERRM;
END $$;

-- Create messages table
DO $$
BEGIN
  -- Create the messages table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'messages'
  ) THEN
    CREATE TABLE public.messages (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip and user relationships
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Message details
      content TEXT NOT NULL,
      message_type VARCHAR(50) NOT NULL DEFAULT 'text',
      
      -- Optional reply/thread tracking
      reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
      
      -- File attachments (JSON array of file metadata)
      attachments JSONB DEFAULT '[]'::jsonb,
      
      -- Message status
      is_edited BOOLEAN DEFAULT false,
      edited_at TIMESTAMP WITH TIME ZONE,
      is_pinned BOOLEAN DEFAULT false,
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT messages_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
      CONSTRAINT messages_valid_type CHECK (
        message_type IN ('text', 'image', 'file', 'system', 'location')
      ),
      CONSTRAINT messages_valid_attachments CHECK (
        jsonb_typeof(attachments) = 'array'
      ),
      CONSTRAINT messages_edited_at_logic CHECK (
        (is_edited = false AND edited_at IS NULL) OR 
        (is_edited = true AND edited_at IS NOT NULL)
      )
    );
    
    RAISE NOTICE 'Created messages table successfully';
  ELSE
    RAISE NOTICE 'Table messages already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating messages table: %', SQLERRM;
END $$;

-- Create photos table
DO $$
BEGIN
  -- Create the photos table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'photos'
  ) THEN
    CREATE TABLE public.photos (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip and user relationships
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Photo details
      title VARCHAR(255),
      description TEXT,
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      
      -- Photo metadata
      width INTEGER,
      height INTEGER,
      taken_at TIMESTAMP WITH TIME ZONE,
      location_name VARCHAR(255),
      
      -- GPS coordinates (optional)
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      
      -- Organization and sharing
      album_name VARCHAR(100),
      tags TEXT[] DEFAULT '{}',
      is_favorite BOOLEAN DEFAULT false,
      is_cover_photo BOOLEAN DEFAULT false,
      
      -- Privacy settings
      is_public BOOLEAN DEFAULT true,
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT photos_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
      CONSTRAINT photos_file_path_not_empty CHECK (LENGTH(TRIM(file_path)) > 0),
      CONSTRAINT photos_file_size_positive CHECK (file_size > 0),
      CONSTRAINT photos_mime_type_not_empty CHECK (LENGTH(TRIM(mime_type)) > 0),
      CONSTRAINT photos_valid_dimensions CHECK (
        (width IS NULL AND height IS NULL) OR 
        (width > 0 AND height > 0)
      ),
      CONSTRAINT photos_valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
      )
    );
    
    RAISE NOTICE 'Created photos table successfully';
  ELSE
    RAISE NOTICE 'Table photos already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating photos table: %', SQLERRM;
END $$;

-- Create indexes for optimal performance
DO $$
BEGIN
  -- Indexes for packing_items
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'packing_items' AND indexname = 'idx_packing_items_trip_user') THEN
    CREATE INDEX idx_packing_items_trip_user ON public.packing_items(trip_id, user_id);
    RAISE NOTICE 'Created index on packing_items(trip_id, user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'packing_items' AND indexname = 'idx_packing_items_category') THEN
    CREATE INDEX idx_packing_items_category ON public.packing_items(category);
    RAISE NOTICE 'Created index on packing_items.category';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'packing_items' AND indexname = 'idx_packing_items_is_packed') THEN
    CREATE INDEX idx_packing_items_is_packed ON public.packing_items(is_packed);
    RAISE NOTICE 'Created index on packing_items.is_packed';
  END IF;
  
  -- Indexes for outfit_items
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'outfit_items' AND indexname = 'idx_outfit_items_trip_user') THEN
    CREATE INDEX idx_outfit_items_trip_user ON public.outfit_items(trip_id, user_id);
    RAISE NOTICE 'Created index on outfit_items(trip_id, user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'outfit_items' AND indexname = 'idx_outfit_items_date_planned') THEN
    CREATE INDEX idx_outfit_items_date_planned ON public.outfit_items(date_planned);
    RAISE NOTICE 'Created index on outfit_items.date_planned';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'outfit_items' AND indexname = 'idx_outfit_items_occasion') THEN
    CREATE INDEX idx_outfit_items_occasion ON public.outfit_items(occasion);
    RAISE NOTICE 'Created index on outfit_items.occasion';
  END IF;
  
  -- Indexes for messages
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'idx_messages_trip_id') THEN
    CREATE INDEX idx_messages_trip_id ON public.messages(trip_id);
    RAISE NOTICE 'Created index on messages.trip_id';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'idx_messages_created_at') THEN
    CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
    RAISE NOTICE 'Created index on messages.created_at';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'idx_messages_reply_to') THEN
    CREATE INDEX idx_messages_reply_to ON public.messages(reply_to);
    RAISE NOTICE 'Created index on messages.reply_to';
  END IF;
  
  -- Indexes for photos
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'photos' AND indexname = 'idx_photos_trip_id') THEN
    CREATE INDEX idx_photos_trip_id ON public.photos(trip_id);
    RAISE NOTICE 'Created index on photos.trip_id';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'photos' AND indexname = 'idx_photos_uploaded_by') THEN
    CREATE INDEX idx_photos_uploaded_by ON public.photos(uploaded_by);
    RAISE NOTICE 'Created index on photos.uploaded_by';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'photos' AND indexname = 'idx_photos_taken_at') THEN
    CREATE INDEX idx_photos_taken_at ON public.photos(taken_at DESC);
    RAISE NOTICE 'Created index on photos.taken_at';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'photos' AND indexname = 'idx_photos_album_name') THEN
    CREATE INDEX idx_photos_album_name ON public.photos(album_name);
    RAISE NOTICE 'Created index on photos.album_name';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'photos' AND indexname = 'idx_photos_is_favorite') THEN
    CREATE INDEX idx_photos_is_favorite ON public.photos(is_favorite);
    RAISE NOTICE 'Created index on photos.is_favorite';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating indexes for remaining tables: %', SQLERRM;
END $$;

-- Create updated_at triggers
DO $$
BEGIN
  -- Create trigger function if it doesn't exist (reuse from previous tables)
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    RAISE NOTICE 'Created update_updated_at_column trigger function';
  END IF;
  
  -- Create triggers for all remaining tables
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_packing_items_updated_at') THEN
    CREATE TRIGGER update_packing_items_updated_at
        BEFORE UPDATE ON public.packing_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for packing_items table';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_outfit_items_updated_at') THEN
    CREATE TRIGGER update_outfit_items_updated_at
        BEFORE UPDATE ON public.outfit_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for outfit_items table';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_messages_updated_at') THEN
    CREATE TRIGGER update_messages_updated_at
        BEFORE UPDATE ON public.messages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for messages table';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_photos_updated_at') THEN
    CREATE TRIGGER update_photos_updated_at
        BEFORE UPDATE ON public.photos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for photos table';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating triggers for remaining tables: %', SQLERRM;
END $$;

-- Create Row Level Security (RLS) policies
DO $$
BEGIN
  -- Enable RLS on all remaining tables
  ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Enabled RLS on all remaining tables';
  
  -- RLS Policies for packing_items
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'packing_items' AND policyname = 'Users can manage their own packing items') THEN
    CREATE POLICY "Users can manage their own packing items" ON public.packing_items
      FOR ALL
      USING (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = packing_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Users can manage their own packing items';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'packing_items' AND policyname = 'Trip members can view shared packing items') THEN
    CREATE POLICY "Trip members can view shared packing items" ON public.packing_items
      FOR SELECT
      USING (
        is_shared = true AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = packing_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view shared packing items';
  END IF;
  
  -- RLS Policies for outfit_items
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'Users can manage their own outfit items') THEN
    CREATE POLICY "Users can manage their own outfit items" ON public.outfit_items
      FOR ALL
      USING (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = outfit_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Users can manage their own outfit items';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'Trip members can view all outfit items') THEN
    CREATE POLICY "Trip members can view all outfit items" ON public.outfit_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = outfit_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view all outfit items';
  END IF;
  
  -- RLS Policies for messages
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Trip members can view messages') THEN
    CREATE POLICY "Trip members can view messages" ON public.messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = messages.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view messages';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Trip members can create messages') THEN
    CREATE POLICY "Trip members can create messages" ON public.messages
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = messages.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can create messages';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can edit their own messages') THEN
    CREATE POLICY "Users can edit their own messages" ON public.messages
      FOR UPDATE
      USING (user_id = auth.uid());
    RAISE NOTICE 'Created RLS policy: Users can edit their own messages';
  END IF;
  
  -- RLS Policies for photos
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'photos' AND policyname = 'Trip members can view photos') THEN
    CREATE POLICY "Trip members can view photos" ON public.photos
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = photos.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view photos';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'photos' AND policyname = 'Trip members can upload photos') THEN
    CREATE POLICY "Trip members can upload photos" ON public.photos
      FOR INSERT
      WITH CHECK (
        uploaded_by = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = photos.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can upload photos';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'photos' AND policyname = 'Users can manage their own photos') THEN
    CREATE POLICY "Users can manage their own photos" ON public.photos
      FOR ALL
      USING (uploaded_by = auth.uid());
    RAISE NOTICE 'Created RLS policy: Users can manage their own photos';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating RLS policies for remaining tables: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
  packing_table_count INTEGER;
  outfit_table_count INTEGER;
  messages_table_count INTEGER;
  photos_table_count INTEGER;
  total_indexes INTEGER;
  total_policies INTEGER;
  total_triggers INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO packing_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'packing_items';
  
  SELECT COUNT(*) INTO outfit_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'outfit_items';
  
  SELECT COUNT(*) INTO messages_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'messages';
  
  SELECT COUNT(*) INTO photos_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'photos';
  
  -- Count indexes for all remaining tables
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE tablename IN ('packing_items', 'outfit_items', 'messages', 'photos');
  
  -- Count policies for all remaining tables
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE tablename IN ('packing_items', 'outfit_items', 'messages', 'photos');
  
  -- Count triggers for all remaining tables
  SELECT COUNT(*) INTO total_triggers
  FROM pg_trigger
  WHERE tgrelid IN (
    'public.packing_items'::regclass,
    'public.outfit_items'::regclass,
    'public.messages'::regclass,
    'public.photos'::regclass
  );
  
  -- Report results
  RAISE NOTICE '=== REMAINING TABLES CREATION SUMMARY ===';
  RAISE NOTICE 'packing_items table created: %', packing_table_count;
  RAISE NOTICE 'outfit_items table created: %', outfit_table_count;
  RAISE NOTICE 'messages table created: %', messages_table_count;
  RAISE NOTICE 'photos table created: %', photos_table_count;
  RAISE NOTICE 'Total indexes created: %', total_indexes;
  RAISE NOTICE 'Total RLS policies created: %', total_policies;
  RAISE NOTICE 'Total triggers created: %', total_triggers;
  
  IF packing_table_count = 1 AND outfit_table_count = 1 AND messages_table_count = 1 
     AND photos_table_count = 1 AND total_indexes >= 13 AND total_policies >= 9 AND total_triggers >= 4 THEN
    RAISE NOTICE 'SUCCESS: Remaining tables setup completed successfully!';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some components may not have been created properly';
  END IF;
END $$;
