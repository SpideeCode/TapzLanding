-- 1. Create storage bucket for 3D models 'food-models'
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-models', 'food-models', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies

-- Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'food-models' );

-- Authenticated Write Access (Upload)
-- Users can upload if they are authenticated (staff/admin)
-- Ideally we check if they belong to the restaurant folder, but for MVP any auth user is OK.
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'food-models' );

-- Authenticated Update Access
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'food-models' );

-- Authenticated Delete Access
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'food-models' );

-- 3. Update 'items' table with 3D model columns
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS model_3d_glb TEXT,
ADD COLUMN IF NOT EXISTS model_3d_usdz TEXT;
