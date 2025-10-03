-- Storage Buckets Configuration
-- This script creates storage buckets for file uploads

-- Create player-profiles bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'player-profiles',
    'player-profiles',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for player-profiles bucket
CREATE POLICY "Anyone can view player profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'player-profiles');

CREATE POLICY "Authenticated users can upload player profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'player-profiles' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own player profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'player-profiles' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own player profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'player-profiles' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
