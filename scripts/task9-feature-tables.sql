-- Task 9: Create Feature Tables (itinerary_items, budget_items)
-- This script creates the core feature tables for trip planning functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create itinerary_items table
DO $$
BEGIN
  -- Create the itinerary_items table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'itinerary_items'
  ) THEN
    CREATE TABLE public.itinerary_items (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip relationship
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      
      -- Itinerary details
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      start_time TIMESTAMP WITH TIME ZONE,
      end_time TIMESTAMP WITH TIME ZONE,
      category VARCHAR(100) NOT NULL DEFAULT 'activity',
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT itinerary_items_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
      CONSTRAINT itinerary_items_category_not_empty CHECK (LENGTH(TRIM(category)) > 0),
      CONSTRAINT itinerary_items_valid_time_range CHECK (
        start_time IS NULL OR end_time IS NULL OR end_time >= start_time
      )
    );
    
    RAISE NOTICE 'Created itinerary_items table successfully';
  ELSE
    RAISE NOTICE 'Table itinerary_items already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating itinerary_items table: %', SQLERRM;
END $$;

-- Create budget_items table
DO $$
BEGIN
  -- Create the budget_items table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'budget_items'
  ) THEN
    CREATE TABLE public.budget_items (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Trip relationship
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      
      -- Budget details
      title VARCHAR(255) NOT NULL,
      description TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      category VARCHAR(100) NOT NULL DEFAULT 'general',
      
      -- Payment tracking
      paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      split_type VARCHAR(20) NOT NULL DEFAULT 'equal',
      is_paid BOOLEAN DEFAULT false,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT budget_items_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
      CONSTRAINT budget_items_amount_positive CHECK (amount > 0),
      CONSTRAINT budget_items_currency_format CHECK (LENGTH(currency) = 3),
      CONSTRAINT budget_items_category_not_empty CHECK (LENGTH(TRIM(category)) > 0),
      CONSTRAINT budget_items_valid_split_type CHECK (
        split_type IN ('equal', 'custom', 'percentage')
      )
    );
    
    RAISE NOTICE 'Created budget_items table successfully';
  ELSE
    RAISE NOTICE 'Table budget_items already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating budget_items table: %', SQLERRM;
END $$;

-- Create budget_splits table for custom expense splitting
DO $$
BEGIN
  -- Create the budget_splits table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'budget_splits'
  ) THEN
    CREATE TABLE public.budget_splits (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Relationships
      budget_item_id UUID NOT NULL REFERENCES public.budget_items(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Split details
      amount DECIMAL(10, 2) NOT NULL,
      percentage DECIMAL(5, 2), -- For percentage-based splits
      is_paid BOOLEAN DEFAULT false,
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT budget_splits_amount_not_negative CHECK (amount >= 0),
      CONSTRAINT budget_splits_percentage_valid CHECK (
        percentage IS NULL OR (percentage >= 0 AND percentage <= 100)
      ),
      
      -- Ensure unique user per budget item
      UNIQUE(budget_item_id, user_id)
    );
    
    RAISE NOTICE 'Created budget_splits table successfully';
  ELSE
    RAISE NOTICE 'Table budget_splits already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating budget_splits table: %', SQLERRM;
END $$;

-- Create indexes for optimal performance
DO $$
BEGIN
  -- Indexes for itinerary_items
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'itinerary_items' AND indexname = 'idx_itinerary_items_trip_id') THEN
    CREATE INDEX idx_itinerary_items_trip_id ON public.itinerary_items(trip_id);
    RAISE NOTICE 'Created index on itinerary_items.trip_id';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'itinerary_items' AND indexname = 'idx_itinerary_items_start_time') THEN
    CREATE INDEX idx_itinerary_items_start_time ON public.itinerary_items(start_time);
    RAISE NOTICE 'Created index on itinerary_items.start_time';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'itinerary_items' AND indexname = 'idx_itinerary_items_category') THEN
    CREATE INDEX idx_itinerary_items_category ON public.itinerary_items(category);
    RAISE NOTICE 'Created index on itinerary_items.category';
  END IF;
  
  -- Indexes for budget_items
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'budget_items' AND indexname = 'idx_budget_items_trip_id') THEN
    CREATE INDEX idx_budget_items_trip_id ON public.budget_items(trip_id);
    RAISE NOTICE 'Created index on budget_items.trip_id';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'budget_items' AND indexname = 'idx_budget_items_paid_by') THEN
    CREATE INDEX idx_budget_items_paid_by ON public.budget_items(paid_by);
    RAISE NOTICE 'Created index on budget_items.paid_by';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'budget_items' AND indexname = 'idx_budget_items_category') THEN
    CREATE INDEX idx_budget_items_category ON public.budget_items(category);
    RAISE NOTICE 'Created index on budget_items.category';
  END IF;
  
  -- Indexes for budget_splits
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'budget_splits' AND indexname = 'idx_budget_splits_budget_item_id') THEN
    CREATE INDEX idx_budget_splits_budget_item_id ON public.budget_splits(budget_item_id);
    RAISE NOTICE 'Created index on budget_splits.budget_item_id';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'budget_splits' AND indexname = 'idx_budget_splits_user_id') THEN
    CREATE INDEX idx_budget_splits_user_id ON public.budget_splits(user_id);
    RAISE NOTICE 'Created index on budget_splits.user_id';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating indexes for feature tables: %', SQLERRM;
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
  
  -- Create triggers for all feature tables
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_itinerary_items_updated_at') THEN
    CREATE TRIGGER update_itinerary_items_updated_at
        BEFORE UPDATE ON public.itinerary_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for itinerary_items table';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_budget_items_updated_at') THEN
    CREATE TRIGGER update_budget_items_updated_at
        BEFORE UPDATE ON public.budget_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for budget_items table';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_budget_splits_updated_at') THEN
    CREATE TRIGGER update_budget_splits_updated_at
        BEFORE UPDATE ON public.budget_splits
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created updated_at trigger for budget_splits table';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating triggers for feature tables: %', SQLERRM;
END $$;

-- Create Row Level Security (RLS) policies
DO $$
BEGIN
  -- Enable RLS on all feature tables
  ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.budget_splits ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Enabled RLS on all feature tables';
  
  -- RLS Policies for itinerary_items
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Trip members can view itinerary items') THEN
    CREATE POLICY "Trip members can view itinerary items" ON public.itinerary_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = itinerary_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view itinerary items';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'itinerary_items' AND policyname = 'Trip members can manage itinerary items') THEN
    CREATE POLICY "Trip members can manage itinerary items" ON public.itinerary_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = itinerary_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can manage itinerary items';
  END IF;
  
  -- RLS Policies for budget_items
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'budget_items' AND policyname = 'Trip members can view budget items') THEN
    CREATE POLICY "Trip members can view budget items" ON public.budget_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = budget_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can view budget items';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'budget_items' AND policyname = 'Trip members can manage budget items') THEN
    CREATE POLICY "Trip members can manage budget items" ON public.budget_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_users tu
          WHERE tu.trip_id = budget_items.trip_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can manage budget items';
  END IF;
  
  -- RLS Policies for budget_splits
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'budget_splits' AND policyname = 'Users can view budget splits for their trips') THEN
    CREATE POLICY "Users can view budget splits for their trips" ON public.budget_splits
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.budget_items bi
          JOIN public.trip_users tu ON tu.trip_id = bi.trip_id
          WHERE bi.id = budget_splits.budget_item_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Users can view budget splits for their trips';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'budget_splits' AND policyname = 'Trip members can manage budget splits') THEN
    CREATE POLICY "Trip members can manage budget splits" ON public.budget_splits
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.budget_items bi
          JOIN public.trip_users tu ON tu.trip_id = bi.trip_id
          WHERE bi.id = budget_splits.budget_item_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
      );
    RAISE NOTICE 'Created RLS policy: Trip members can manage budget splits';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating RLS policies for feature tables: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
  itinerary_table_count INTEGER;
  budget_table_count INTEGER;
  splits_table_count INTEGER;
  total_indexes INTEGER;
  total_policies INTEGER;
  total_triggers INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO itinerary_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'itinerary_items';
  
  SELECT COUNT(*) INTO budget_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'budget_items';
  
  SELECT COUNT(*) INTO splits_table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'budget_splits';
  
  -- Count indexes for all feature tables
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE tablename IN ('itinerary_items', 'budget_items', 'budget_splits');
  
  -- Count policies for all feature tables
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE tablename IN ('itinerary_items', 'budget_items', 'budget_splits');
  
  -- Count triggers for all feature tables
  SELECT COUNT(*) INTO total_triggers
  FROM pg_trigger
  WHERE tgrelid IN (
    'public.itinerary_items'::regclass,
    'public.budget_items'::regclass,
    'public.budget_splits'::regclass
  );
  
  -- Report results
  RAISE NOTICE '=== FEATURE TABLES CREATION SUMMARY ===';
  RAISE NOTICE 'itinerary_items table created: %', itinerary_table_count;
  RAISE NOTICE 'budget_items table created: %', budget_table_count;
  RAISE NOTICE 'budget_splits table created: %', splits_table_count;
  RAISE NOTICE 'Total indexes created: %', total_indexes;
  RAISE NOTICE 'Total RLS policies created: %', total_policies;
  RAISE NOTICE 'Total triggers created: %', total_triggers;
  
  IF itinerary_table_count = 1 AND budget_table_count = 1 AND splits_table_count = 1 
     AND total_indexes >= 8 AND total_policies >= 6 AND total_triggers >= 3 THEN
    RAISE NOTICE 'SUCCESS: Feature tables setup completed successfully!';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some components may not have been created properly';
  END IF;
END $$;
