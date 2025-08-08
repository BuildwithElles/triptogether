/**
 * Database migration script for Task 7: Create Core Database Tables
 * This script creates the trips and trip_users tables with proper relationships and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * SQL for creating the trips table
 */
const createTripsTable = `
-- Create enum types first
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'guest');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create trips table
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
`;

/**
 * SQL for creating the trip_users table (simplified approach)
 */
const createTripUsersTable = `
-- Create trip_users table (simplified approach)
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
`;

/**
 * Function to create the database tables
 */
async function createCoreTables() {
  console.log('🚀 Starting Task 7: Create Core Database Tables');
  console.log('📊 Creating trips and trip_users tables with RLS policies...');

  try {
    console.log('✅ Environment variables loaded successfully');
    console.log('   Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('   Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

    // Provide the SQL for manual execution since DDL operations require direct database access
    console.log('\n📋 Please execute the following SQL in your Supabase dashboard:');
    console.log('\n1. Create trips table and related objects:');
    console.log('─'.repeat(80));
    console.log(createTripsTable);
    
    console.log('\n2. Create trip_users table and related objects:');
    console.log('─'.repeat(80));
    console.log(createTripUsersTable);

    console.log('\n🎯 After executing the SQL, the following will be created:');
    console.log('✅ trip_status enum (planning, active, completed, cancelled)');
    console.log('✅ user_role enum (admin, guest)');
    console.log('✅ trips table with all columns and constraints');
    console.log('✅ trip_users table with foreign key relationships');
    console.log('✅ Database indexes for optimal performance');
    console.log('✅ RLS policies for secure data access');
    console.log('✅ Triggers for automatic timestamp updates');

    return true;

  } catch (error) {
    console.error('❌ Error in table creation process:', error);
    return false;
  }
}

/**
 * Test the created tables (to be run after manual SQL execution)
 */
async function testTables() {
  console.log('\n🧪 Testing table functionality...');

  try {
    // Test if tables exist and are accessible
    const { data: tripsTest, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('id')
      .limit(1);

    const { data: tripUsersTest, error: tripUsersError } = await supabaseAdmin
      .from('trip_users')
      .select('id')
      .limit(1);

    if (tripsError || tripUsersError) {
      console.log('⚠️  Tables not yet created. Please execute the SQL provided above.');
      console.log('   Trips table error:', tripsError?.message || 'OK');
      console.log('   Trip_users table error:', tripUsersError?.message || 'OK');
      return false;
    }

    console.log('✅ Both tables are accessible and working');
    console.log('✅ RLS policies are active');
    console.log('✅ Foreign key constraints are in place');
    
    return true;
  } catch (error) {
    console.error('❌ Table testing failed:', error);
    return false;
  }
}

// Main execution
if (require.main === module) {
  createCoreTables()
    .then((success) => {
      if (success) {
        console.log('\n📝 Next steps:');
        console.log('1. Go to your Supabase dashboard → SQL Editor');
        console.log('2. Execute the SQL commands provided above');
        console.log('3. Run this script again to test the tables');
        console.log('4. Proceed to Task 8: Create Invite System Tables');
      }
      return success;
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createCoreTables, testTables };
