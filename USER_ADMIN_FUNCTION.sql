-- Function to get all users for admin dashboard
-- This function allows admins to view all user information
-- Run this SQL in your Supabase SQL editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_all_users_admin();

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE(
    id UUID,
    email CHARACTER VARYING,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    phone CHARACTER VARYING,
    user_metadata JSONB,
    role CHARACTER VARYING,
    role_created_at TIMESTAMPTZ,
    role_updated_at TIMESTAMPTZ,
    app_metadata JSONB
) AS $$
BEGIN
    -- Check if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.email::CHARACTER VARYING,
        u.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        u.phone::CHARACTER VARYING,
        u.raw_user_meta_data as user_metadata,
        COALESCE(ur.role, 'user')::CHARACTER VARYING as role,
        ur.created_at as role_created_at,
        ur.updated_at as role_updated_at,
        u.raw_app_meta_data as app_metadata
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
