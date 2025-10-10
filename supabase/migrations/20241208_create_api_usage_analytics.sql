-- Create API usage analytics table
CREATE TABLE IF NOT EXISTS public.api_usage_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route TEXT NOT NULL,
    method TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    response_status INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS api_usage_analytics_route_method_idx ON public.api_usage_analytics (route, method);
CREATE INDEX IF NOT EXISTS api_usage_analytics_user_id_idx ON public.api_usage_analytics (user_id);
CREATE INDEX IF NOT EXISTS api_usage_analytics_created_at_idx ON public.api_usage_analytics (created_at);
CREATE INDEX IF NOT EXISTS api_usage_analytics_user_role_idx ON public.api_usage_analytics (user_role);
CREATE INDEX IF NOT EXISTS api_usage_analytics_response_status_idx ON public.api_usage_analytics (response_status);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS api_usage_analytics_route_method_created_at_idx ON public.api_usage_analytics (route, method, created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.api_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can view all analytics data
CREATE POLICY "Admins can view all API analytics" ON public.api_usage_analytics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can view their own analytics data
CREATE POLICY "Users can view their own API analytics" ON public.api_usage_analytics
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Only service role can insert analytics data
CREATE POLICY "Service role can insert API analytics" ON public.api_usage_analytics
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create a function to clean up old analytics data (optional)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_analytics()
RETURNS void AS $$
BEGIN
    -- Delete analytics data older than 90 days
    DELETE FROM public.api_usage_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a function to get API usage statistics
CREATE OR REPLACE FUNCTION public.get_api_usage_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    route TEXT,
    method TEXT,
    total_requests BIGINT,
    unique_users BIGINT,
    avg_response_time_ms NUMERIC,
    success_rate NUMERIC,
    total_errors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aua.route,
        aua.method,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.user_id) as unique_users,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms,
        ROUND(
            (COUNT(*) FILTER (WHERE aua.response_status >= 200 AND aua.response_status < 300))::NUMERIC / 
            COUNT(*)::NUMERIC * 100, 2
        ) as success_rate,
        COUNT(*) FILTER (WHERE aua.response_status >= 400) as total_errors
    FROM public.api_usage_analytics aua
    WHERE aua.created_at BETWEEN start_date AND end_date
    GROUP BY aua.route, aua.method
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user activity statistics
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    total_requests BIGINT,
    unique_routes BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE,
    avg_response_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aua.user_id,
        u.email as user_email,
        aua.user_role,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.route) as unique_routes,
        MAX(aua.created_at) as last_activity,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms
    FROM public.api_usage_analytics aua
    LEFT JOIN public.users u ON aua.user_id = u.id
    WHERE aua.created_at BETWEEN start_date AND end_date
    AND aua.user_id IS NOT NULL
    GROUP BY aua.user_id, u.email, aua.user_role
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get hourly usage patterns
CREATE OR REPLACE FUNCTION public.get_hourly_usage_patterns(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    hour_of_day INTEGER,
    total_requests BIGINT,
    unique_users BIGINT,
    avg_response_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM aua.created_at)::INTEGER as hour_of_day,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.user_id) as unique_users,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms
    FROM public.api_usage_analytics aua
    WHERE aua.created_at BETWEEN start_date AND end_date
    GROUP BY EXTRACT(HOUR FROM aua.created_at)
    ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;
