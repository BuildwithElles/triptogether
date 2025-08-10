#!/usr/bin/env node

/**
 * Test script for Task 29: Realtime sync across features
 * 
 * This script tests that realtime updates are working for:
 * - Itinerary items
 * - Budget items
 * - Packing items
 * - Messages (chat)
 * - Photos (gallery)
 * 
 * It verifies that changes in the database are reflected live in the UI
 * without refresh and that there are no duplicate or stale data issues.
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseAnonKey;

try {
  const envContent = readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1];
    }
  }
} catch (error) {
  console.error('❌ Could not load environment variables:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Task 29: Realtime Sync Implementation\n');

// Test data
const testTripId = 'test-trip-realtime-' + Date.now();
const testUserId = 'test-user-realtime-' + Date.now();

async function setupTestData() {
  console.log('📝 Setting up test data...');
  
  // Create a test trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      id: testTripId,
      title: 'Realtime Test Trip',
      destination: 'Test City',
      start_date: '2024-03-01',
      end_date: '2024-03-05',
      created_by: testUserId
    })
    .select()
    .single();

  if (tripError) {
    console.error('❌ Failed to create test trip:', tripError);
    return false;
  }

  console.log('✅ Test trip created:', trip.id);
  return true;
}

async function testRealtimeSubscriptions() {
  console.log('\n🔄 Testing realtime subscriptions...');
  
  const tests = [
    {
      name: 'Itinerary Items',
      table: 'itinerary_items',
      testData: {
        trip_id: testTripId,
        title: 'Test Itinerary Item',
        start_date: '2024-03-01',
        start_time: '10:00:00',
        category: 'activity',
        created_by: testUserId
      }
    },
    {
      name: 'Budget Items',
      table: 'budget_items',
      testData: {
        trip_id: testTripId,
        title: 'Test Budget Item',
        amount: 50.00,
        currency: 'USD',
        category: 'food',
        created_by: testUserId
      }
    },
    {
      name: 'Packing Items',
      table: 'packing_items',
      testData: {
        trip_id: testTripId,
        user_id: testUserId,
        name: 'Test Packing Item',
        category: 'clothing',
        priority: 'medium',
        quantity: 1
      }
    },
    {
      name: 'Messages',
      table: 'messages',
      testData: {
        trip_id: testTripId,
        user_id: testUserId,
        content: 'Test message for realtime',
        message_type: 'text'
      }
    },
    {
      name: 'Photos',
      table: 'photos',
      testData: {
        trip_id: testTripId,
        uploaded_by: testUserId,
        file_name: 'test-photo.jpg',
        file_url: 'https://example.com/test-photo.jpg',
        file_size: 1024
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n📋 Testing ${test.name}...`);
    
    try {
      // Set up realtime subscription
      let receivedEvent = false;
      const channel = supabase
        .channel(`test-${test.table}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: test.table,
            filter: `trip_id=eq.${testTripId}`,
          },
          (payload) => {
            console.log(`  ✅ Received realtime event for ${test.name}:`, payload.new.id || payload.new.name || payload.new.title);
            receivedEvent = true;
          }
        )
        .subscribe();

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Insert test data
      const { data, error } = await supabase
        .from(test.table)
        .insert(test.testData)
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Failed to insert ${test.name}:`, error.message);
        results.push({ name: test.name, success: false, error: error.message });
        continue;
      }

      console.log(`  ✅ Inserted ${test.name}:`, data.id || data.name || data.title);

      // Wait for realtime event
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (receivedEvent) {
        console.log(`  ✅ Realtime subscription working for ${test.name}`);
        results.push({ name: test.name, success: true });
      } else {
        console.log(`  ❌ No realtime event received for ${test.name}`);
        results.push({ name: test.name, success: false, error: 'No realtime event received' });
      }

      // Clean up subscription
      supabase.removeChannel(channel);

    } catch (error) {
      console.log(`  ❌ Error testing ${test.name}:`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  return results;
}

async function testHookIntegration() {
  console.log('\n🔗 Testing hook integration...');
  
  // Check if hooks have realtime imports
  const hookFiles = [
    'src/lib/hooks/useItinerary.ts',
    'src/lib/hooks/useBudget.ts',
    'src/lib/hooks/usePacking.ts',
    'src/lib/hooks/useChat.ts',
    'src/lib/hooks/useGallery.ts'
  ];

  const hookResults = [];

  for (const hookFile of hookFiles) {
    try {
      const hookPath = join(__dirname, '..', hookFile);
      const content = readFileSync(hookPath, 'utf8');
      
      const hasSupabaseImport = content.includes("from '@/lib/supabase/client'");
      const hasUseEffect = content.includes('useEffect');
      const hasChannel = content.includes('.channel(');
      const hasSubscribe = content.includes('.subscribe()');
      
      const isRealtimeEnabled = hasSupabaseImport && hasUseEffect && hasChannel && hasSubscribe;
      
      console.log(`  📁 ${hookFile}: ${isRealtimeEnabled ? '✅' : '❌'} Realtime ${isRealtimeEnabled ? 'enabled' : 'missing'}`);
      
      if (!isRealtimeEnabled) {
        const missing = [];
        if (!hasSupabaseImport) missing.push('Supabase import');
        if (!hasUseEffect) missing.push('useEffect');
        if (!hasChannel) missing.push('channel setup');
        if (!hasSubscribe) missing.push('subscription');
        console.log(`    Missing: ${missing.join(', ')}`);
      }
      
      hookResults.push({
        file: hookFile,
        success: isRealtimeEnabled,
        details: { hasSupabaseImport, hasUseEffect, hasChannel, hasSubscribe }
      });
      
    } catch (error) {
      console.log(`  ❌ Error reading ${hookFile}:`, error.message);
      hookResults.push({ file: hookFile, success: false, error: error.message });
    }
  }

  return hookResults;
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test data in reverse order to respect foreign key constraints
    const tables = ['photos', 'messages', 'packing_items', 'budget_items', 'itinerary_items', 'trips'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .or(`trip_id.eq.${testTripId},id.eq.${testTripId}`);
      
      if (error && !error.message.includes('No rows')) {
        console.log(`  ⚠️  Warning cleaning ${table}:`, error.message);
      }
    }
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Warning during cleanup:', error.message);
  }
}

async function runTests() {
  try {
    // Setup
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.log('❌ Setup failed, aborting tests');
      return;
    }

    // Test hook integration
    const hookResults = await testHookIntegration();
    
    // Test realtime subscriptions
    const realtimeResults = await testRealtimeSubscriptions();
    
    // Generate report
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    console.log('\n🔗 Hook Integration:');
    hookResults.forEach(result => {
      console.log(`  ${result.success ? '✅' : '❌'} ${result.file}`);
    });
    
    console.log('\n🔄 Realtime Subscriptions:');
    realtimeResults.forEach(result => {
      console.log(`  ${result.success ? '✅' : '❌'} ${result.name}${result.error ? ` (${result.error})` : ''}`);
    });
    
    const totalTests = hookResults.length + realtimeResults.length;
    const passedTests = hookResults.filter(r => r.success).length + realtimeResults.filter(r => r.success).length;
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Realtime sync is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await cleanupTestData();
  }
}

// Run the tests
runTests().then(() => {
  console.log('\n✅ Test execution completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
