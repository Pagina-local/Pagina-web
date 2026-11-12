/*
# Create reviews storage bucket for customer photos

1. Storage
- Create a public bucket "reviews" so customer-uploaded review photos are readable.
- Add a policy allowing anyone to upload objects (no-auth storefront) and anyone to read.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reviews_public_read" ON storage.objects;
CREATE POLICY "reviews_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "reviews_public_upload" ON storage.objects;
CREATE POLICY "reviews_public_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'reviews');

DROP POLICY IF EXISTS "reviews_public_delete" ON storage.objects;
CREATE POLICY "reviews_public_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'reviews');
