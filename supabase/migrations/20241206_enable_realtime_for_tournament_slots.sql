-- Enable RLS for tournament_slots if not already enabled
ALTER TABLE tournament_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view tournament slots" ON tournament_slots;
DROP POLICY IF EXISTS "Allow users to update their own slot registrations" ON tournament_slots;
DROP POLICY IF EXISTS "Allow users to insert their own slot registrations" ON tournament_slots;
DROP POLICY IF EXISTS "Allow admins and hosts to manage all slots" ON tournament_slots;

-- Create RLS policy to allow users to read tournament slots
-- This allows authenticated users to view slots for any tournament
CREATE POLICY "Allow authenticated users to view tournament slots" ON tournament_slots
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to update their own slot registrations
CREATE POLICY "Allow users to update their own slot registrations" ON tournament_slots
    FOR UPDATE
    TO authenticated
    USING (player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
    ));

-- Allow users to insert their own slot registrations
CREATE POLICY "Allow users to insert their own slot registrations" ON tournament_slots
    FOR INSERT
    TO authenticated
    WITH CHECK (player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
    ));

-- Allow admins and hosts to manage all slots
CREATE POLICY "Allow admins and hosts to manage all slots" ON tournament_slots
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'host')
        )
    );
