/**
 * Quick verification script to check if tables were created successfully
 * Run this after executing the SQL in Supabase dashboard
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

async function quickTest() {
  console.log('🔍 Quick verification of database tables...');
  
  try {
    // Test trips table
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .limit(1);

    if (tripsError) {
      console.log('❌ trips table error:', tripsError.message);
      console.log('👉 Please execute the SQL in Supabase dashboard first');
      return false;
    }

    // Test trip_users table  
    const { data: tripUsers, error: tripUsersError } = await supabaseAdmin
      .from('trip_users')
      .select('*')
      .limit(1);

    if (tripUsersError) {
      console.log('❌ trip_users table error:', tripUsersError.message);
      console.log('👉 Please execute the SQL in Supabase dashboard first');
      return false;
    }

    console.log('✅ trips table: Working');
    console.log('✅ trip_users table: Working');
    console.log('🎉 Database tables created successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  quickTest()
    .then(success => {
      if (success) {
        console.log('\n🚀 Task 7 database tables are ready!');
        console.log('📖 You can now proceed with Task 8 or continue development');
      } else {
        console.log('\n📋 To fix this:');
        console.log('1. Go to https://supabase.com/dashboard/project/ydoliynzkolkpfjxzpxv');
        console.log('2. Click "SQL Editor" in the sidebar');
        console.log('3. Copy and paste the SQL from scripts/task7-schema.sql');
        console.log('4. Click "Run" to execute');
        console.log('5. Run this script again to verify');
      }
      process.exit(success ? 0 : 1);
    });
}

module.exports = { quickTest };
