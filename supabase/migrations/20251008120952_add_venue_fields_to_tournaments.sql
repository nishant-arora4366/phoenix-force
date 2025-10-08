-- Add venue and google_maps_link fields to tournaments table
ALTER TABLE tournaments 
ADD COLUMN venue TEXT,
ADD COLUMN google_maps_link TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tournaments.venue IS 'Physical location or venue name for the tournament';
COMMENT ON COLUMN tournaments.google_maps_link IS 'Google Maps URL or link to the tournament venue location';
