# Captain Skip Feature

## Overview
Captains can now skip players they're not interested in bidding on during live auctions. When a captain skips a player, all users see that the captain is "OUT" for that specific player.

## Database Setup

### 1. Run the Migration
Execute the SQL migration to create the `auction_skips` table:

```bash
psql -U your_username -d your_database -f database-setup/migrations/add_auction_skips_table.sql
```

Or run directly in Supabase SQL Editor:
- Navigate to Supabase Dashboard → SQL Editor
- Copy contents of `database-setup/migrations/add_auction_skips_table.sql`
- Execute the query

### 2. Table Structure
```sql
auction_skips (
  id UUID PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id),
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES auction_teams(id),
  skipped_at TIMESTAMP,
  UNIQUE(auction_id, player_id, team_id)
)
```

## Features

### For Captains:
- **Skip Button**: Each captain sees a "Skip" button next to their bid controls
- **One-time Action**: Once skipped, the button disappears and cannot be undone
- **Disabled Bidding**: After skipping, bid buttons are disabled for that player
- **Visual Feedback**: Status shows "OUT" with red indicator

### For All Users:
- **Real-time Updates**: Skip actions broadcast instantly via Supabase realtime
- **Status Indicator**: "OUT" label with red dot in status column
- **Transparent**: Everyone sees which captains have skipped

### Automatic Reset:
- Skip state clears automatically when moving to the next player
- Fresh start for each new player in the auction

## API Endpoints

### POST /api/auctions/[id]/skip
**Purpose**: Captain skips the current player

**Authentication**: Required (captain only)

**Request Body**:
```json
{
  "player_id": "uuid",
  "team_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Player skipped successfully"
}
```

**Validations**:
- User must be the team captain
- Player must be current
- Player must be available (not sold)
- Cannot skip same player twice

### GET /api/auctions/[id]/skip?player_id=uuid
**Purpose**: Fetch existing skips for a player

**Authentication**: Public (no auth required)

**Response**:
```json
{
  "skips": [
    {
      "team_id": "uuid",
      "skipped_at": "2025-01-24T15:30:00Z"
    }
  ]
}
```

## UI Components

### Captain Bids Card
- **Location**: Main auction page, Captain Bids section
- **Skip Button**: Red button labeled "Skip" next to bid controls
- **Status Column**: Shows "OUT" with red dot when skipped
- **Disabled State**: Bid buttons grayed out after skip

### Visual States:
1. **Active**: Skip button visible, can bid
2. **Skipped**: "OUT" label, bid buttons disabled
3. **Winning**: Green dot (overrides skip display if bid before skip)

## Realtime Synchronization

### Subscription Channel
```typescript
supabase.channel(`auction-skips-${auctionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'auction_skips',
    filter: `auction_id=eq.${auctionId}`
  }, (payload) => {
    // Update skipped captains set
  })
```

### State Management
- **Local State**: `Set<string>` of team IDs that have skipped
- **Cleared On**: Current player changes
- **Updated By**: Realtime INSERT events

## User Experience

### Captain Flow:
1. View current player
2. Decide not to bid
3. Click "Skip" button
4. Button disappears, status shows "OUT"
5. Cannot bid on this player anymore
6. When next player appears, can bid again

### Viewer Flow:
1. See all captains' bid controls
2. Watch skip actions in real-time
3. Status column shows who's "OUT"
4. Understand bidding dynamics

## Technical Implementation

### Frontend State:
```typescript
const [skippedCaptains, setSkippedCaptains] = useState<Set<string>>(new Set())
const [skipLoading, setSkipLoading] = useState(false)
```

### Skip Handler:
```typescript
const handleSkipPlayer = async (teamId: string) => {
  // POST to /api/auctions/[id]/skip
  // Optimistically update local state
  // Realtime confirms to all users
}
```

### Auto-clear Effect:
```typescript
useEffect(() => {
  setSkippedCaptains(new Set())
}, [currentPlayer?.player_id])
```

## Security

### Row Level Security (RLS):
- **SELECT**: Public (anyone can view skips)
- **INSERT**: Authenticated users only (API validates captain)

### API Validation:
1. User authentication required
2. User must be team captain
3. Player must be current
4. Player must be available
5. Unique constraint prevents duplicate skips

## Benefits

1. **Strategic Clarity**: Captains signal disinterest clearly
2. **Faster Auctions**: No waiting for captains who won't bid
3. **Transparent**: Everyone sees who's in/out
4. **Real-time**: Instant updates across all clients
5. **Simple UX**: One-click action, automatic reset

## Future Enhancements

Potential improvements:
- Skip analytics (most skipped players)
- Undo skip (with time limit)
- Skip notifications
- Skip history per captain
- Auto-skip based on budget constraints
