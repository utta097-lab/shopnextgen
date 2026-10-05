-- ============================================================================
-- SHOPNEX — Security Hardening Migration (Corrected & Hardened)
-- ============================================================================
-- Run this migration in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
--
-- SECURITY GUARANTEES:
-- 1. Creates public.shopnex_admins table with Row Level Security.
-- 2. Creates public.is_admin() SECURITY DEFINER authorization function.
-- 3. DOES NOT auto-register all users. Only registers YOUR specific admin UUID.
-- 4. Automatically removes ALL old, permissive policies from public.products.
-- 5. Replaces them with strict admin-only INSERT/UPDATE/DELETE policies.
-- 6. Automatically removes old, permissive storage policies on product-music.
-- 7. Replaces them with strict admin-only INSERT/UPDATE/DELETE storage policies.
-- 8. Preserves public SELECT read/play access for all visitors worldwide.
-- 9. SAFE MIGRATION: DOES NOT drop public.products or delete product/audio data!
-- ============================================================================

-- 1. Create Dedicated Admin Allowlist Table
CREATE TABLE IF NOT EXISTS public.shopnex_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on shopnex_admins
ALTER TABLE public.shopnex_admins ENABLE ROW LEVEL SECURITY;

-- Drop previous policies on shopnex_admins if any
DROP POLICY IF EXISTS "Admins can view admin status" ON public.shopnex_admins;
DROP POLICY IF EXISTS "Public can view admins" ON public.shopnex_admins;
DROP POLICY IF EXISTS "No client insert on admins" ON public.shopnex_admins;

-- Policy: Authenticated users can only read their own admin record
CREATE POLICY "Admins can view admin status"
  ON public.shopnex_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE/DELETE policies are granted to authenticated or anon.
-- Users cannot elevate their own privileges via client JavaScript.

-- 2. Create Security Definer Helper Functions: is_admin() & check_is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If user is not authenticated (anonymous visitor), return false immediately
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify user exists in the shopnex_admins allowlist
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

-- Grant EXECUTE to authenticated and anon so RLS policies and client can check admin status
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.check_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated, anon;

-- ============================================================================
-- 3. Register ONLY Your Specific SHOPNEX Admin User
-- ============================================================================
-- IMPORTANT:
-- In your Supabase Dashboard, go to: Authentication > Users.
-- Copy the 'User UID' (UUID string) of your specific admin account.
-- Replace 'PASTE_YOUR_EXACT_ADMIN_UUID_HERE' below with that exact UUID.

INSERT INTO public.shopnex_admins (user_id, role)
VALUES ('1cf5b4d5-c5ea-4572-b6e0-aa89dc081a90', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 4. Clean Up ALL Old Policies on public.products & Enforce Strict Admin RLS
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Dynamic drop: Guarantees that EVERY old policy on public.products is removed
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'products' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END
$$;

-- Explicit named drops (failsafe)
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can update products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.products;

-- Policy 1: Public SELECT (Anyone can view products and read music_url)
CREATE POLICY "Public can view all products"
  ON public.products
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: INSERT - ONLY authorized SHOPNEX admins can create products
CREATE POLICY "Only authorized admin can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy 3: UPDATE - ONLY authorized SHOPNEX admins can edit products
CREATE POLICY "Only authorized admin can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 4: DELETE - ONLY authorized SHOPNEX admins can delete products
CREATE POLICY "Only authorized admin can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 5. Clean Up Old Storage Policies & Enforce Strict Admin Storage RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public can listen to product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can delete product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can delete product music" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on product music" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload on product music" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on product music" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on product music" ON storage.objects;

-- Storage Policy 1: Public SELECT (Anyone can stream/play assigned music)
CREATE POLICY "Public can listen to product music"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-music');

-- Storage Policy 2: INSERT - ONLY authorized SHOPNEX admins can upload music
CREATE POLICY "Only authorized admin can upload product music"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-music' AND public.is_admin());

-- Storage Policy 3: UPDATE - ONLY authorized SHOPNEX admins can replace music
CREATE POLICY "Only authorized admin can update product music"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-music' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-music' AND public.is_admin());

-- Storage Policy 4: DELETE - ONLY authorized SHOPNEX admins can delete music
CREATE POLICY "Only authorized admin can delete product music"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-music' AND public.is_admin());

-- ============================================================================
-- VERIFICATION QUERIES (Run these after running the migration):
-- ============================================================================
-- 1. Verify ONLY your specific admin UUID is in the allowlist:
-- SELECT * FROM public.shopnex_admins;
--
-- 2. Verify products table policies (should show exactly 4 policies, with writes restricted to is_admin()):
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public';
--
-- 3. Verify product-music storage policies:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%product music%';
