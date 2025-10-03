// Direct RPC testing script
// This script tests the RPCs directly through Supabase client
// Run this after applying the RPCs to the database

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'

if (supabaseUrl === 'your_supabase_url' || supabaseServiceKey === 'your_service_role_key') {
  console.log('❌ Please set up your Supabase credentials in .env.local')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// Test data
const testTournamentId = '00000000-0000-0000-0000-000000000001'
const testPlayerIds = [
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015'
]

// Helper function to test RPC
async function testRPC(rpcName, params, description) {
  console.log(`\n🧪 Testing ${description}...`)
  
  try {
    const { data, error } = await supabase.rpc(rpcName, params)
    
    if (error) {
      console.log(`❌ ${description} failed:`)
      console.log(`   Error: ${error.message}`)
      console.log(`   Code: ${error.code}`)
      return { success: false, error }
    }
    
    console.log(`✅ ${description} succeeded:`)
    console.log(`   Result:`, JSON.stringify(data, null, 2))
    return { success: true, data }
    
  } catch (err) {
    console.log(`❌ ${description} failed with exception:`)
    console.log(`   Error: ${err.message}`)
    return { success: false, error: err.message }
  }
}

// Test 1: Create a test tournament
async function createTestTournament() {
  console.log('\n🏗️ Creating test tournament...')
  
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        id: testTournamentId,
        name: 'Test Tournament',
        host_id: 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1', // nishantarora's user ID
        status: 'registration_open',
        total_slots: 5,
        min_bid_amount: 100,
        min_increment: 10
      })
      .select()
    
    if (error) {
      console.log('❌ Failed to create tournament:', error.message)
      return false
    }
    
    console.log('✅ Test tournament created:', data[0])
    return true
    
  } catch (err) {
    console.log('❌ Exception creating tournament:', err.message)
    return false
  }
}

// Test 2: Create test players
async function createTestPlayers() {
  console.log('\n👥 Creating test players...')
  
  const players = testPlayerIds.map((id, index) => ({
    id: id,
    display_name: `Test Player ${index + 1}`,
    stage_name: `Player${index + 1}`,
    bio: `Test player ${index + 1} for slot management testing`,
    base_price: 100 + (index * 50),
    group_name: index % 2 === 0 ? 'Group A' : 'Group B',
    is_bowler: index % 3 === 0,
    is_batter: true,
    is_wicket_keeper: index % 4 === 0,
    bowling_rating: index % 3 === 0 ? 7 : 0,
    batting_rating: 6 + (index % 4),
    wicket_keeping_rating: index % 4 === 0 ? 8 : 0
  }))
  
  try {
    const { data, error } = await supabase
      .from('players')
      .insert(players)
      .select()
    
    if (error) {
      console.log('❌ Failed to create players:', error.message)
      return false
    }
    
    console.log(`✅ Created ${data.length} test players`)
    return true
    
  } catch (err) {
    console.log('❌ Exception creating players:', err.message)
    return false
  }
}

// Test 3: Test register_player RPC
async function testRegisterPlayer() {
  console.log('\n📝 Testing register_player RPC...')
  
  const results = []
  
  for (let i = 0; i < testPlayerIds.length; i++) {
    const result = await testRPC('register_player', {
      p_tournament_id: testTournamentId,
      p_player_id: testPlayerIds[i],
      p_preferred_slot: i + 1,
      p_user_id: 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1'
    }, `Register Player ${i + 1}`)
    
    results.push(result)
  }
  
  return results
}

// Test 4: Test get_tournament_status RPC
async function testTournamentStatus() {
  return await testRPC('get_tournament_status', {
    p_tournament_id: testTournamentId
  }, 'Get Tournament Status')
}

// Test 5: Test confirm_slot RPC
async function testConfirmSlot() {
  console.log('\n✅ Testing confirm_slot RPC...')
  
  // First get tournament slots to find pending ones
  const { data: slots, error } = await supabase
    .from('tournament_slots')
    .select('id, slot_number, status')
    .eq('tournament_id', testTournamentId)
    .eq('status', 'pending')
  
  if (error || !slots || slots.length === 0) {
    console.log('❌ No pending slots found to confirm')
    return false
  }
  
  // Confirm the first pending slot
  const slotToConfirm = slots[0]
  return await testRPC('confirm_slot', {
    p_tournament_id: testTournamentId,
    p_slot_id: slotToConfirm.id,
    p_user_id: 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1'
  }, `Confirm Slot ${slotToConfirm.slot_number}`)
}

// Test 6: Test concurrent reservations (race condition test)
async function testConcurrentReservations() {
  console.log('\n🏃 Testing concurrent reservations (race condition test)...')
  
  const promises = testPlayerIds.slice(0, 3).map((playerId, index) => 
    supabase.rpc('reserve_slot', {
      p_tournament_id: testTournamentId,
      p_player_id: playerId,
      p_slot_number: index + 1,
      p_user_id: 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1'
    })
  )
  
  try {
    const results = await Promise.all(promises)
    console.log('📊 Concurrent reservation results:')
    
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`   Player ${index + 1}: ❌ Failed - ${result.error.message}`)
      } else {
        console.log(`   Player ${index + 1}: ✅ Success`)
        console.log(`      Result:`, JSON.stringify(result.data, null, 2))
      }
    })
    
    return results
    
  } catch (error) {
    console.log('❌ Concurrent test failed:', error.message)
    return false
  }
}

// Test 7: Cleanup test data
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...')
  
  try {
    // Delete tournament slots
    await supabase
      .from('tournament_slots')
      .delete()
      .eq('tournament_id', testTournamentId)
    
    // Delete waitlist entries
    await supabase
      .from('waitlist')
      .delete()
      .eq('tournament_id', testTournamentId)
    
    // Delete tournament
    await supabase
      .from('tournaments')
      .delete()
      .eq('id', testTournamentId)
    
    // Delete test players
    await supabase
      .from('players')
      .delete()
      .in('id', testPlayerIds)
    
    console.log('✅ Test data cleaned up')
    return true
    
  } catch (err) {
    console.log('❌ Cleanup failed:', err.message)
    return false
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Direct RPC Tests\n')
  
  // Setup
  const tournamentCreated = await createTestTournament()
  if (!tournamentCreated) {
    console.log('❌ Cannot proceed without test tournament')
    return
  }
  
  const playersCreated = await createTestPlayers()
  if (!playersCreated) {
    console.log('❌ Cannot proceed without test players')
    return
  }
  
  // Run tests
  await testRegisterPlayer()
  await testTournamentStatus()
  await testConfirmSlot()
  await testConcurrentReservations()
  
  // Cleanup
  await cleanupTestData()
  
  console.log('\n🏁 All tests completed!')
}

// Check if RPCs exist
async function checkRPCs() {
  console.log('🔍 Checking if RPCs exist...')
  
  const rpcs = ['reserve_slot', 'confirm_slot', 'register_player', 'get_tournament_status', 'cancel_slot_reservation']
  
  for (const rpc of rpcs) {
    try {
      const { error } = await supabase.rpc(rpc, {})
      if (error && error.code === '42883') { // Function does not exist
        console.log(`❌ RPC '${rpc}' does not exist`)
        return false
      } else {
        console.log(`✅ RPC '${rpc}' exists`)
      }
    } catch (err) {
      console.log(`❌ Error checking RPC '${rpc}':`, err.message)
      return false
    }
  }
  
  return true
}

// Run the tests
async function main() {
  console.log('🔧 Checking RPC availability...')
  
  const rpcsExist = await checkRPCs()
  if (!rpcsExist) {
    console.log('\n❌ Some RPCs are missing. Please run the SQL script first:')
    console.log('   supabase-schema/13-slot-management-rpcs.sql')
    console.log('\n📋 Instructions:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Copy and paste the contents of supabase-schema/13-slot-management-rpcs.sql')
    console.log('   3. Click Run to execute the script')
    console.log('   4. Then run this test again')
    return
  }
  
  console.log('\n✅ All RPCs are available. Starting tests...\n')
  await runTests()
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  runTests,
  checkRPCs,
  testRPC,
  createTestTournament,
  createTestPlayers,
  cleanupTestData
}
