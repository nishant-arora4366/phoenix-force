// Test script for slot management RPCs
// This script demonstrates race condition prevention and proper transaction handling

const BASE_URL = 'http://localhost:3000/api'

// Test data
const testTournamentId = 'test-tournament-id'
const testPlayerIds = [
  'player-1-id',
  'player-2-id', 
  'player-3-id',
  'player-4-id',
  'player-5-id'
]

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  if (data) {
    options.body = JSON.stringify(data)
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options)
  return await response.json()
}

// Test 1: Reserve slots concurrently (race condition test)
async function testConcurrentReservations() {
  console.log('🧪 Testing concurrent slot reservations...')
  
  const promises = testPlayerIds.map((playerId, index) => 
    apiCall('/reserve-slot', 'POST', {
      tournament_id: testTournamentId,
      player_id: playerId,
      slot_number: index + 1 // Each player wants a specific slot
    })
  )
  
  try {
    const results = await Promise.all(promises)
    console.log('📊 Concurrent reservation results:')
    results.forEach((result, index) => {
      console.log(`Player ${index + 1}:`, result.success ? '✅ Success' : '❌ Failed')
      if (!result.success) {
        console.log(`  Error: ${result.error}`)
      }
    })
  } catch (error) {
    console.error('❌ Concurrent test failed:', error)
  }
}

// Test 2: Register players with preferred slots
async function testPlayerRegistration() {
  console.log('🧪 Testing player registration...')
  
  for (let i = 0; i < testPlayerIds.length; i++) {
    try {
      const result = await apiCall('/register-player', 'POST', {
        tournament_id: testTournamentId,
        player_id: testPlayerIds[i],
        preferred_slot: i + 1
      })
      
      console.log(`Player ${i + 1} registration:`, result.success ? '✅ Success' : '❌ Failed')
      if (result.data) {
        console.log(`  Slot ID: ${result.data.slot_id}`)
        console.log(`  Status: ${result.data.status}`)
      }
    } catch (error) {
      console.error(`❌ Player ${i + 1} registration failed:`, error)
    }
  }
}

// Test 3: Get tournament status
async function testTournamentStatus() {
  console.log('🧪 Testing tournament status...')
  
  try {
    const result = await apiCall(`/tournament-status?tournament_id=${testTournamentId}`)
    
    if (result.success) {
      console.log('📊 Tournament Status:')
      console.log(`  Name: ${result.data.tournament_name}`)
      console.log(`  Status: ${result.data.status}`)
      console.log(`  Total Slots: ${result.data.total_slots}`)
      console.log(`  Filled Slots: ${result.data.filled_slots}`)
      console.log(`  Confirmed: ${result.data.confirmed_slots}`)
      console.log(`  Pending: ${result.data.pending_slots}`)
      console.log(`  Available: ${result.data.available_slots}`)
      console.log(`  Waitlist: ${result.data.waitlist_count}`)
      console.log(`  Is Full: ${result.data.is_full}`)
    } else {
      console.log('❌ Failed to get tournament status:', result.error)
    }
  } catch (error) {
    console.error('❌ Tournament status test failed:', error)
  }
}

// Test 4: Confirm slots
async function testSlotConfirmation() {
  console.log('🧪 Testing slot confirmation...')
  
  // First get tournament status to see pending slots
  const statusResult = await apiCall(`/tournament-status?tournament_id=${testTournamentId}`)
  
  if (statusResult.success && statusResult.data.pending_slots > 0) {
    console.log(`Found ${statusResult.data.pending_slots} pending slots to confirm`)
    
    // In a real scenario, you'd get the actual slot IDs from the database
    // For this test, we'll simulate confirming slots
    for (let i = 0; i < Math.min(2, statusResult.data.pending_slots); i++) {
      try {
        const result = await apiCall('/confirm-slot', 'POST', {
          tournament_id: testTournamentId,
          slot_id: `slot-${i + 1}-id` // This would be the actual slot ID
        })
        
        console.log(`Slot ${i + 1} confirmation:`, result.success ? '✅ Success' : '❌ Failed')
      } catch (error) {
        console.error(`❌ Slot ${i + 1} confirmation failed:`, error)
      }
    }
  }
}

// Test 5: Cancel slot reservation
async function testSlotCancellation() {
  console.log('🧪 Testing slot cancellation...')
  
  try {
    const result = await apiCall('/cancel-slot', 'POST', {
      tournament_id: testTournamentId,
      slot_id: 'slot-1-id' // This would be the actual slot ID
    })
    
    console.log('Slot cancellation:', result.success ? '✅ Success' : '❌ Failed')
    if (result.data) {
      console.log(`  Message: ${result.data.message}`)
    }
  } catch (error) {
    console.error('❌ Slot cancellation test failed:', error)
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Slot Management Tests\n')
  
  await testConcurrentReservations()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await testPlayerRegistration()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await testTournamentStatus()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await testSlotConfirmation()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await testSlotCancellation()
  
  console.log('\n🏁 All tests completed!')
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testConcurrentReservations,
    testPlayerRegistration,
    testTournamentStatus,
    testSlotConfirmation,
    testSlotCancellation,
    runAllTests
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests()
}
