-- 1. Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    stripe_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the role constraint is up to date (dropping it if it exists with old roles)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('superadmin', 'admin', 'staff'));

-- FUNCTION to safely get the current user's role without recursion in RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- FUNCTION to safely get the current user's restaurant_id without recursion in RLS
CREATE OR REPLACE FUNCTION public.get_my_restaurant()
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- FUNCTION to handle new user profile creation
-- We use SECURITY DEFINER and SET search_path to ensure it runs with correct permissions and schema context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'staff'); -- Default role is staff
  RETURN new;
END;
$$;

-- TRIGGER to call the function on sign-up
-- We drop it first to ensure we don't have duplicates if the migration is re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Menu Categories
CREATE TABLE IF NOT EXISTS public.menus_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Items (Menu items)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.menus_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tables
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'preparing', 'served', 'paid')) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Users can only see their own profile, Superadmins can see all
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
CREATE POLICY "Profiles visibility" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR get_my_role() = 'superadmin');

-- Restaurant isolation: Users can only see data from their restaurant
-- Superadmins can see everything
DROP POLICY IF EXISTS "Admin/Staff/Superadmin can view restaurants" ON public.restaurants;
CREATE POLICY "Admin/Staff/Superadmin can view restaurants" ON public.restaurants
    FOR SELECT USING (
        id = get_my_restaurant()
        OR get_my_role() = 'superadmin'
    );

-- Multi-tenant isolation for other tables (READ)
DROP POLICY IF EXISTS "Tenancy select" ON public.menus_categories;
CREATE POLICY "Tenancy select" ON public.menus_categories
    FOR SELECT USING (restaurant_id = get_my_restaurant() OR get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Tenancy select" ON public.items;
CREATE POLICY "Tenancy select" ON public.items
    FOR SELECT USING (restaurant_id = get_my_restaurant() OR get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Tenancy select" ON public.tables;
CREATE POLICY "Tenancy select" ON public.tables
    FOR SELECT USING (restaurant_id = get_my_restaurant() OR get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Tenancy select" ON public.orders;
CREATE POLICY "Tenancy select" ON public.orders
    FOR SELECT USING (restaurant_id = get_my_restaurant() OR get_my_role() = 'superadmin');

-- WRITE POLICIES for Admins
-- Categories
DROP POLICY IF EXISTS "Admin manage categories" ON public.menus_categories;
CREATE POLICY "Admin manage categories" ON public.menus_categories 
    FOR ALL USING (get_my_role() = 'admin' AND restaurant_id = get_my_restaurant());

-- Items
DROP POLICY IF EXISTS "Admin manage items" ON public.items;
CREATE POLICY "Admin manage items" ON public.items 
    FOR ALL USING (get_my_role() = 'admin' AND restaurant_id = get_my_restaurant());

-- Tables
DROP POLICY IF EXISTS "Admin manage tables" ON public.tables;
CREATE POLICY "Admin manage tables" ON public.tables 
    FOR ALL USING (get_my_role() = 'admin' AND restaurant_id = get_my_restaurant());

-- Orders (Staff and Admins can manage orders)
DROP POLICY IF EXISTS "Staff manage orders" ON public.orders;
CREATE POLICY "Staff manage orders" ON public.orders 
    FOR ALL USING ((get_my_role() IN ('admin', 'staff')) AND restaurant_id = get_my_restaurant());

DROP POLICY IF EXISTS "Staff manage order_items" ON public.order_items;
CREATE POLICY "Staff manage order_items" ON public.order_items 
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_id AND restaurant_id = get_my_restaurant()
    ));

-- Allow superadmin to manage everything
DROP POLICY IF EXISTS "Superadmin all" ON public.restaurants;
CREATE POLICY "Superadmin all" ON public.restaurants FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.profiles;
CREATE POLICY "Superadmin all" ON public.profiles FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.menus_categories;
CREATE POLICY "Superadmin all" ON public.menus_categories FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.items;
CREATE POLICY "Superadmin all" ON public.items FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.tables;
CREATE POLICY "Superadmin all" ON public.tables FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.orders;
CREATE POLICY "Superadmin all" ON public.orders FOR ALL USING (get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin all" ON public.order_items;
CREATE POLICY "Superadmin all" ON public.order_items FOR ALL USING (get_my_role() = 'superadmin');

-- REFINED RESTAURANT CREATION: Superadmins can insert new restaurants
DROP POLICY IF EXISTS "Superadmin insert restaurants" ON public.restaurants;
CREATE POLICY "Superadmin insert restaurants" ON public.restaurants FOR INSERT WITH CHECK (get_my_role() = 'superadmin');

-- Client access (Public/Anonymous)
DROP POLICY IF EXISTS "Public can view menus" ON public.menus_categories;
CREATE POLICY "Public can view menus" ON public.menus_categories
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public can view items" ON public.items;
CREATE POLICY "Public can view items" ON public.items
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public can view tables" ON public.tables;
CREATE POLICY "Public can view tables" ON public.tables
    FOR SELECT TO anon USING (true);

-- Clients can create orders
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can create order_items" ON public.order_items;
CREATE POLICY "Public can create order_items" ON public.order_items
    FOR INSERT TO anon WITH CHECK (true);

-- REALTIME
-- Note: Realtime must be enabled via the Supabase Dashboard or via publication
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

/*
  HOW TO SET YOURSELF AS SUPERADMIN:
  Run the following SQL manually replacing the email:

  INSERT INTO public.profiles (id, email, role)
  SELECT id, email, 'superadmin'
  FROM auth.users
  WHERE email = 'ibiberisha02@gmail.com'
  ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
*/
