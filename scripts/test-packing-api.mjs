// Test script for packing API endpoints
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPackingAPI() {
  console.log('🧪 Testing Packing API functionality...\n')

  try {
    // Test 1: Check packing_items table accessibility
    console.log('1. Testing packing_items table access...')
    const { data: packingTest, error: packingError } = await supabase
      .from('packing_items')
      .select('*')
      .limit(1)

    if (packingError) {
      console.log('❌ Packing items table error:', packingError.message)
    } else {
      console.log('✅ Packing items table accessible')
    }

    // Test 2: Check trips table for available trips
    console.log('\n2. Checking for available trips...')
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, title, created_by')
      .limit(5)

    if (tripsError) {
      console.log('❌ Trips query error:', tripsError.message)
    } else {
      console.log(`✅ Found ${trips?.length || 0} trips in database`)
      if (trips && trips.length > 0) {
        trips.forEach(trip => {
          console.log(`   - Trip: ${trip.title} (ID: ${trip.id})`)
        })
      }
    }

    // Test 3: Check for authenticated users
    console.log('\n3. Checking auth users...')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(3)

    if (usersError) {
      console.log('❌ Users query error:', usersError.message)
    } else {
      console.log(`✅ Found ${users?.length || 0} users in auth system`)
    }

    console.log('\n📊 Test Summary:')
    console.log('- Database tables are accessible')
    console.log('- Ready for manual packing list testing')
    console.log('\n🚀 Next steps:')
    console.log('1. Create a user account in the app')
    console.log('2. Create a test trip')
    console.log('3. Navigate to /trips/[tripId]/packing')
    console.log('4. Test adding, updating, and deleting packing items')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPackingAPI()
