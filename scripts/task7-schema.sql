-- Task 7: Create Core Database Tables (trips, trip_users)
-- Execute this SQL in your Supabase dashboard → SQL Editor
-- Debugging script for trip management tables

-- Enhanced error handling for enum creation
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
  RAISE NOTICE 'trip_status enum created successfully';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'trip_status enum already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating trip_status enum: %', SQLERRM;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'guest');
  RAISE NOTICE 'user_role enum created successfully';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'user_role enum already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user_role enum: %', SQLERRM;
END $$;

-- Create trips table with enhanced error logging
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT,
    destination VARCHAR(200) NOT NULL CHECK (length(trim(destination)) > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status trip_status NOT NULL DEFAULT 'planning',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    budget_total DECIMAL(10,2) CHECK (budget_total >= 0),
    max_members INTEGER CHECK (max_members > 0 AND max_members <= 100),
    is_public BOOLEAN NOT NULL DEFAULT false,
    invite_code VARCHAR(20) UNIQUE,
    archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT trips_date_order CHECK (end_date >= start_date)
  );
  RAISE NOTICE 'trips table created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating trips table: %', SQLERRM;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS trips_created_by_idx ON trips(created_by);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS trips_start_date_idx ON trips(start_date);
CREATE INDEX IF NOT EXISTS trips_invite_code_idx ON trips(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS trips_archived_idx ON trips(archived) WHERE archived = false;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips table
DROP POLICY IF EXISTS "Users can view trips they are members of" ON trips;
CREATE POLICY "Users can view trips they are members of" ON trips
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_users 
      WHERE trip_users.trip_id = trips.id 
      AND trip_users.user_id = auth.uid()
      AND trip_users.is_active = true
    ) OR
    (is_public = true AND archived = false)
  );

DROP POLICY IF EXISTS "Users can create trips" ON trips;
CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Trip admins can update trips" ON trips;
CREATE POLICY "Trip admins can update trips" ON trips
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_users 
      WHERE trip_users.trip_id = trips.id 
      AND trip_users.user_id = auth.uid()
      AND trip_users.role = 'admin'
      AND trip_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Trip creators can delete trips" ON trips;
CREATE POLICY "Trip creators can delete trips" ON trips
  FOR DELETE USING (auth.uid() = created_by);

-- Create trip_users table with enhanced error logging
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS trip_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'guest',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    nickname VARCHAR(50),
    
    -- Ensure unique membership per trip
    UNIQUE(trip_id, user_id)
  );
  RAISE NOTICE 'trip_users table created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating trip_users table: %', SQLERRM;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS trip_users_trip_id_idx ON trip_users(trip_id);
CREATE INDEX IF NOT EXISTS trip_users_user_id_idx ON trip_users(user_id);
CREATE INDEX IF NOT EXISTS trip_users_role_idx ON trip_users(role);
CREATE INDEX IF NOT EXISTS trip_users_active_idx ON trip_users(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE trip_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_users table
DROP POLICY IF EXISTS "Users can view trip memberships for accessible trips" ON trip_users;
CREATE POLICY "Users can view trip memberships for accessible trips" ON trip_users
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_users.trip_id 
      AND (
        trips.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_users tu2
          WHERE tu2.trip_id = trips.id 
          AND tu2.user_id = auth.uid()
          AND tu2.is_active = true
        ) OR
        (trips.is_public = true AND trips.archived = false)
      )
    )
  );

DROP POLICY IF EXISTS "Trip admins can manage memberships" ON trip_users;
CREATE POLICY "Trip admins can manage memberships" ON trip_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_users.trip_id 
      AND (
        trips.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_users tu2
          WHERE tu2.trip_id = trips.id 
          AND tu2.user_id = auth.uid()
          AND tu2.role = 'admin'
          AND tu2.is_active = true
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON trip_users;
CREATE POLICY "Users can update their own membership" ON trip_users
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trip_users table
DROP POLICY IF EXISTS "Users can view trip memberships for accessible trips" ON trip_users;
CREATE POLICY "Users can view trip memberships for accessible trips" ON trip_users
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_users.trip_id 
      AND (
        trips.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_users tu2
          WHERE tu2.trip_id = trips.id 
          AND tu2.user_id = auth.uid()
          AND tu2.is_active = true
        ) OR
        (trips.is_public = true AND trips.archived = false)
      )
    )
  );

DROP POLICY IF EXISTS "Trip admins can manage memberships" ON trip_users;
CREATE POLICY "Trip admins can manage memberships" ON trip_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_users.trip_id 
      AND (
        trips.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_users tu2
          WHERE tu2.trip_id = trips.id 
          AND tu2.user_id = auth.uid()
          AND tu2.role = 'admin'
          AND tu2.is_active = true
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON trip_users;
CREATE POLICY "Users can update their own membership" ON trip_users
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
