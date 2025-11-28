-- =============================================
-- SET ASIDE - SUPABASE BUCKET CREATION
-- =============================================
-- This file creates the product-images bucket and sets up storage policies.
-- Run this in your Supabase SQL editor.

-- =============================================
-- CREATE BUCKET
-- =============================================
-- Note: Bucket creation is typically done via Supabase Dashboard or API.
-- This SQL uses Supabase's storage schema functions.

-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,  -- Public bucket for read access
    5242880,  -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read/download images from product-images bucket
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: Authenticated users (staff only) can upload images
CREATE POLICY "product_images_staff_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.is_staff()
);

-- Policy: Staff can update their uploaded images
CREATE POLICY "product_images_staff_update"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND auth.is_staff()
)
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.is_staff()
);

-- Policy: Staff can delete images
CREATE POLICY "product_images_staff_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND auth.is_staff()
);

-- =============================================
-- ALTERNATIVE: Using Supabase Dashboard
-- =============================================
-- If the SQL above doesn't work, create the bucket via Dashboard:
-- 
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create a new bucket"
-- 3. Name: product-images
-- 4. Public bucket: Yes
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Then add policies via Dashboard → Storage → Policies:
-- 
-- SELECT (read): bucket_id = 'product-images' (no auth required)
-- INSERT (upload): bucket_id = 'product-images' AND auth.is_staff()
-- UPDATE: bucket_id = 'product-images' AND auth.is_staff()
-- DELETE: bucket_id = 'product-images' AND auth.is_staff()

-- =============================================
-- HELPER: Get public URL for an image
-- =============================================
-- Usage in application: 
-- https://[project-ref].supabase.co/storage/v1/object/public/product-images/[filename]

CREATE OR REPLACE FUNCTION get_product_image_url(filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN 'https://' || current_setting('app.settings.supabase_project_ref', true) 
           || '.supabase.co/storage/v1/object/public/product-images/' || filename;
END;
$$ LANGUAGE plpgsql;
