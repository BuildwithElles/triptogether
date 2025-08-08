/**
 * Diagnostic script to debug table creation step by step
 * This will help identify exactly where the issue is occurring
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function diagnosticCheck() {
  console.log('🔍 Running diagnostic checks for Task 7...');
  
  try {
    // Step 1: Check connection by testing auth
    console.log('\n1️⃣ Testing database connection...');
    
    // Test with auth endpoint which should always be available
    const { data: authTest, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError && !authError.message.includes('Invalid Refresh Token')) {
      console.log('❌ Connection failed:', authError.message);
      console.log('🔧 Check your environment variables and Supabase project settings');
      return false;
    }
    console.log('✅ Database connection successful');

    // Step 2: Check if trips table exists
    console.log('\n2️⃣ Checking if trips table exists...');
    const { data: tripsCheck, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('id')
      .limit(1);
    
    if (tripsError) {
      console.log('❌ Trips table error:', tripsError.message);
      console.log('🔧 Action needed: Create trips table first');
      return false;
    }
    console.log('✅ Trips table exists and is accessible');

    // Step 3: Check if trip_users table exists
    console.log('\n3️⃣ Checking if trip_users table exists...');
    const { data: tripUsersCheck, error: tripUsersError } = await supabaseAdmin
      .from('trip_users')
      .select('id')
      .limit(1);
    
    if (tripUsersError) {
      console.log('❌ Trip_users table error:', tripUsersError.message);
      console.log('🔧 Action needed: Create trip_users table');
      
      // Skip enum check for now since we can't easily access pg_type
      console.log('\n🔍 Enum check skipped (will be verified when creating tables)');
      
      return false;
    }
    console.log('✅ Trip_users table exists and is accessible');

    // Step 4: Check table structure
    console.log('\n4️⃣ Verifying table structures...');
    
    // Test that we can access the columns
    const { data: structureTest, error: structureError } = await supabaseAdmin
      .from('trip_users')
      .select('id, trip_id, user_id, role')
      .limit(0); // Get structure only
    
    if (structureError) {
      console.log('❌ Table structure issue:', structureError.message);
      return false;
    }
    console.log('✅ Table structures are correct');

    console.log('\n🎉 All diagnostic checks passed!');
    console.log('✅ Database connection working');
    console.log('✅ trips table exists');
    console.log('✅ trip_users table exists');
    console.log('✅ Table structures are correct');
    
    return true;

  } catch (error) {
    console.error('💥 Diagnostic check failed:', error);
    return false;
  }
}

async function showExecutionOrder() {
  console.log('\n📋 Recommended execution order for SQL:');
  console.log('');
  console.log('1. Create enums first:');
  console.log('   DO $$ BEGIN');
  console.log('     CREATE TYPE trip_status AS ENUM (\'planning\', \'active\', \'completed\', \'cancelled\');');
  console.log('   EXCEPTION WHEN duplicate_object THEN null; END $$;');
  console.log('');
  console.log('   DO $$ BEGIN');
  console.log('     CREATE TYPE user_role AS ENUM (\'admin\', \'guest\');');
  console.log('   EXCEPTION WHEN duplicate_object THEN null; END $$;');
  console.log('');
  console.log('2. Create trips table (full SQL in task7-schema.sql)');
  console.log('');
  console.log('3. Create trip_users table (full SQL in task7-schema.sql)');
  console.log('');
  console.log('🎯 Execute each section separately if you continue to have issues');
}

// Main execution
if (require.main === module) {
  diagnosticCheck()
    .then((success) => {
      if (!success) {
        showExecutionOrder();
        console.log('\n📝 Troubleshooting steps:');
        console.log('1. Execute the SQL sections in order');
        console.log('2. Check your database user permissions');
        console.log('3. Verify you\'re connected to the correct project');
        console.log('4. Run this diagnostic script again after each step');
      }
      process.exit(success ? 0 : 1);
    });
}

module.exports = { diagnosticCheck, showExecutionOrder };
