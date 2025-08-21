-- Fix Infinite Recursion in user_roles RLS Policies
-- Run this immediately to fix the current issue

-- First, drop ALL existing policies on user_roles to stop the recursion
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on user_roles table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_record.policyname);
    END LOOP;
END $$;

-- Create simple, non-recursive policies
-- Users can view their own role (no circular dependency)
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own role (needed for auto-creation)
CREATE POLICY "Users can insert own role" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recreate the admin check functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    -- This function runs with definer rights, bypassing RLS completely
    SELECT role INTO user_role_value 
    FROM public.user_roles 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role_value IN ('admin', 'super_admin'), FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    -- This function runs with definer rights, bypassing RLS completely
    SELECT role INTO user_role_value 
    FROM public.user_roles 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role_value = 'super_admin', FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for admin management that uses the security definer functions
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL USING (
        -- Allow if user is viewing/managing their own role OR they're a super admin
        auth.uid() = user_id OR is_super_admin(auth.uid())
    );

-- Ensure the auto-create user role function exists
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

-- Verify your admin user exists (replace email as needed)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'superadmin@gmail.com' 
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Display current user roles for verification
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
