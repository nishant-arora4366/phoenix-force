/**
 * Test script to verify Supabase Realtime connection
 * Run this with: node scripts/test-realtime-connection.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

console.log('🔍 Testing Supabase Realtime Connection\n')
console.log('Supabase URL:', supabaseUrl)
console.log('Using anon key:', supabaseAnonKey.substring(0, 20) + '...\n')

// Test 1: Subscribe to tournament_slots without authentication
console.log('📡 Test 1: Subscribing to tournament_slots (public)...')
const slotsChannel = supabase
  .channel('test-slots')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tournament_slots'
    },
    (payload) => {
      console.log('✅ Received slot change:', payload)
    }
  )
  .subscribe((status) => {
    console.log('   Slots channel status:', status)
    
    if (status === 'SUBSCRIBED') {
      console.log('   ✅ Successfully subscribed to tournament_slots\n')
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.log('   ❌ Failed to subscribe:', status)
      console.log('   This likely means RLS policies are blocking access\n')
    }
  })

// Test 2: Subscribe to tournaments without authentication
console.log('📡 Test 2: Subscribing to tournaments (public)...')
const tournamentsChannel = supabase
  .channel('test-tournaments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tournaments'
    },
    (payload) => {
      console.log('✅ Received tournament change:', payload)
    }
  )
  .subscribe((status) => {
    console.log('   Tournaments channel status:', status)
    
    if (status === 'SUBSCRIBED') {
      console.log('   ✅ Successfully subscribed to tournaments\n')
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.log('   ❌ Failed to subscribe:', status)
      console.log('   This likely means RLS policies are blocking access\n')
    }
  })

// Keep the script running for 10 seconds to observe subscription status
setTimeout(() => {
  console.log('\n🏁 Test complete. Cleaning up...')
  slotsChannel.unsubscribe()
  tournamentsChannel.unsubscribe()
  process.exit(0)
}, 10000)

console.log('⏳ Waiting for subscription status (10 seconds)...\n')

