-- Nox Metals Quotes Table Setup
-- Run this SQL in your Supabase SQL editor to create the quotes table

-- Create the quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    material TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    material_spec TEXT,
    dfars_required BOOLEAN DEFAULT false,
    additional_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own quotes
CREATE POLICY "Users can view own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own quotes
CREATE POLICY "Users can insert own quotes" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own quotes (only if status is pending)
CREATE POLICY "Users can update own pending quotes" ON public.quotes
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own quotes (only if status is pending)
CREATE POLICY "Users can delete own pending quotes" ON public.quotes
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON public.quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.quotes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Optional: Create a view for admin users to see all quotes
-- Uncomment if you want admin functionality
/*
CREATE VIEW admin_quotes_view AS
SELECT 
    q.*,
    u.email as user_email,
    u.user_metadata
FROM public.quotes q
JOIN auth.users u ON q.user_id = u.id
ORDER BY q.created_at DESC;

-- Grant access to admin users (you'll need to set up admin role separately)
-- GRANT SELECT ON admin_quotes_view TO admin_role;
*/

-- Optional: Create a function to get quote statistics for a user
CREATE OR REPLACE FUNCTION get_user_quote_stats(user_uuid UUID)
RETURNS TABLE(
    total_quotes BIGINT,
    pending_quotes BIGINT,
    approved_quotes BIGINT,
    rejected_quotes BIGINT,
    in_progress_quotes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_quotes,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_quotes,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_quotes,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_quotes,
        COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_quotes
    FROM public.quotes
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_quote_stats(UUID) TO authenticated;
