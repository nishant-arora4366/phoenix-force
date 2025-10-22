# Player Sold Notification System Implementation Guide

## Overview
This guide explains how to implement the player sold notification system that alerts all users when a player is sold in an auction.

## Features
- **Real-time notifications** for all connected users
- **Rich notification UI** with player image, name, team, and sold amount
- **Automatic detection** of player sold events
- **Duplicate prevention** to avoid multiple notifications for the same sale
- **Smooth animations** and eye-catching design

## Components Created

### 1. Toast Notification System (`/components/common/ToastNotification.tsx`)
- Generic toast notification component
- Special design for player sold notifications
- Auto-dismiss after 5 seconds
- Smooth entrance/exit animations

### 2. Player Sold Hook (`/hooks/usePlayerSoldNotification.ts`)
- Listens for player status changes in real-time
- Fetches player and team details automatically
- Prevents duplicate notifications
- Handles both auction_players updates and final bids

### 3. Notification Provider (`/components/providers/NotificationProvider.tsx`)
- Wraps the app to provide notification functionality
- Manages the toast container

## Integration Steps

### Step 1: Add the Notification Provider to your root layout

```tsx
// app/layout.tsx
import NotificationProvider from '@/components/providers/NotificationProvider'
import '@/styles/animations.css' // Import the animation styles

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
```

### Step 2: Use the hook in your auction page

```tsx
// app/auctions/[id]/page.tsx
import { usePlayerSoldNotification } from '@/hooks/usePlayerSoldNotification'
import { useAuctionRealtime } from '@/lib/realtime-utils'

export default function AuctionPage() {
  const params = useParams()
  const auctionId = params.id as string
  
  // Enable player sold notifications
  usePlayerSoldNotification(auctionId)
  
  // Your existing auction realtime subscriptions
  // The notification will be triggered automatically
  useAuctionRealtime(auctionId, {
    onBidUpdate: (bid) => { /* ... */ },
    onAuctionUpdate: (auction) => { /* ... */ },
    onPlayerUpdate: (player) => { /* ... */ },
    onTeamUpdate: (team) => { /* ... */ }
  })
  
  // Rest of your component...
}
```

### Step 3: Manual trigger (optional)

You can also manually trigger a player sold notification:

```tsx
import { triggerPlayerSoldNotification } from '@/hooks/usePlayerSoldNotification'

// Somewhere in your code when a player is sold
const handlePlayerSold = () => {
  triggerPlayerSoldNotification(
    "John Doe",        // Player name
    5000000,          // Amount in rupees
    "Thunder Hawks",   // Team name
    "/player.jpg"     // Optional player image URL
  )
}
```

## How It Works

### Automatic Detection Flow:
1. **Database Update**: When a player is sold, the `auction_players` table is updated with:
   - `status: 'sold'`
   - `sold_to: <team_id>`
   - `sold_price: <amount>`

2. **Real-time Event**: Supabase broadcasts the change to all connected clients

3. **Notification Trigger**: The hook detects the status change from any status to 'sold'

4. **Data Fetching**: The system automatically fetches:
   - Player details (name, image)
   - Team details (team name)

5. **Display**: A rich notification appears for all users showing:
   - Player name and image
   - Team that bought the player
   - Final sold amount
   - Celebration animation

## Customization

### Modify Notification Duration
```tsx
// In ToastNotification.tsx
const duration = toast.duration || (toast.type === 'player-sold' ? 5000 : 3000)
// Change 5000 to your desired duration in milliseconds
```

### Customize Appearance
The notification uses these colors from your theme:
- Background: `from-[#2A1810] via-[#3E2418] to-[#2A1810]`
- Border: `border-[#CEA17A]/60`
- Text: `text-[#DBD0C0]`
- Accent: `text-[#CEA17A]`

### Add Sound Effects
```tsx
// In handlePlayerSoldNotification function
if (playerData && teamData) {
  // Play sound effect
  const audio = new Audio('/sounds/player-sold.mp3')
  audio.play().catch(() => {})
  
  showPlayerSoldNotification(/* ... */)
}
```

## Database Requirements

Ensure your `auction_players` table has these columns:
- `player_id` (UUID)
- `auction_id` (UUID)
- `status` (TEXT) - Should include 'sold' as a possible value
- `sold_to` (UUID) - References auction_teams.id
- `sold_price` (INTEGER)

## Testing

To test the notification system:

1. **Manual Test**:
```tsx
// In browser console or component
import { showPlayerSoldNotification } from '@/components/common/ToastNotification'

showPlayerSoldNotification(
  "Test Player",
  1000000,
  "Test Team",
  "https://example.com/player.jpg"
)
```

2. **Database Test**:
Update a player's status directly in Supabase:
```sql
UPDATE auction_players 
SET 
  status = 'sold',
  sold_to = '<team_id>',
  sold_price = 5000000
WHERE 
  player_id = '<player_id>' 
  AND auction_id = '<auction_id>';
```

## Performance Considerations

- **Debouncing**: Notifications are automatically debounced via the realtime manager
- **Duplicate Prevention**: The system tracks notified players to prevent duplicates
- **Lazy Loading**: Player and team data are fetched only when needed
- **Memory Management**: Notification history is cleared when component unmounts

## Troubleshooting

### Notifications not appearing?
1. Check if `NotificationProvider` is added to layout
2. Verify database updates are happening correctly
3. Check browser console for errors
4. Ensure WebSocket connection is active

### Duplicate notifications?
- The system has built-in duplicate prevention using a Set to track notified players
- Check if multiple components are using the hook

### Missing player/team data?
- Verify the player exists in the `players` table
- Verify the team exists in the `auction_teams` table
- Check for database query errors in console

## Browser Compatibility
- Works in all modern browsers
- Uses standard Web APIs (CustomEvent, createPortal)
- Animations use CSS transforms for better performance

## Accessibility
- Notifications are announced to screen readers
- Can be dismissed with keyboard (Escape key)
- High contrast colors for visibility

## Future Enhancements
- Add sound effects for different notification types
- Add user preferences for notification settings
- Add notification history/log
- Add support for other auction events (bid placed, auction started, etc.)
