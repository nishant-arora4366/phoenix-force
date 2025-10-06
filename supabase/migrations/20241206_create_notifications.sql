-- Create notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for real-time updates';
COMMENT ON COLUMN notifications.type IS 'Type of notification (waitlist_promotion, slot_approved, etc.)';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was read (NULL if unread)';
