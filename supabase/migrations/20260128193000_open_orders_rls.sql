-- Allow public/anon access to orders and order_items
-- This is necessary because:
-- 1. Clients (anon) need to place orders (INSERT)
-- 2. Staff (using PIN/anon) need to view and manage orders (SELECT, UPDATE)

-- Orders
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public select orders" ON public.orders;
CREATE POLICY "Public select orders" ON public.orders
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders
    FOR UPDATE TO anon
    USING (true);

-- Order Items
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public select order_items" ON public.order_items;
CREATE POLICY "Public select order_items" ON public.order_items
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Public update order_items" ON public.order_items;
CREATE POLICY "Public update order_items" ON public.order_items
    FOR UPDATE TO anon
    USING (true);
