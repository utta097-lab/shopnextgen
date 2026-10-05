-- ============================================================================
-- SHOPNEX — Real Database & Shared Storage Schema for Supabase
-- ============================================================================
-- Run this complete script in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
--
-- This script:
-- 1. Creates the public "products" table with music_url field
-- 2. Sets up Row Level Security (RLS) so anyone can read, only admin can write
-- 3. Creates the "product-music" Storage bucket for shared music files
-- 4. Configures storage RLS policies so anyone can stream, only admin can upload
-- 5. Seeds the initial base products (including Laden, Malay, Supe, Mosa, Dip, Kundan, Adam, Purnandu)
-- ============================================================================

-- 1. Create the Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC,
  original_price NUMERIC,
  discount NUMERIC,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  thumbnail TEXT,
  music_url TEXT, -- Shared permanent storage URL for product-specific music
  video TEXT,
  audio TEXT,     -- Mirror of music_url for backward compatibility
  short_description TEXT,
  description TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER,
  highlights JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  availability BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Dedicated Admin Allowlist Table
CREATE TABLE IF NOT EXISTS public.shopnex_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on shopnex_admins
ALTER TABLE public.shopnex_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin status" ON public.shopnex_admins;
CREATE POLICY "Admins can view admin status"
  ON public.shopnex_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Security Definer Helper Functions: is_admin() & check_is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.shopnex_admins
    WHERE user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_admin();
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.check_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated, anon;

-- Register your specific admin user UUID (obtained from Authentication > Users):
-- INSERT INTO public.shopnex_admins (user_id, role)
-- VALUES ('1cf5b4d5-c5ea-4572-b6e0-aa89dc081a90', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;

-- 4. Enable Row Level Security (RLS) on Products Table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can update products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can delete products" ON public.products;

-- RLS Policy: Anyone (visitors & customers) can view products and read music_url
CREATE POLICY "Public can view all products"
  ON public.products
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy: ONLY authorized SHOPNEX admins can insert products
CREATE POLICY "Only authorized admin can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- RLS Policy: ONLY authorized SHOPNEX admins can update products
CREATE POLICY "Only authorized admin can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policy: ONLY authorized SHOPNEX admins can delete products
CREATE POLICY "Only authorized admin can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Create Storage Bucket for Product Music (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-music',
  'product-music',
  true,
  52428800, -- 50 MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- 6. Storage Policies for "product-music" Bucket
-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can listen to product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can delete product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can delete product music" ON storage.objects;

-- RLS Policy: Public read access for audio files in product-music bucket
CREATE POLICY "Public can listen to product music"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-music');

-- RLS Policy: ONLY authorized SHOPNEX admins can upload audio files
CREATE POLICY "Only authorized admin can upload product music"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-music' AND public.is_admin());

-- RLS Policy: ONLY authorized SHOPNEX admins can update audio files
CREATE POLICY "Only authorized admin can update product music"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-music' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-music' AND public.is_admin());

-- RLS Policy: ONLY authorized SHOPNEX admins can delete audio files
CREATE POLICY "Only authorized admin can delete product music"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-music' AND public.is_admin());

-- 7. Seed Base Products into Supabase
INSERT INTO public.products (
  id, name, category, price, original_price, discount,
  image, images, thumbnail, music_url, audio,
  short_description, description, rating, review_count,
  highlights, specifications, availability, featured, badge
)
VALUES
  (
    'product-001', 'Laden', 'WOH ALAG HI LEVEL KA BANDA THA', 0.50000, 1.00000, 50,
    'products/product-001/thumbnail.jpg',
    '["products/product-001/image-1.jpg", "products/product-001/image-2.jpg", "products/product-001/image-3.jpg", "products/product-001/image-4.jpg"]'::jsonb,
    'products/product-001/thumbnail.jpg', NULL, NULL,
    'Neophile — धर्मो रक्षति रक्षितः ॐ ॐ',
    'Neophile\n\nधर्मो रक्षति रक्षितः ॐ ॐ',
    0.1, NULL,
    '["Authentic original showcase item", "Neophile — धर्मो रक्षति रक्षितः ॐ ॐ", "Exclusive category: WOH ALAG HI LEVEL KA BANDA THA"]'::jsonb,
    '{"Category": "WOH ALAG HI LEVEL KA BANDA THA", "Status": "Verified Original Showcase"}'::jsonb,
    true, true, 'FEATURED'
  ),
  (
    'product-002', 'Malay', 'পাগল', NULL, NULL, NULL,
    'products/malay/thumbnail.jpg',
    '["products/malay/image-1.jpg", "products/malay/image-2.jpg"]'::jsonb,
    'products/malay/thumbnail.jpg', NULL, NULL,
    'Historically and in formal clinical contexts, it refers to an insane or severely mentally disturbed man.',
    'Historically and in formal clinical contexts, it refers to an insane or severely mentally disturbed man. Today, this usage is often considered old-fashioned and derogatory. Reckless Behavior: It describes someone who takes dangerous, wild, or uncontrolled risks.',
    2.0, NULL,
    '[]'::jsonb,
    '{"Category": "পাগল", "Status": "Verified Original Showcase"}'::jsonb,
    true, false, 'পাগল'
  ),
  (
    'product-003', 'Supe', 'ভদ্র ছেলে', NULL, NULL, NULL,
    'products/supe/thumbnail.jpg',
    '["products/supe/image-1.jpg", "products/supe/image-2.jpg"]'::jsonb,
    'products/supe/thumbnail.jpg', NULL, NULL,
    'A qualified professional who practices medicine to diagnose, treat, and prevent illnesses and injuries.',
    'A qualified professional who practices medicine to diagnose, treat, and prevent illnesses and injuries, or an individual who holds the highest academic university degree.',
    0.1, NULL,
    '[]'::jsonb,
    '{"Category": "ভদ্র ছেলে", "Status": "Verified Original Showcase"}'::jsonb,
    true, false, 'ভদ্র ছেলে'
  ),
  (
    'product-004', 'Mosa', 'বিশেষ জন্তু জানোয়ার', NULL, NULL, NULL,
    '', '[]'::jsonb, '', NULL, NULL,
    'Special Personality Showcase', 'Special Personality Showcase',
    4.9, NULL,
    '[]'::jsonb,
    '{"Category": "বিশেষ জন্তু জানোয়ার", "Status": "Verified Original Showcase"}'::jsonb,
    true, false, 'বিশেষ জন্তু জানোয়ার'
  ),
  (
    'product-005', 'Dip', 'FESTIVAL DHAMAKA', NULL, NULL, NULL,
    'products/dip/thumbnail.jpg',
    '["products/dip/image-1.jpg", "products/dip/image-2.jpg"]'::jsonb,
    'products/dip/thumbnail.jpg', NULL, NULL,
    'Festival Dhamaka Special', 'Festival Dhamaka Special',
    5.0, NULL,
    '["FESTIVAL DHAMAKA Exclusive", "5.0 Top Rating"]'::jsonb,
    '{"Category": "FESTIVAL DHAMAKA", "Status": "Verified Original Showcase"}'::jsonb,
    true, false, 'FESTIVAL DHAMAKA'
  ),
  (
    'product-006', 'kundan', 'ভদ্র ছেলে', 150, NULL, NULL,
    'products/kundan/thumbnail.jpg',
    '["products/kundan/image-1.jpg"]'::jsonb,
    'products/kundan/thumbnail.jpg', NULL, NULL,
    'a famous and charismatic musician who plays rock-and-roll music.',
    'a famous and charismatic musician who plays rock-and-roll music.Literal MeaningMusic: A lead singer or band member in the rock genre known for fame, stage presence, and energetic style.Examples: Classic performers like Elvis Presley, Jimi Hendrix, and David Bowie are traditional rockstars.',
    4.0, NULL,
    '["ভদ্র ছেলে Exclusive", "Rock-and-roll musician & stage presence", "Verified Showcase Member"]'::jsonb,
    '{"Category": "ভদ্র ছেলে", "Status": "Verified Original Showcase", "Genre": "Rock-and-roll"}'::jsonb,
    true, false, 'ভদ্র ছেলে'
  ),
  (
    'product-007', 'Adam', 'WOH ALAG HI LEVEL KA BANDA THA', 150000, NULL, NULL,
    'products/adam/thumbnail.jpg',
    '["products/adam/image-1.jpg"]'::jsonb,
    'products/adam/thumbnail.jpg', NULL, NULL,
    'a prominent media figure, author, and comedian who is famously a massive "maths geek," you are likely thinking of Adam',
    'a prominent media figure, author, and comedian who is famously a massive "maths geek," you are likely thinking of Adam\n\nHe is an Australian comedian, radio presenter, and University of Sydney ambassador for mathematics and science. He is widely known for his high-energy TED Talks about prime numbers and has published several popular books celebrating mathematics, such as [Adam Spencer''s Book of Numbers] and Numberland.',
    100.0, NULL,
    '["WOH ALAG HI LEVEL KA BANDA THA Exclusive", "Rating: 100", "Australian Comedian & Radio Presenter", "University of Sydney Ambassador for Mathematics & Science"]'::jsonb,
    '{"Category": "WOH ALAG HI LEVEL KA BANDA THA", "Status": "Verified Original Showcase", "Specialty": "Mathematics & Science Ambassador"}'::jsonb,
    true, false, 'WOH ALAG HI LEVEL KA BANDA THA'
  ),
  (
    'product-008', 'Purnandu', 'FESTIVAL DHAMAKA', 500, NULL, NULL,
    'products/purnandu/thumbnail.jpg',
    '["products/purnandu/image-1.jpg"]'::jsonb,
    'products/purnandu/thumbnail.jpg', NULL, NULL,
    'often identified as gifted or profoundly gifted, possess exceptional cognitive abilities, rapid information processing, and intense curiosity.',
    'often identified as gifted or profoundly gifted, possess exceptional cognitive abilities, rapid information processing, and intense curiosity that significantly outpace standard grade-level curricula.\n\nCore Characteristics:\n• Rapid Comprehension: Grasp complex and abstract concepts effortlessly with minimal instruction.\n• Asynchronous Development: Mental and intellectual ages outpace physical, social, or emotional maturity.\n• Insatiable Curiosity: Pursue deep, self- directed inquiries into specific passions, often showing frustration with repetitive or mundane tasks.',
    5.0, NULL,
    '["FESTIVAL DHAMAKA Exclusive", "5.0 Rating", "Profoundly Gifted & Cognitive Mastery", "Rapid Comprehension & Deep Inquiry"]'::jsonb,
    '{"Category": "FESTIVAL DHAMAKA", "Status": "Verified Original Showcase"}'::jsonb,
    true, false, 'FESTIVAL DHAMAKA'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  rating = EXCLUDED.rating,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  image = EXCLUDED.image,
  thumbnail = EXCLUDED.thumbnail,
  images = EXCLUDED.images,
  updated_at = NOW();
