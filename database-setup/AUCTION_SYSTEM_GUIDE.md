# Phoenix Force Auction System - Database Schema & Design Guide

## Overview

The Phoenix Force auction system is a comprehensive, real-time player auction platform designed for cricket tournaments. It supports multiple teams, real-time bidding, draft management, and complete audit trails.

## Database Schema Architecture

### Core Tables

#### 1. **auctions**
Main table managing auction lifecycle and configuration.

**Key Fields:**
- `status`: draft, pending, live, paused, completed, cancelled
- `current_player_id`: Player currently up for bidding
- `current_bid`: Current highest bid amount
- `max_tokens_per_captain`: Total budget per team
- `min_bid_amount`: Minimum starting bid
- `use_base_price`: Whether to use player base prices
- `min_increment`: Minimum bid increment
- `use_fixed_increments`: Fixed vs custom increments
- `custom_increments`: JSONB array of range-based increments
- `timer_seconds`: Timer duration for each action
- `player_order_type`: How players are ordered (base_price_desc, alphabetical, random)
- `player_order`: JSONB array of player IDs in auction order

**Status Flow:**
```
draft → pending → live → [paused] → completed/cancelled
```

#### 2. **auction_teams**
Teams participating in the auction with budget tracking.

**Key Fields:**
- `captain_id`: Player who is captain (from players table)
- `captain_user_id`: User account of captain (for bidding permissions)
- `team_name`: Custom team name set during auction creation
- `max_tokens`: Initial budget allocation
- `remaining_purse`: Current available budget
- `total_spent`: Total amount spent so far
- `players_count`: Number of players acquired
- `required_players`: Total players needed (calculated from tournament format)

**Budget Calculation:**
```
remaining_purse = max_tokens - total_spent
max_bid_possible = remaining_purse - (remaining_slots * min_bid_amount)
```

#### 3. **auction_players**
Players available in the auction with status tracking.

**Key Fields:**
- `status`: pending, current, sold, unsold, skipped
- `base_price`: Player's base price (if configured)
- `sold_to`: Team that acquired the player
- `sold_price`: Final sale price
- `display_order`: Order in which player appears
- `times_skipped`: Count of times player was skipped

**Status Flow:**
```
pending → current → sold/unsold/skipped → [back to pending if skipped]
```

#### 4. **auction_bids**
Complete history of all bids placed.

**Key Fields:**
- `bid_amount`: Amount bid
- `is_winning_bid`: Current highest bid for the player
- `is_final`: Bid that resulted in sale
- `bid_sequence`: Order of bids for a player
- `undone_at`: Timestamp if bid was undone
- `undone_by`: User who undid the bid

**Bid Validation:**
1. Auction must be live
2. Player must be current player
3. Bid must meet increment requirements
4. Team must have sufficient budget
5. Team must reserve budget for remaining slots

#### 5. **auction_actions**
Complete audit trail of all auction actions.

**Action Types:**
- `bid_placed`: A bid was placed
- `player_sold`: Player was sold to a team
- `player_skipped`: Player was skipped
- `undo_bid`: A bid was undone
- `undo_assignment`: A player assignment was undone
- `next_player`: Moved to next player
- `prev_player`: Moved to previous player
- `pause`: Auction paused
- `resume`: Auction resumed
- `complete`: Auction completed
- `cancel`: Auction cancelled

#### 6. **temp_auction_players**
Temporary players created to fill slots when player count isn't a multiple of teams.

**Example:**
- Tournament has 4 teams, 30 players registered
- Need 32 players (8 per team)
- System generates 2 temp players: "Temp Player 1", "Temp Player 2"

## Auction Creation Flow

### Step 1: Auction Details
1. **Select Tournament** - Must have registration closed
2. **Confirm Player List** - Show all confirmed players
3. **Validate Player Count** - Must be multiple of number of teams
4. **Generate Temp Players** - If needed to reach multiple
5. **Select Captains** - Choose from tournament players
6. **Set Team Names** - Name each captain's team

### Step 2: Auction Configuration
1. **Max Tokens** - Budget per captain (default: 2000)
2. **Minimum Bid** - Starting bid amount (default: 100)
3. **Base Price Option** - Use player base prices or not
4. **Minimum Increment** - Bid increment (default: 50)
5. **Increment Type** - Fixed or custom ranges
6. **Custom Increments** - If selected:
   ```json
   [
     {"min": 0, "max": 200, "increment": 50},
     {"min": 200, "max": 500, "increment": 100},
     {"min": 500, "max": 1000, "increment": 200}
   ]
   ```
7. **Timer Duration** - Seconds per action (default: 30)
8. **Player Order** - How to order players:
   - Base Price Descending
   - Base Price Ascending
   - Alphabetical
   - Random

### Step 3: Review and Confirm
Display all settings for final review before creating auction.

### Step 4: Save as Draft
Auction is saved with status='draft' in database. Admin can:
- Continue editing later
- Start the auction
- Delete the draft

## Auction Bidding Flow

### Pre-Auction
1. Auction created with status='draft'
2. Host reviews and clicks "Start Auction"
3. Status changes to 'live'
4. First player from player_order becomes current_player_id

### During Auction

#### Player Bidding Cycle
```
1. Player appears on screen
2. Timer starts (timer_seconds)
3. Captains can place bids
4. Each bid:
   - Validates increment
   - Validates budget
   - Updates current_bid
   - Resets timer
5. Host actions:
   - Sold: Assigns player to highest bidder, moves to next
   - Skip: Marks player as skipped, moves to next (player returns later)
   - Next/Previous: Navigate players
   - Undo Bid: Removes last bid
   - Undo Assignment: Reverses last sale
```

#### Real-time Updates
All viewers see updates via Supabase Realtime:
- Current player
- Current bid
- Team budgets
- Team formations
- Bid history

### Post-Auction
1. All players sold
2. Host clicks "Complete Auction"
3. Status changes to 'completed'
4. Final teams are locked
5. Results are displayed

## Key Functions

### calculate_max_bid_possible(team_id, auction_id)
Calculates maximum bid a team can place while reserving minimum bid for remaining slots.

**Logic:**
```sql
remaining_slots = required_players - players_count - 1
max_bid = remaining_purse - (remaining_slots * min_bid_amount)
```

### get_next_increment(auction_id, current_bid)
Returns required increment based on auction settings and current bid.

**Logic:**
- If fixed increments: return min_increment
- If custom: find applicable range and return that increment
- Default: return min_increment

### place_auction_bid(auction_id, player_id, team_id, bid_amount, bidder_user_id)
Places a bid with complete validation.

**Validations:**
1. Auction is live
2. Player is current player
3. Bid meets increment requirements
4. Bid meets base price (if applicable)
5. Team has sufficient budget
6. Team can reserve for remaining slots

### sell_player_to_highest_bidder(auction_id, player_id, action_by)
Finalizes sale of player to highest bidder.

**Actions:**
1. Mark winning bid as final
2. Update auction_players status to 'sold'
3. Update team: add player, deduct budget
4. Log action in auction_actions
5. Move to next player

## Constraints & Validations

### Team Size Constraint
All teams must have equal size:
```
total_players % number_of_teams = 0
```

If not satisfied, system generates temp players.

### Budget Constraint
Captain cannot bid beyond available budget:
```
bid_amount <= calculate_max_bid_possible(team_id, auction_id)
```

### Reserve Budget Constraint
Team must reserve minimum bid for each remaining slot:
```
remaining_purse >= (remaining_slots * min_bid_amount)
```

## Bidding Metrics Table

Displayed during auction for each team:

| Metric | Calculation |
|--------|-------------|
| Max Tokens | Initial budget (max_tokens) |
| Total Spent | Sum of all winning bids (total_spent) |
| Current Purse | Remaining budget (remaining_purse) |
| Players Acquired | Count of sold players (players_count) |
| Remaining Slots | required_players - players_count |
| Max Bid Possible | calculate_max_bid_possible() |
| Balance After Current Bid | remaining_purse - current_bid |

## Host/Admin Controls

### During Auction
- **Bid on Behalf**: Host can place bids for any captain
- **Sold**: Mark current player as sold to highest bidder
- **Skip**: Skip current player (returns to queue)
- **Next Player**: Move to next player in order
- **Previous Player**: Move to previous player
- **Undo Bid**: Remove last bid for current player
- **Undo Assignment**: Reverse last player sale
- **Pause/Resume**: Pause/resume timer and bidding
- **Complete Auction**: Finalize all sales and end auction
- **Cancel Auction**: Cancel auction (no sales finalized)
- **Change Player Order**: Modify remaining player order
- **Reset Auction**: Clear all bids and start over

### Undo Functionality
- **Undo Bid**: Marks bid as undone, restores previous winning bid
- **Undo Assignment**: Reverses player sale, restores team budget, returns player to auction

## Real-time Subscriptions

### Tables to Subscribe
1. **auctions** - Auction status, current player, current bid
2. **auction_bids** - New bids placed
3. **auction_players** - Player status changes
4. **auction_teams** - Team budget updates
5. **auction_actions** - All actions for audit trail

### Subscription Example (Supabase)
```typescript
const subscription = supabase
  .channel('auction-room')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'auction_bids',
    filter: `auction_id=eq.${auctionId}`
  }, handleBidUpdate)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'auctions',
    filter: `id=eq.${auctionId}`
  }, handleAuctionUpdate)
  .subscribe()
```

## User Roles & Permissions

### Admin
- Full access to all auctions
- Can create, edit, delete any auction
- Can bid on behalf of any captain
- Can perform all host actions

### Host
- Can create auctions for their tournaments
- Can manage their own auctions
- Can bid on behalf of captains in their auctions
- Can perform all auction controls

### Captain
- Can view auction
- Can place bids for their own team only
- Cannot access host controls

### Viewer
- Can view auction in real-time
- Cannot place bids
- Cannot access any controls

## Draft Management

### Saving Drafts
Auctions with status='draft' are saved in database:
- Persists across sessions
- Admin can log out and continue later
- Multiple drafts can exist

### Draft Storage
```sql
INSERT INTO auctions (
  tournament_id, status, max_tokens_per_captain, min_bid_amount,
  use_base_price, min_increment, use_fixed_increments, custom_increments,
  timer_seconds, player_order_type, player_order, created_by
) VALUES (...)
```

### Loading Draft
```sql
SELECT * FROM auctions WHERE status = 'draft' AND created_by = current_user_id
```

## API Endpoints Structure

### Auction Creation
- `POST /api/auctions/create` - Create new auction
- `GET /api/auctions/drafts` - Get user's drafts
- `PUT /api/auctions/:id/draft` - Update draft
- `DELETE /api/auctions/:id/draft` - Delete draft

### Auction Management
- `POST /api/auctions/:id/start` - Start auction
- `POST /api/auctions/:id/pause` - Pause auction
- `POST /api/auctions/:id/resume` - Resume auction
- `POST /api/auctions/:id/complete` - Complete auction
- `POST /api/auctions/:id/cancel` - Cancel auction

### Bidding
- `POST /api/auctions/:id/bid` - Place bid
- `POST /api/auctions/:id/sell` - Sell to highest bidder
- `POST /api/auctions/:id/skip` - Skip current player
- `POST /api/auctions/:id/next` - Next player
- `POST /api/auctions/:id/previous` - Previous player

### Undo Operations
- `POST /api/auctions/:id/undo-bid` - Undo last bid
- `POST /api/auctions/:id/undo-assignment` - Undo last sale

### Data Retrieval
- `GET /api/auctions` - List all auctions
- `GET /api/auctions/:id` - Get auction details
- `GET /api/auctions/:id/teams` - Get auction teams
- `GET /api/auctions/:id/players` - Get auction players
- `GET /api/auctions/:id/bids` - Get auction bids
- `GET /api/auctions/:id/actions` - Get auction actions

## Example Auction Lifecycle

```
1. Admin creates tournament with 4 teams, 30 players
2. Admin closes registration
3. Admin starts auction creation:
   - Selects tournament
   - Sees 30 players (not multiple of 4)
   - System suggests generating 2 temp players
   - Admin confirms, now 32 players (8 per team)
   - Admin selects 4 captains from player list
   - Admin names teams: "Team A", "Team B", "Team C", "Team D"
4. Admin configures auction:
   - Max tokens: 2000 per team
   - Min bid: 100
   - Use base price: Yes
   - Min increment: 50
   - Fixed increments: Yes
   - Timer: 30 seconds
   - Player order: Base price descending
5. Admin reviews and saves as draft
6. Admin starts auction (status: draft → live)
7. First player appears (highest base price)
8. Captains bid in real-time
9. Timer counts down, resets on each bid
10. Host clicks "Sold" when bidding stops
11. Player assigned to highest bidder
12. Next player appears automatically
13. Process repeats for all 32 players
14. Host clicks "Complete Auction"
15. Final teams displayed
16. Tournament status updates to "auction_completed"
```

## Testing Checklist

### Auction Creation
- [ ] Tournament selection works
- [ ] Player count validation works
- [ ] Temp player generation works
- [ ] Captain selection works
- [ ] Team naming works
- [ ] Configuration saves correctly
- [ ] Draft persists in database
- [ ] Draft loads correctly

### Auction Bidding
- [ ] Auction starts correctly
- [ ] First player appears
- [ ] Timer starts and counts down
- [ ] Bids validate correctly
- [ ] Budget calculations are accurate
- [ ] Real-time updates work
- [ ] Sold functionality works
- [ ] Skip functionality works
- [ ] Next/Previous navigation works

### Undo Operations
- [ ] Undo bid works
- [ ] Undo assignment works
- [ ] State restores correctly

### Completion
- [ ] All players can be sold
- [ ] Auction completes successfully
- [ ] Final teams are correct
- [ ] Budgets are accurate

## Troubleshooting

### Common Issues

**Issue: Player count not multiple of teams**
- Solution: System should auto-generate temp players

**Issue: Captain cannot bid**
- Check: captain_user_id is set correctly in auction_teams
- Check: User is authenticated
- Check: Auction status is 'live'

**Issue: Bid rejected**
- Check: Bid meets increment requirements
- Check: Team has sufficient budget
- Check: Team can reserve for remaining slots

**Issue: Real-time not updating**
- Check: Supabase realtime is enabled
- Check: Subscriptions are active
- Check: Row Level Security policies allow reads

## Performance Considerations

### Indexes
All critical queries are indexed:
- auction_id on all related tables
- status on auctions and auction_players
- created_at on auction_bids and auction_actions

### Query Optimization
- Use JSONB for flexible data (player_order, custom_increments)
- Denormalize counts (players_count, total_spent) for performance
- Use triggers to maintain denormalized data

### Real-time Optimization
- Subscribe only to necessary tables
- Filter subscriptions by auction_id
- Unsubscribe when leaving auction page

## Security

### Row Level Security
All tables have RLS enabled with appropriate policies:
- Viewers can read all auction data
- Only captains can bid for their teams
- Only hosts/admins can manage auctions

### Authentication
- All API endpoints require authentication
- Role-based access control enforced
- Audit trail tracks all actions

## Future Enhancements

1. **Auto-bidding**: Allow captains to set max auto-bid
2. **Bid notifications**: Push notifications for outbid
3. **Auction analytics**: Detailed statistics and insights
4. **Multi-currency**: Support different token types
5. **Auction templates**: Save and reuse configurations
6. **Live chat**: In-auction communication
7. **Video streaming**: Integrate live video feed
8. **Mobile app**: Native mobile experience
