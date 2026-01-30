-- Fix Foreign Key Constraints to allow Cascade Deletion
-- The issue was that order_items prevented items from being deleted because of ON DELETE RESTRICT

-- 1. Fix order_items -> items
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES public.items(id) 
ON DELETE CASCADE;

-- 2. Verify order_items -> orders (should already be CASCADE but good to force it)
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE CASCADE;

-- 3. Verify menus_categories -> restaurants
ALTER TABLE public.menus_categories
DROP CONSTRAINT IF EXISTS menus_categories_restaurant_id_fkey;

ALTER TABLE public.menus_categories
ADD CONSTRAINT menus_categories_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES public.restaurants(id)
ON DELETE CASCADE;

-- 4. Verify items -> restaurants
ALTER TABLE public.items
DROP CONSTRAINT IF EXISTS items_restaurant_id_fkey;

ALTER TABLE public.items
ADD CONSTRAINT items_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES public.restaurants(id)
ON DELETE CASCADE;

-- 5. Verify orders -> restaurants
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES public.restaurants(id)
ON DELETE CASCADE;
