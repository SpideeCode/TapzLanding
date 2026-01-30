-- Add Monetization Columns to Restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing', -- trialing, active, canceled, past_due
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free', -- free, standard, premium
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN DEFAULT FALSE;

-- Enable RLS on all sensitive tables if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- CLEANUP EXISTING POLICIES (to avoid duplicates)
DROP POLICY IF EXISTS "Public can view items" ON public.items;
DROP POLICY IF EXISTS "Admins can manage items" ON public.items;
DROP POLICY IF EXISTS "Public can view categories" ON public.menus_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.menus_categories;
DROP POLICY IF EXISTS "Public can view tables" ON public.tables;
DROP POLICY IF EXISTS "Admins can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Orders are viewable by restaurant admins" ON public.orders;
DROP POLICY IF EXISTS "Orders are insertable by public" ON public.orders;
DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.items;
DROP POLICY IF EXISTS "Items are editable by restaurant admins" ON public.items;
DROP POLICY IF EXISTS "Menus are viewable by everyone" ON public.menus_categories;
DROP POLICY IF EXISTS "Menus are editable by restaurant admins" ON public.menus_categories;

-- RLS POLICIES

-- 1. ORDERS
-- Public can INSERT orders (placing an order)
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Admins can SELECT/UPDATE their own restaurant's orders
CREATE POLICY "Admins can view their restaurant orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = orders.restaurant_id
        AND (profiles.role = 'admin' OR profiles.role = 'superadmin' OR profiles.role = 'staff')
    )
);

CREATE POLICY "Admins can update their restaurant orders" 
ON public.orders FOR UPDATE
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = orders.restaurant_id
        AND (profiles.role = 'admin' OR profiles.role = 'superadmin' OR profiles.role = 'staff')
    )
);

-- 2. ITEMS (Dishes/Products)
-- Public can VIEW items (Digital Menu)
CREATE POLICY "Public can view items" 
ON public.items FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admins can INSERT/UPDATE/DELETE items
CREATE POLICY "Admins can manage items" 
ON public.items FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = items.restaurant_id
        AND profiles.role IN ('admin', 'superadmin')
    )
);

-- 3. MENUS / CATEGORIES
-- Public can VIEW categories
CREATE POLICY "Public can view categories" 
ON public.menus_categories FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admins can INSERT/UPDATE/DELETE categories
CREATE POLICY "Admins can manage categories" 
ON public.menus_categories FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = menus_categories.restaurant_id
        AND profiles.role IN ('admin', 'superadmin')
    )
);

-- 4. TABLES
-- Public can VIEW tables (for QR routing)
CREATE POLICY "Public can view tables" 
ON public.tables FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admins can MANAGE tables
CREATE POLICY "Admins can manage tables" 
ON public.tables FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = tables.restaurant_id
        AND profiles.role IN ('admin', 'superadmin')
    )
);
