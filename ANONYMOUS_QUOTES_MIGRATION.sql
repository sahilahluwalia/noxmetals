-- Migration to allow anonymous quotes
-- Run this in your Supabase SQL editor to allow quotes without user login

-- Step 1: Modify the user_id column to allow NULL values
ALTER TABLE public.quotes ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Update RLS policies to allow anonymous quote submission
-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;

-- Create new policies that allow anonymous submissions
-- Anonymous users can insert quotes (no user_id required)
CREATE POLICY "Anyone can insert quotes" ON public.quotes
    FOR INSERT WITH CHECK (true);

-- Users can still view their own quotes when logged in
-- Anonymous quotes won't be visible to anyone except admins
CREATE POLICY "Users can view own quotes or anonymous quotes" ON public.quotes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

-- Only allow users to update/delete their own quotes (not anonymous ones)
-- Keep existing update policy as is
CREATE POLICY "Users can update own quotes only" ON public.quotes
    FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL AND status = 'pending');

-- Keep existing delete policy as is  
CREATE POLICY "Users can delete own quotes only" ON public.quotes
    FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL AND status = 'pending');

-- Step 3: Create a function to link anonymous quotes to users when they log in
CREATE OR REPLACE FUNCTION link_anonymous_quotes_to_user(user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    user_uuid UUID;
    linked_count INTEGER;
BEGIN
    -- Get the user's UUID from their email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email 
    AND email_confirmed_at IS NOT NULL;
    
    -- If user found, link their anonymous quotes
    IF user_uuid IS NOT NULL THEN
        UPDATE public.quotes 
        SET user_id = user_uuid 
        WHERE email = user_email 
        AND user_id IS NULL;
        
        GET DIAGNOSTICS linked_count = ROW_COUNT;
        RETURN linked_count;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION link_anonymous_quotes_to_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION link_anonymous_quotes_to_user(TEXT) TO anon;

-- Step 4: Update the admin view to handle NULL user_id
DROP VIEW IF EXISTS admin_quotes_view;
CREATE VIEW admin_quotes_view AS
SELECT 
    q.*,
    CASE 
        WHEN q.user_id IS NOT NULL THEN u.email 
        ELSE q.email 
    END as user_email,
    CASE 
        WHEN q.user_id IS NOT NULL THEN u.raw_user_meta_data 
        ELSE NULL 
    END as user_metadata,
    CASE 
        WHEN q.user_id IS NULL THEN true 
        ELSE false 
    END as is_anonymous
FROM public.quotes q
LEFT JOIN auth.users u ON q.user_id = u.id
ORDER BY q.created_at DESC;

-- Grant access to admin users (if admin role exists)
-- GRANT SELECT ON admin_quotes_view TO admin_role;
