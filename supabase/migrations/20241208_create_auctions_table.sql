-- Create auctions table
CREATE TABLE IF NOT EXISTS public.auctions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    starting_bid DECIMAL(10,2) NOT NULL,
    bid_increment DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS auctions_tournament_id_idx ON public.auctions (tournament_id);
CREATE INDEX IF NOT EXISTS auctions_start_time_idx ON public.auctions (start_time);
CREATE INDEX IF NOT EXISTS auctions_status_idx ON public.auctions (status);
CREATE INDEX IF NOT EXISTS auctions_created_by_idx ON public.auctions (created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auctions_updated_at 
    BEFORE UPDATE ON public.auctions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all auctions
CREATE POLICY "Users can view all auctions" ON public.auctions
    FOR SELECT USING (true);

-- Policy: Hosts and admins can create auctions
CREATE POLICY "Hosts and admins can create auctions" ON public.auctions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('host', 'admin')
        )
    );

-- Policy: Only auction creators and admins can update auctions
CREATE POLICY "Auction creators and admins can update auctions" ON public.auctions
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Only auction creators and admins can delete auctions
CREATE POLICY "Auction creators and admins can delete auctions" ON public.auctions
    FOR DELETE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
