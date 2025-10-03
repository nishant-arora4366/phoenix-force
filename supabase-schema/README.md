# Phoenix Force Database Schema

This directory contains the complete database schema for the Phoenix Force tournament and auction platform.

## Schema Overview

The schema supports:
- **User Management**: Role-based access (viewer/host)
- **Player Profiles**: Detailed player information with ratings
- **Tournament Management**: Tournament creation and slot management
- **Real-time Auctions**: Live bidding system
- **Team Building**: Auction-based team formation
- **File Storage**: Player profile images

## Quick Setup

### Option 1: Single Script (Recommended)
Run the complete schema in one go:

```sql
-- Copy and paste the contents of apply-schema.sql into your Supabase SQL Editor
```

### Option 2: Step-by-Step
Run the scripts in order:

1. `01-core-tables.sql` - Core tables (users, players, tags)
2. `02-tournament-tables.sql` - Tournament management
3. `03-auction-tables.sql` - Auction and team tables
4. `04-rls-policies.sql` - Row Level Security policies
5. `05-storage-buckets.sql` - File storage configuration
6. `06-sample-data.sql` - Sample data for testing

## Tables Created

### Core Tables
- `users` - User accounts with roles
- `players` - Player profiles with skills and ratings
- `tags` - Skill/metadata tags
- `player_tags` - Many-to-many relationship

### Tournament Tables
- `tournaments` - Tournament configuration
- `tournament_slots` - Slot assignments (realtime)
- `waitlist` - Player queue when slots are full

### Auction Tables
- `teams` - Auction-created teams (realtime)
- `auction_config` - Auction configuration
- `auction_bids` - Real-time bids (realtime)
- `team_players` - Final auction results

### Storage
- `player-profiles` bucket - Player profile images

## Features Enabled

✅ **Row Level Security (RLS)** - Secure data access  
✅ **Real-time Updates** - Live auction and slot updates  
✅ **File Storage** - Player profile image uploads  
✅ **Sample Data** - Test data for development  

## Next Steps

After applying the schema:

1. **Test the connection** using your existing `/api/test-admin` endpoint
2. **Create RLS policies** (see `04-rls-policies.sql`)
3. **Test authentication** with the AuthForm component
4. **Start building features** using the new schema

## API Endpoints to Test

- `GET /api/test-admin` - Test database connection
- `POST /api/players` - Create player profiles
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournaments

## Troubleshooting

If you encounter issues:
1. Check that all tables were created successfully
2. Verify RLS policies are applied
3. Test with the sample data
4. Check Supabase logs for any errors
