-- ============================================================================
-- SHOPNEX — Security Hardening Migration
-- ============================================================================
-- Run this migration in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
--
-- This script:
-- 1. Creates the public.shopnex_admins table (dedicated admin allowlist)
-- 2. Sets up a SECURITY DEFINER helper function: public.is_admin()
-- 3. Automatically registers any existing user(s) in auth.users as admin
-- 4. Replaces loose policies on public.products with strict admin-only policies
-- 5. Replaces loose policies on storage.objects ('product-music') with strict admin-only policies
-- 6. Keeps public SELECT read/play access for all visitors worldwide
--
-- SAFE MIGRATION:
-- DOES NOT DROP public.products or delete any existing product data or audio!
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
-- Only database administrators / service_role / SQL Editor can manage admin members.

-- 2. Create Security Definer Helper Function: public.is_admin()
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

-- Helper RPC for frontend checks
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

-- 3. Auto-Register Existing Supabase Auth User(s) as SHOPNEX Admin
-- If you already created an admin account in Supabase Auth (Authentication -> Users),
-- this query automatically links it into public.shopnex_admins:
INSERT INTO public.shopnex_admins (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- TIP: If you ever want to authorize a specific email manually in the future, run:
-- INSERT INTO public.shopnex_admins (user_id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- 4. Harden Row Level Security on public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop old loose/permissive policies
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can update products" ON public.products;
DROP POLICY IF EXISTS "Only authorized admin can delete products" ON public.products;

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

-- 5. Harden Row Level Security on storage.objects ('product-music' bucket)
-- Drop old loose storage policies
DROP POLICY IF EXISTS "Public can listen to product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admin can delete product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can upload product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can update product music" ON storage.objects;
DROP POLICY IF EXISTS "Only authorized admin can delete product music" ON storage.objects;

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
-- Verification Query (Run this to verify your admin user is registered):
-- SELECT * FROM public.shopnex_admins;
-- ============================================================================
