# Slot Management System Documentation

## Overview

The Phoenix Force slot management system provides atomic, race-condition-free operations for tournament slot reservations, confirmations, and player registrations. All operations use PostgreSQL transactions and row-level locking to ensure data consistency.

## 🏗️ Architecture

### Database RPCs (PostgreSQL Functions)
- `reserve_slot()` - Atomically reserve a tournament slot
- `confirm_slot()` - Confirm a pending slot reservation
- `register_player()` - Register a player for a tournament
- `get_tournament_status()` - Get comprehensive tournament status
- `cancel_slot_reservation()` - Cancel a pending reservation

### API Endpoints (Next.js)
- `POST /api/reserve-slot` - Reserve a slot
- `POST /api/confirm-slot` - Confirm a slot
- `POST /api/register-player` - Register a player
- `GET /api/tournament-status` - Get tournament status
- `POST /api/cancel-slot` - Cancel a reservation

## 🔒 Race Condition Prevention

### 1. Row-Level Locking
```sql
SELECT * FROM tournament_slots 
WHERE tournament_id = p_tournament_id 
AND status = 'empty'
ORDER BY slot_number
LIMIT 1
FOR UPDATE; -- Locks the row to prevent concurrent access
```

### 2. Atomic Transactions
All operations are wrapped in PostgreSQL transactions that either:
- ✅ Complete successfully (COMMIT)
- ❌ Fail completely (ROLLBACK)

### 3. Status Validation
Each operation validates the current state before making changes:
- Check tournament status (registration_open, etc.)
- Verify slot availability
- Prevent duplicate registrations

## 📊 Slot Status Flow

```
empty → pending → confirmed
  ↓        ↓
waitlist  cancelled
```

### Status Definitions
- **empty**: Available slot
- **pending**: Reserved but not confirmed
- **confirmed**: Final registration
- **waitlist**: Tournament is full
- **cancelled**: Reservation was cancelled

## 🚀 Usage Examples

### 1. Reserve a Specific Slot
```javascript
const response = await fetch('/api/reserve-slot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournament_id: 'tournament-uuid',
    player_id: 'player-uuid',
    slot_number: 5  // Optional: specific slot
  })
})
```

### 2. Register a Player (Auto-assign slot)
```javascript
const response = await fetch('/api/register-player', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournament_id: 'tournament-uuid',
    player_id: 'player-uuid',
    preferred_slot: 3  // Optional: preferred slot
  })
})
```

### 3. Confirm a Slot
```javascript
const response = await fetch('/api/confirm-slot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournament_id: 'tournament-uuid',
    slot_id: 'slot-uuid'
  })
})
```

### 4. Get Tournament Status
```javascript
const response = await fetch('/api/tournament-status?tournament_id=tournament-uuid')
const status = await response.json()

console.log(`Tournament: ${status.data.tournament_name}`)
console.log(`Slots: ${status.data.filled_slots}/${status.data.total_slots}`)
console.log(`Waitlist: ${status.data.waitlist_count}`)
```

## 🔄 Concurrent Access Handling

### Scenario: Multiple Players Want Same Slot
1. **Player A** requests slot #5
2. **Player B** requests slot #5 simultaneously
3. **Database locks** the row for Player A
4. **Player A** gets slot #5
5. **Player B** gets next available slot or waitlist

### Scenario: Tournament Fills Up
1. **Player A** registers → gets slot #1
2. **Player B** registers → gets slot #2
3. **Player C** registers → tournament full → waitlist position #1
4. **Player D** registers → waitlist position #2

## 🛡️ Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Tournament not found or not accepting registrations",
  "tournament_id": "uuid"
}
```

### Error Types
- **Validation Errors**: Missing required fields
- **Business Logic Errors**: Tournament full, player already registered
- **Database Errors**: Constraint violations, connection issues
- **Authentication Errors**: User not authenticated

## 🧪 Testing

### Run Test Suite
```bash
node test-slot-management.js
```

### Test Scenarios
1. **Concurrent Reservations**: Multiple players reserving simultaneously
2. **Slot Conflicts**: Players requesting same slot
3. **Tournament Capacity**: Testing full tournament scenarios
4. **Status Transitions**: Testing slot status changes
5. **Error Handling**: Testing invalid inputs and edge cases

## 📈 Performance Considerations

### Database Optimization
- **Indexes**: On tournament_id, player_id, status columns
- **Row Locking**: Minimal lock duration
- **Transaction Size**: Small, focused transactions

### API Performance
- **Connection Pooling**: Reuse database connections
- **Error Handling**: Fast failure for invalid requests
- **Response Caching**: Tournament status can be cached

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
1. Run `supabase-schema/13-slot-management-rpcs.sql` in Supabase SQL Editor
2. Ensure RLS policies are enabled
3. Test with sample data

## 🚨 Security Considerations

### Authentication
- All endpoints require user authentication
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

## 📋 API Reference

### POST /api/reserve-slot
**Request:**
```json
{
  "tournament_id": "uuid",
  "player_id": "uuid",
  "slot_number": 5  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slot_id": "uuid",
    "slot_number": 5,
    "status": "pending"
  }
}
```

### POST /api/confirm-slot
**Request:**
```json
{
  "tournament_id": "uuid",
  "slot_id": "uuid"
}
```

### GET /api/tournament-status
**Query Parameters:**
- `tournament_id`: Tournament UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "tournament_name": "Spring Tournament",
    "status": "registration_open",
    "total_slots": 10,
    "filled_slots": 7,
    "confirmed_slots": 5,
    "pending_slots": 2,
    "available_slots": 3,
    "waitlist_count": 0,
    "is_full": false
  }
}
```

## 🎯 Best Practices

### For Developers
1. **Always handle errors** from API responses
2. **Check success field** before processing data
3. **Use proper HTTP status codes** for error handling
4. **Implement retry logic** for transient failures

### For Database Operations
1. **Keep transactions short** to minimize lock time
2. **Use appropriate indexes** for query performance
3. **Monitor deadlock situations** in high-concurrency scenarios
4. **Test with realistic data volumes**

### For User Experience
1. **Show loading states** during slot operations
2. **Provide clear error messages** to users
3. **Implement optimistic UI updates** where appropriate
4. **Handle network failures gracefully**

## 🔮 Future Enhancements

### Planned Features
- **Real-time updates** using Supabase subscriptions
- **Bulk operations** for multiple slot reservations
- **Advanced filtering** for tournament slots
- **Analytics dashboard** for tournament statistics
- **Mobile app integration** for on-the-go management

### Performance Improvements
- **Connection pooling** optimization
- **Query result caching** for frequently accessed data
- **Background job processing** for heavy operations
- **Database partitioning** for large tournaments
