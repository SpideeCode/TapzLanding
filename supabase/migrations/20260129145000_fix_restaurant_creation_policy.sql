-- Allow authenticated users to create a restaurant
-- This is necessary for the onboarding flow where a new user creates their own restaurant.
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON public.restaurants;

CREATE POLICY "Authenticated users can create restaurants" ON public.restaurants
FOR INSERT 
TO authenticated 
WITH CHECK (true);
