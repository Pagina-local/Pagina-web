/*
# Fix review visibility for admins

1. Purpose
- Keep the public site showing only approved reviews to anonymous visitors.
- Allow signed-in administrators to see all reviews (including hidden ones) so
  moderation from the admin panel keeps working.

2. Modified policies (no data changes)
- `reviews`: split SELECT into two policies:
  - anon: only rows with status = 'approved'.
  - authenticated: all rows.
*/

DROP POLICY IF EXISTS "public_reviews_select_approved" ON reviews;
CREATE POLICY "public_reviews_select_approved" ON reviews FOR SELECT
  TO anon USING (status = 'approved');

DROP POLICY IF EXISTS "admin_reviews_select" ON reviews;
CREATE POLICY "admin_reviews_select" ON reviews FOR SELECT
  TO authenticated USING (true);
