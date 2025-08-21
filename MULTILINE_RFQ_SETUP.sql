-- Multi-Line RFQ System Setup for Nox Metals
-- Run this SQL in your Supabase SQL editor to create the multi-line RFQ tables

-- 1. Create the main multi-line RFQ table
CREATE TABLE IF NOT EXISTS public.multiline_rfqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    additional_notes TEXT,
    dfars_required BOOLEAN DEFAULT false,
    rohs_compliant BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
    total_pieces INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the RFQ items table (individual items within an RFQ)
CREATE TABLE IF NOT EXISTS public.multiline_rfq_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID REFERENCES public.multiline_rfqs(id) ON DELETE CASCADE NOT NULL,
    material TEXT NOT NULL,
    material_spec TEXT,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multiline_rfqs_user_id ON public.multiline_rfqs(user_id);
CREATE INDEX IF NOT EXISTS idx_multiline_rfqs_status ON public.multiline_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_multiline_rfqs_created_at ON public.multiline_rfqs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_multiline_rfq_items_rfq_id ON public.multiline_rfq_items(rfq_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.multiline_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiline_rfq_items ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for multiline_rfqs
-- Drop existing policies first (for idempotency)
DROP POLICY IF EXISTS "Users and admins can view multiline RFQs" ON public.multiline_rfqs;
DROP POLICY IF EXISTS "Users can insert own multiline RFQs" ON public.multiline_rfqs;
DROP POLICY IF EXISTS "Users and admins can update multiline RFQs" ON public.multiline_rfqs;
DROP POLICY IF EXISTS "Users and admins can delete multiline RFQs" ON public.multiline_rfqs;

-- Users can view their own RFQs, admins can view all
CREATE POLICY "Users and admins can view multiline RFQs" ON public.multiline_rfqs
    FOR SELECT USING (
        auth.uid() = user_id OR is_admin()
    );

-- Users can insert their own RFQs
CREATE POLICY "Users can insert own multiline RFQs" ON public.multiline_rfqs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users and admins can update RFQs
CREATE POLICY "Users and admins can update multiline RFQs" ON public.multiline_rfqs
    FOR UPDATE USING (
        (auth.uid() = user_id AND status = 'pending') OR is_admin()
    );

-- Users and admins can delete RFQs
CREATE POLICY "Users and admins can delete multiline RFQs" ON public.multiline_rfqs
    FOR DELETE USING (
        (auth.uid() = user_id AND status = 'pending') OR is_admin()
    );

-- 6. Create RLS policies for multiline_rfq_items
-- Drop existing policies first (for idempotency)
DROP POLICY IF EXISTS "Users and admins can view multiline RFQ items" ON public.multiline_rfq_items;
DROP POLICY IF EXISTS "Users can insert own multiline RFQ items" ON public.multiline_rfq_items;
DROP POLICY IF EXISTS "Users and admins can update multiline RFQ items" ON public.multiline_rfq_items;
DROP POLICY IF EXISTS "Users and admins can delete multiline RFQ items" ON public.multiline_rfq_items;

-- Users can view items of their own RFQs, admins can view all
CREATE POLICY "Users and admins can view multiline RFQ items" ON public.multiline_rfq_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.multiline_rfqs 
            WHERE id = rfq_id AND (user_id = auth.uid() OR is_admin())
        )
    );

-- Users can insert items to their own RFQs
CREATE POLICY "Users can insert own multiline RFQ items" ON public.multiline_rfq_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiline_rfqs 
            WHERE id = rfq_id AND user_id = auth.uid()
        )
    );

-- Users and admins can update items
CREATE POLICY "Users and admins can update multiline RFQ items" ON public.multiline_rfq_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.multiline_rfqs 
            WHERE id = rfq_id AND ((user_id = auth.uid() AND status = 'pending') OR is_admin())
        )
    );

-- Users and admins can delete items
CREATE POLICY "Users and admins can delete multiline RFQ items" ON public.multiline_rfq_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.multiline_rfqs 
            WHERE id = rfq_id AND ((user_id = auth.uid() AND status = 'pending') OR is_admin())
        )
    );

-- 7. Create trigger function to update totals
CREATE OR REPLACE FUNCTION update_multiline_rfq_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total_items and total_pieces for the RFQ
    UPDATE public.multiline_rfqs 
    SET 
        total_items = (
            SELECT COUNT(*) 
            FROM public.multiline_rfq_items 
            WHERE rfq_id = COALESCE(NEW.rfq_id, OLD.rfq_id)
        ),
        total_pieces = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM public.multiline_rfq_items 
            WHERE rfq_id = COALESCE(NEW.rfq_id, OLD.rfq_id)
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = COALESCE(NEW.rfq_id, OLD.rfq_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers to automatically update totals
-- Drop existing triggers first (for idempotency)
DROP TRIGGER IF EXISTS update_multiline_rfq_totals_insert ON public.multiline_rfq_items;
DROP TRIGGER IF EXISTS update_multiline_rfq_totals_update ON public.multiline_rfq_items;
DROP TRIGGER IF EXISTS update_multiline_rfq_totals_delete ON public.multiline_rfq_items;

CREATE TRIGGER update_multiline_rfq_totals_insert
    AFTER INSERT ON public.multiline_rfq_items
    FOR EACH ROW
    EXECUTE FUNCTION update_multiline_rfq_totals();

CREATE TRIGGER update_multiline_rfq_totals_update
    AFTER UPDATE ON public.multiline_rfq_items
    FOR EACH ROW
    EXECUTE FUNCTION update_multiline_rfq_totals();

CREATE TRIGGER update_multiline_rfq_totals_delete
    AFTER DELETE ON public.multiline_rfq_items
    FOR EACH ROW
    EXECUTE FUNCTION update_multiline_rfq_totals();

-- 9. Create trigger to update updated_at on multiline_rfqs
DROP TRIGGER IF EXISTS update_multiline_rfqs_updated_at ON public.multiline_rfqs;
CREATE TRIGGER update_multiline_rfqs_updated_at 
    BEFORE UPDATE ON public.multiline_rfqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
GRANT ALL ON public.multiline_rfqs TO authenticated;
GRANT ALL ON public.multiline_rfq_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Create admin view for multiline RFQs
DROP VIEW IF EXISTS admin_multiline_rfqs_view;
CREATE OR REPLACE VIEW admin_multiline_rfqs_view AS
SELECT 
    r.*,
    u.email as user_email,
    u.raw_user_meta_data,
    ur.role as user_role,
    COUNT(ri.id) as items_count,
    COALESCE(SUM(ri.quantity), 0) as total_quantity
FROM public.multiline_rfqs r
JOIN auth.users u ON r.user_id = u.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.multiline_rfq_items ri ON r.id = ri.rfq_id
GROUP BY r.id, u.email, u.raw_user_meta_data, ur.role
ORDER BY r.created_at DESC;

-- Grant access to admin users
GRANT SELECT ON admin_multiline_rfqs_view TO authenticated;

-- 12. Create function to get multiline RFQ with items
CREATE OR REPLACE FUNCTION get_multiline_rfq_with_items(rfq_uuid UUID)
RETURNS TABLE(
    -- RFQ fields
    id UUID,
    user_id UUID,
    full_name TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    additional_notes TEXT,
    dfars_required BOOLEAN,
    rohs_compliant BOOLEAN,
    status TEXT,
    total_pieces INTEGER,
    total_items INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Items JSON
    items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        r.full_name,
        r.company,
        r.email,
        r.phone,
        r.additional_notes,
        r.dfars_required,
        r.rohs_compliant,
        r.status,
        r.total_pieces,
        r.total_items,
        r.created_at,
        r.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ri.id,
                    'material', ri.material,
                    'material_spec', ri.material_spec,
                    'length', ri.length,
                    'width', ri.width,
                    'height', ri.height,
                    'quantity', ri.quantity,
                    'description', ri.description,
                    'created_at', ri.created_at
                )
                ORDER BY ri.created_at
            ) FILTER (WHERE ri.id IS NOT NULL),
            '[]'::jsonb
        ) as items
    FROM public.multiline_rfqs r
    LEFT JOIN public.multiline_rfq_items ri ON r.id = ri.rfq_id
    WHERE r.id = rfq_uuid
    GROUP BY r.id, r.user_id, r.full_name, r.company, r.email, r.phone, 
             r.additional_notes, r.dfars_required, r.rohs_compliant, r.status, 
             r.total_pieces, r.total_items, r.created_at, r.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_multiline_rfq_with_items(UUID) TO authenticated;

-- 13. Update admin dashboard stats function to include multiline RFQs
-- Drop the existing function first to avoid type conflicts
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
    total_quotes BIGINT,
    pending_quotes BIGINT,
    approved_quotes BIGINT,
    rejected_quotes BIGINT,
    in_progress_quotes BIGINT,
    total_users BIGINT,
    admin_users BIGINT,
    total_multiline_rfqs BIGINT,
    pending_multiline_rfqs BIGINT,
    approved_multiline_rfqs BIGINT,
    rejected_multiline_rfqs BIGINT,
    in_progress_multiline_rfqs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Regular quotes stats
        (SELECT COUNT(*)::BIGINT FROM public.quotes) as total_quotes,
        (SELECT COUNT(*)::BIGINT FROM public.quotes WHERE status = 'pending') as pending_quotes,
        (SELECT COUNT(*)::BIGINT FROM public.quotes WHERE status = 'approved') as approved_quotes,
        (SELECT COUNT(*)::BIGINT FROM public.quotes WHERE status = 'rejected') as rejected_quotes,
        (SELECT COUNT(*)::BIGINT FROM public.quotes WHERE status = 'in_progress') as in_progress_quotes,
        -- User stats
        (SELECT COUNT(*)::BIGINT FROM auth.users) as total_users,
        (SELECT COUNT(*)::BIGINT FROM public.user_roles WHERE role IN ('admin', 'super_admin')) as admin_users,
        -- Multiline RFQ stats
        (SELECT COUNT(*)::BIGINT FROM public.multiline_rfqs) as total_multiline_rfqs,
        (SELECT COUNT(*)::BIGINT FROM public.multiline_rfqs WHERE status = 'pending') as pending_multiline_rfqs,
        (SELECT COUNT(*)::BIGINT FROM public.multiline_rfqs WHERE status = 'approved') as approved_multiline_rfqs,
        (SELECT COUNT(*)::BIGINT FROM public.multiline_rfqs WHERE status = 'rejected') as rejected_multiline_rfqs,
        (SELECT COUNT(*)::BIGINT FROM public.multiline_rfqs WHERE status = 'in_progress') as in_progress_multiline_rfqs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
