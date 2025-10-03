# Slot Management Setup Guide

## 🚀 Quick Setup Instructions

### 1. Apply Database RPCs
First, you need to run the SQL script in Supabase to create the RPCs:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `supabase-schema/13-slot-management-rpcs.sql`
3. **Click Run** to execute the script

### 2. Verify RPCs are Created
After running the SQL script, you should see these functions in your database:
- `reserve_slot()`
- `confirm_slot()`
- `register_player()`
- `get_tournament_status()`
- `cancel_slot_reservation()`

### 3. Test the System
Once the RPCs are applied, you can test the slot management system:

```bash
# Test with authentication (requires login)
node test-slot-management.js

# Or test RPCs directly (requires service role key)
node test-rpc-direct.js
```

## 🧪 Testing the Slot Management System

### Test 1: Create a Tournament
```javascript
// Use the existing tournament creation form
// Go to http://localhost:3000/tournaments/create
// Create a tournament with 5 slots
```

### Test 2: Register Players
```javascript
// Use the API endpoints
const response = await fetch('/api/register-player', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournament_id: 'your-tournament-id',
    player_id: 'your-player-id',
    preferred_slot: 1
  })
})
```

### Test 3: Check Tournament Status
```javascript
const response = await fetch('/api/tournament-status?tournament_id=your-tournament-id')
const status = await response.json()
console.log('Tournament Status:', status.data)
```

## 🔧 Manual Testing Steps

### Step 1: Create Test Data
1. **Create a tournament** using the tournament creation form
2. **Note the tournament ID** from the response
3. **Use existing players** or create new ones

### Step 2: Test Slot Reservations
1. **Register multiple players** for the same tournament
2. **Try to reserve the same slot** with different players
3. **Check that only one player gets the slot**

### Step 3: Test Race Conditions
1. **Open multiple browser tabs**
2. **Try to register the same player simultaneously**
3. **Verify that only one registration succeeds**

### Step 4: Test Tournament Capacity
1. **Register players until tournament is full**
2. **Try to register one more player**
3. **Verify they get added to waitlist**

## 📊 Expected Results

### Successful Registration
```json
{
  "success": true,
  "data": {
    "slot_id": "uuid",
    "slot_number": 1,
    "status": "pending"
  }
}
```

### Tournament Full (Waitlist)
```json
{
  "success": true,
  "message": "Tournament is full. Player added to waitlist.",
  "waitlist_position": 1
}
```

### Race Condition Prevention
```json
{
  "success": false,
  "error": "Player is already registered in this tournament"
}
```

## 🛠️ Troubleshooting

### Error: "Function does not exist"
- **Solution**: Run the SQL script in Supabase SQL Editor
- **Check**: Verify the RPCs are created in the database

### Error: "Authentication required"
- **Solution**: Make sure you're logged in to the application
- **Check**: Verify the user is synced to the database

### Error: "Tournament not found"
- **Solution**: Use a valid tournament ID
- **Check**: Create a tournament first using the creation form

### Error: "Player not found"
- **Solution**: Use a valid player ID
- **Check**: Make sure the player exists in the players table

## 🎯 Production Readiness Checklist

- [ ] **RPCs applied** to Supabase database
- [ ] **RLS policies** configured for security
- [ ] **Authentication** working properly
- [ ] **Error handling** tested thoroughly
- [ ] **Race conditions** prevented
- [ ] **Performance** tested with multiple users
- [ ] **Data validation** working correctly

## 📈 Performance Testing

### Load Testing
```bash
# Test concurrent registrations
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/register-player \
    -H "Content-Type: application/json" \
    -d '{"tournament_id":"test-id","player_id":"player-'$i'-id"}' &
done
wait
```

### Database Monitoring
- **Check query performance** in Supabase dashboard
- **Monitor lock contention** during high concurrency
- **Verify transaction rollbacks** on errors

## 🔒 Security Considerations

### Authentication
- All API endpoints require user authentication
- User ID is passed to RPCs for audit trails
- RLS policies enforce access control

### Data Validation
- Input sanitization on all parameters
- Type checking for UUIDs and integers
- Business rule validation in RPCs

### Audit Trail
- All operations log user_id and timestamp
- Status changes are tracked
- Failed attempts are logged

## 🚀 Next Steps

1. **Apply the RPCs** to your Supabase database
2. **Test the system** with the provided test scripts
3. **Create a tournament** and register players
4. **Test race conditions** with multiple users
5. **Monitor performance** and optimize as needed

The slot management system is ready for production use once the RPCs are applied! 🎉
