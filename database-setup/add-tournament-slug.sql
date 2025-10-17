-- Add slug column to tournaments table for URL shortening
-- This allows for shorter, more user-friendly tournament URLs

-- Add slug column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN slug varchar(100) UNIQUE;
    END IF;
END $$;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);

-- Create function to generate URL-friendly slug from tournament name
CREATE OR REPLACE FUNCTION generate_tournament_slug(tournament_name text)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    slug_exists boolean;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    base_slug := lower(regexp_replace(tournament_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Limit to 50 characters
    IF length(base_slug) > 50 THEN
        base_slug := left(base_slug, 50);
        base_slug := trim(base_slug, '-');
    END IF;
    
    -- If empty after cleaning, use a default
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'tournament';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists and add counter if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM tournaments WHERE slug = final_slug) INTO slug_exists;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to update slug when tournament name changes
CREATE OR REPLACE FUNCTION update_tournament_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update slug if name changed or slug is null
    IF OLD.name IS DISTINCT FROM NEW.name OR NEW.slug IS NULL THEN
        NEW.slug := generate_tournament_slug(NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug on insert/update
DROP TRIGGER IF EXISTS trigger_update_tournament_slug ON tournaments;
CREATE TRIGGER trigger_update_tournament_slug
    BEFORE INSERT OR UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_slug();

-- Update existing tournaments to have slugs
UPDATE tournaments 
SET slug = generate_tournament_slug(name) 
WHERE slug IS NULL;

-- Make slug column NOT NULL after populating existing records
ALTER TABLE tournaments ALTER COLUMN slug SET NOT NULL;

-- Verification queries
SELECT 'Tournament slug setup completed successfully' as status;
SELECT COUNT(*) as tournaments_with_slugs FROM tournaments WHERE slug IS NOT NULL;
SELECT name, slug FROM tournaments LIMIT 5;
