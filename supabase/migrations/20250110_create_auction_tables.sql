-- Create auction tables for bidding system

-- Auction teams table
CREATE TABLE IF NOT EXISTS auction_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    captain_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    total_spent INTEGER DEFAULT 0,
    remaining_purse INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auction_id, captain_id)
);

-- Auction players table
CREATE TABLE IF NOT EXISTS auction_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'skipped')),
    sold_to UUID REFERENCES players(id) ON DELETE SET NULL,
    sold_price INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auction_id, player_id)
);

-- Auction bids table
CREATE TABLE IF NOT EXISTS auction_bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    captain_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_winning_bid BOOLEAN DEFAULT FALSE
);

-- Add columns to existing auctions table
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS current_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_bid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS total_purse INTEGER DEFAULT 1000000;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auction_teams_auction_id ON auction_teams(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_teams_captain_id ON auction_teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_auction_id ON auction_players(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(status);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_player_id ON auction_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_timestamp ON auction_bids(timestamp DESC);

-- Enable RLS
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auction_teams
CREATE POLICY "Anyone can view auction teams" ON auction_teams
    FOR SELECT USING (true);

CREATE POLICY "Hosts and admins can manage auction teams" ON auction_teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN auctions a ON a.created_by = up.user_id
            WHERE a.id = auction_id
            AND up.role IN ('host', 'admin')
        )
    );

-- RLS Policies for auction_players
CREATE POLICY "Anyone can view auction players" ON auction_players
    FOR SELECT USING (true);

CREATE POLICY "Hosts and admins can manage auction players" ON auction_players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN auctions a ON a.created_by = up.user_id
            WHERE a.id = auction_id
            AND up.role IN ('host', 'admin')
        )
    );

-- RLS Policies for auction_bids
CREATE POLICY "Anyone can view auction bids" ON auction_bids
    FOR SELECT USING (true);

CREATE POLICY "Captains can place bids" ON auction_bids
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auction_teams at
            WHERE at.auction_id = auction_bids.auction_id
            AND at.captain_id = auction_bids.captain_id
        )
    );

CREATE POLICY "Hosts and admins can manage all bids" ON auction_bids
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN auctions a ON a.created_by = up.user_id
            WHERE a.id = auction_id
            AND up.role IN ('host', 'admin')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_auction_teams_updated_at 
    BEFORE UPDATE ON auction_teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_players_updated_at 
    BEFORE UPDATE ON auction_players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate bid amount
CREATE OR REPLACE FUNCTION validate_bid_amount()
RETURNS TRIGGER AS $$
DECLARE
    captain_purse INTEGER;
    current_highest_bid INTEGER;
BEGIN
    -- Get captain's remaining purse
    SELECT remaining_purse INTO captain_purse
    FROM auction_teams
    WHERE auction_id = NEW.auction_id AND captain_id = NEW.captain_id;
    
    -- Get current highest bid for this player
    SELECT COALESCE(MAX(amount), 0) INTO current_highest_bid
    FROM auction_bids
    WHERE auction_id = NEW.auction_id AND player_id = NEW.player_id;
    
    -- Validate bid amount
    IF NEW.amount <= current_highest_bid THEN
        RAISE EXCEPTION 'Bid amount must be higher than current highest bid';
    END IF;
    
    IF NEW.amount > captain_purse THEN
        RAISE EXCEPTION 'Bid amount exceeds captain remaining purse';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to validate bids
CREATE TRIGGER validate_bid_amount_trigger
    BEFORE INSERT ON auction_bids
    FOR EACH ROW EXECUTE FUNCTION validate_bid_amount();

-- Create function to update current bid in auctions table
CREATE OR REPLACE FUNCTION update_current_bid()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current bid in auctions table
    UPDATE auctions 
    SET current_bid = NEW.amount
    WHERE id = NEW.auction_id AND current_player_id = NEW.player_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update current bid
CREATE TRIGGER update_current_bid_trigger
    AFTER INSERT ON auction_bids
    FOR EACH ROW EXECUTE FUNCTION update_current_bid();
