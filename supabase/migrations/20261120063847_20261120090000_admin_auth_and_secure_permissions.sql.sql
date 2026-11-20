/*
# Real admin authentication and secure write permissions

1. Purpose
- Protect all administrative writes (products, categories, settings, review moderation)
  behind real Supabase email/password authentication, so anonymous visitors can no
  longer modify store data. Public reading of the menu stays open.

2. New table
- `admin_users`: allowlist of administrator emails.
  - email (text, primary key), created_at (timestamp).
  - The first authenticated person to sign up claims admin by inserting their own
    email while the table is empty (bootstrap policy). Afterwards the table can only
    be read by authenticated users, and only existing admins can write store data.

3. New function
- `public.is_admin()` (SECURITY DEFINER): returns true when the current session's
  JWT email is in `admin_users`. Executable only by `authenticated`.

4. Modified permissions (no data is changed or removed)
- `products`, `categories`, `store_settings`: anonymous role keeps SELECT only.
  INSERT/UPDATE/DELETE revoked from `anon`; new policies allow writes only to
  authenticated admins.
- `reviews`: anonymous role keeps SELECT (approved only) and INSERT (the public
  review form with photo keeps working). UPDATE/DELETE revoked from `anon` and
  restricted to admins (moderation).
- Storage: new public bucket `menu` for product images; read public, upload/edit
  only by authenticated admins. The `reviews` bucket keeps public upload for
  customer photos.

5. Security
- RLS stays enabled everywhere; policies are replaced with admin-scoped ones.
- No rows are deleted or modified; existing products, categories, reviews and
  settings are untouched.
*/

-- ADMIN ALLOWLIST
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON admin_users TO authenticated;

DROP POLICY IF EXISTS "admin_users_select" ON admin_users;
CREATE POLICY "admin_users_select" ON admin_users FOR SELECT
  TO authenticated USING (true);

-- Only the very first signup can claim admin (table empty at that moment).
DROP POLICY IF EXISTS "bootstrap_first_admin" ON admin_users;
CREATE POLICY "bootstrap_first_admin" ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM admin_users));

-- ADMIN CHECK HELPER
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- PRODUCTS: public read, admin-only writes
REVOKE INSERT, UPDATE, DELETE ON products FROM anon;
DROP POLICY IF EXISTS "public_products_insert" ON products;
CREATE POLICY "admin_products_insert" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_products_update" ON products;
CREATE POLICY "admin_products_update" ON products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_products_delete" ON products;
CREATE POLICY "admin_products_delete" ON products FOR DELETE
  TO authenticated USING (public.is_admin());

-- CATEGORIES: public read, admin-only writes
REVOKE INSERT, UPDATE, DELETE ON categories FROM anon;
DROP POLICY IF EXISTS "public_categories_insert" ON categories;
CREATE POLICY "admin_categories_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_categories_update" ON categories;
CREATE POLICY "admin_categories_update" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_categories_delete" ON categories;
CREATE POLICY "admin_categories_delete" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- STORE SETTINGS: public read, admin-only writes
REVOKE INSERT, UPDATE, DELETE ON store_settings FROM anon;
DROP POLICY IF EXISTS "public_settings_insert" ON store_settings;
CREATE POLICY "admin_settings_insert" ON store_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_settings_update" ON store_settings;
CREATE POLICY "admin_settings_update" ON store_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_settings_delete" ON store_settings;
CREATE POLICY "admin_settings_delete" ON store_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- REVIEWS: anyone may post (public form), only admins moderate
REVOKE UPDATE, DELETE ON reviews FROM anon;
DROP POLICY IF EXISTS "public_reviews_select" ON reviews;
CREATE POLICY "public_reviews_select_approved" ON reviews FOR SELECT
  TO anon USING (status = 'approved');
DROP POLICY IF EXISTS "public_reviews_update" ON reviews;
CREATE POLICY "admin_reviews_update" ON reviews FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "public_reviews_delete" ON reviews;
CREATE POLICY "admin_reviews_delete" ON reviews FOR DELETE
  TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "public_reviews_insert" ON reviews;
CREATE POLICY "public_reviews_insert" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- MENU IMAGES BUCKET: public read, admin-only upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu', 'menu', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "menu_public_read" ON storage.objects;
CREATE POLICY "menu_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'menu');

DROP POLICY IF EXISTS "menu_admin_insert" ON storage.objects;
CREATE POLICY "menu_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu' AND public.is_admin());

DROP POLICY IF EXISTS "menu_admin_update" ON storage.objects;
CREATE POLICY "menu_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'menu' AND public.is_admin())
  WITH CHECK (bucket_id = 'menu' AND public.is_admin());

DROP POLICY IF EXISTS "menu_admin_delete" ON storage.objects;
CREATE POLICY "menu_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu' AND public.is_admin());
