-- Nox Metals Admin Setup (FIXED VERSION)
-- Run this SQL in your Supabase SQL editor to create admin functionality
-- This version fixes the infinite recursion issue

-- Create user_roles table to manage admin users
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- FIXED: Simple RLS policies that don't create circular dependencies
-- Users can only view their own role (no recursive checks)
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own role (needed for auto-creation)
CREATE POLICY "Users can insert own role" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a security definer function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    -- This function runs with definer rights, bypassing RLS
    SELECT role INTO user_role_value 
    FROM public.user_roles 
    WHERE user_id = user_uuid;
    
    RETURN user_role_value IN ('admin', 'super_admin');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check super admin status
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    -- This function runs with definer rights, bypassing RLS
    SELECT role INTO user_role_value 
    FROM public.user_roles 
    WHERE user_id = user_uuid;
    
    RETURN user_role_value = 'super_admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a separate policy for admin management that uses the security definer function
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (
        -- Allow if user is viewing their own role OR if they're an admin
        auth.uid() = user_id OR is_super_admin(auth.uid())
    );

-- Create a function to automatically create user role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign 'user' role to new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;

-- Insert default super admin (replace with your email)
-- IMPORTANT: Replace 'superadmin@gmail.com' with your actual email
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'superadmin@gmail.com' 
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Create a function to promote user to admin (only super admins can use)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Check if current user is super admin using our security definer function
    IF NOT is_super_admin() THEN
        RETURN FALSE;
    END IF;
    
    -- Get target user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update user role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', updated_at = timezone('utc'::text, now());
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION promote_to_admin(TEXT) TO authenticated;

-- Create a function to automatically update the updated_at column for user_roles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column for user_roles
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON public.user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update quotes table RLS policies to allow admin access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own pending quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own pending quotes" ON public.quotes;

-- Create new policies that allow admin access
CREATE POLICY "Users and admins can view quotes" ON public.quotes
    FOR SELECT USING (
        auth.uid() = user_id OR is_admin()
    );

CREATE POLICY "Users can insert own quotes" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can update quotes" ON public.quotes
    FOR UPDATE USING (
        (auth.uid() = user_id AND status = 'pending') OR is_admin()
    );

CREATE POLICY "Users and admins can delete quotes" ON public.quotes
    FOR DELETE USING (
        (auth.uid() = user_id AND status = 'pending') OR is_admin()
    );

-- Create admin quotes view for better performance
CREATE OR REPLACE VIEW admin_quotes_view AS
SELECT 
    q.*,
    u.email as user_email,
    u.raw_user_meta_data,
    ur.role as user_role
FROM public.quotes q
JOIN auth.users u ON q.user_id = u.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY q.created_at DESC;

-- Grant access to admin users
GRANT SELECT ON admin_quotes_view TO authenticated;

-- Create function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
    total_quotes BIGINT,
    pending_quotes BIGINT,
    approved_quotes BIGINT,
    rejected_quotes BIGINT,
    in_progress_quotes BIGINT,
    total_users BIGINT,
    admin_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_quotes,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_quotes,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_quotes,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_quotes,
        COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_quotes,
        (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.user_roles WHERE role IN ('admin', 'super_admin'))::BIGINT as admin_users
    FROM public.quotes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
