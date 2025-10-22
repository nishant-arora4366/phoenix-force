# Player Replacement System for Completed Auctions

## Overview
This system allows hosts and admins to replace players who drop out from tournaments after the auction is completed. The replacement system ensures team continuity while maintaining transparency and proper approval workflows.

## Features
- **Role-based Access**: Only hosts and admins can add replacements
- **Team Formation View**: Visual display of all teams with replacement capability
- **Replacement Modal**: Easy-to-use interface for selecting players to replace
- **Player Pool Selection**: Choose replacements from players not in the auction
- **Approval Workflow**: Admin approval required for host-initiated replacements
- **Replacement History**: Complete audit trail of all replacements
- **Real-time Updates**: Changes reflect immediately across all users

## Database Schema

### Tables Created:
1. **`player_replacements`** - Tracks all replacement records
   - Original player and replacement player IDs
   - Team and auction information
   - Approval status and metadata
   - Timestamps and user tracking

### SQL Functions:
1. **`add_player_replacement`** - Adds a new replacement request
2. **`approve_player_replacement`** - Approves a pending replacement
3. **`get_team_formation_with_replacements`** - Fetches teams with replacement info

## Components

### 1. TeamFormation Component (`/components/auction/TeamFormation.tsx`)
Main component that displays team formations with replacement capability.

**Features:**
- Expandable team cards
- Visual distinction for captains and players
- "Add Replacement" button for completed auctions
- Replacement badges for substituted players
- Pending replacement indicators

### 2. PlayerReplacementModal (`/components/auction/PlayerReplacementModal.tsx`)
Modal interface for adding replacements.

**Features:**
- 3-step process:
  1. Select player to replace
  2. Choose replacement from available pool
  3. Add reason (optional)
- Searchable player list
- Visual player cards with photos
- Real-time validation

### 3. ReplacementHistory (`/components/auction/ReplacementHistory.tsx`)
Administrative view for managing replacements.

**Features:**
- Filter by status (pending/approved/rejected)
- Admin approval/rejection actions
- Complete audit trail
- User attribution

## Integration Steps

### Step 1: Run Database Migration
Execute the SQL script to create necessary tables and functions:

```bash
psql -h your-db-host -d your-db-name -f database-setup/player-replacements.sql
```

### Step 2: Add to Auction Page

```tsx
// app/auctions/[id]/page.tsx
import { TeamFormation } from '@/components/auction/TeamFormation'
import { ReplacementHistory } from '@/components/auction/ReplacementHistory'
import { USER_ROLES } from '@/lib/constants'

export default function AuctionPage() {
  const { user } = useAuth() // Your auth hook
  const { auction } = useAuction() // Your auction data
  
  const isHost = user?.role === USER_ROLES.HOST
  const isAdmin = user?.role === USER_ROLES.ADMIN
  const canManageReplacements = (isHost || isAdmin) && auction?.status === 'completed'

  return (
    <div>
      {/* Your existing auction UI */}
      
      {/* Team Formation Section */}
      {auction?.status === 'completed' && (
        <div className="mt-8">
          <TeamFormation
            auctionId={auction.id}
            auctionStatus={auction.status}
            isHost={isHost}
            isAdmin={isAdmin}
          />
          
          {/* Replacement History for Admins */}
          {canManageReplacements && (
            <div className="mt-8">
              <ReplacementHistory
                auctionId={auction.id}
                isAdmin={isAdmin}
                onStatusChange={() => {
                  // Refresh team formation if needed
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## User Workflows

### For Hosts:
1. Navigate to a completed auction
2. View team formations
3. Click "Add Replacement" for a team
4. Select the player who dropped out
5. Search and select a replacement player
6. Add reason (optional)
7. Submit replacement request
8. Admin approval required (unless host is also admin)

### For Admins:
1. Same as hosts, but replacements are auto-approved
2. Can view all replacement history
3. Can approve/reject pending replacements from hosts
4. Full audit trail visibility

### For Viewers/Captains:
1. Can view team formations
2. See replacement badges on substituted players
3. Cannot add or modify replacements

## API Endpoints

### GET `/api/auctions/[id]/replacements`
Fetches all replacements for an auction.

**Query Parameters:**
- `teamId` (optional) - Filter by specific team

**Response:**
```json
{
  "success": true,
  "replacements": [
    {
      "id": "uuid",
      "original_player": { ... },
      "replacement_player": { ... },
      "team": { ... },
      "status": "pending|approved|rejected",
      "reason": "string",
      "replaced_by_user": { ... },
      "replaced_at": "timestamp"
    }
  ]
}
```

### POST `/api/auctions/[id]/replacements`
Adds a new replacement request.

**Body:**
```json
{
  "teamId": "uuid",
  "originalPlayerId": "uuid",
  "replacementPlayerId": "uuid",
  "reason": "string (optional)"
}
```

### PATCH `/api/auctions/[id]/replacements`
Approve or reject a replacement (Admin only).

**Body:**
```json
{
  "replacementId": "uuid",
  "action": "approve|reject"
}
```

## Business Rules

### Validation Rules:
1. **Auction must be completed** - Replacements only allowed after auction ends
2. **Original player must be in team** - Can only replace existing team members
3. **Replacement must be available** - Cannot use players already in the auction
4. **No duplicate replacements** - Each player can only be replaced once
5. **Role-based permissions** - Only hosts/admins can add replacements

### Approval Workflow:
- **Admin replacements**: Auto-approved
- **Host replacements**: Require admin approval
- **Rejected replacements**: Can be resubmitted with different player

## UI/UX Features

### Visual Indicators:
- **Yellow badge**: Pending replacements
- **Green highlight**: Approved replacements
- **Red strikethrough**: Replaced players
- **Replacement tag**: Shows "Replacement for [Original Player]"

### Responsive Design:
- Mobile-friendly modal and team cards
- Touch-optimized controls
- Collapsible team sections for space efficiency

## Error Handling

### Common Errors:
1. **"Auction not completed"** - Wait for auction to finish
2. **"Player not in team"** - Selected wrong player
3. **"Replacement already in auction"** - Choose different player
4. **"Insufficient permissions"** - Contact admin for access

### Recovery:
- All errors show user-friendly messages
- Failed operations can be retried
- No data loss on errors

## Performance Considerations

### Optimizations:
- Lazy loading of player lists
- Debounced search in replacement modal
- Cached team formations
- Single API call for bulk data

### Scalability:
- Indexed database queries
- Pagination for large player lists
- Efficient real-time updates

## Security

### Access Control:
- JWT authentication required
- Role-based permissions enforced
- Audit trail for all changes
- No direct database access

### Data Validation:
- Input sanitization
- UUID validation
- Business rule enforcement
- Transaction safety

## Testing

### Test Scenarios:
1. Add replacement as host
2. Add replacement as admin
3. Approve pending replacement
4. Reject pending replacement
5. Try to replace already-replaced player
6. Search for players in modal
7. View replacement history

### Edge Cases:
- Multiple replacements for same team
- Replacement chain (replacing a replacement)
- Concurrent replacement requests
- Network failures during submission

## Future Enhancements

### Planned Features:
1. **Bulk replacements** - Replace multiple players at once
2. **Replacement notifications** - Email/SMS alerts
3. **Captain approval** - Optional captain consent
4. **Replacement limits** - Max replacements per team
5. **Transfer window** - Time-limited replacement period
6. **Replacement fees** - Optional financial implications

### Possible Integrations:
- Tournament management system
- Player availability tracker
- Team communication tools
- Analytics dashboard

## Support

### Troubleshooting:
1. Check user role and permissions
2. Verify auction is completed
3. Ensure players are correctly assigned
4. Check browser console for errors
5. Verify API endpoints are accessible

### Contact:
- Report issues in GitHub repository
- Check documentation for updates
- Contact admin for permission issues
