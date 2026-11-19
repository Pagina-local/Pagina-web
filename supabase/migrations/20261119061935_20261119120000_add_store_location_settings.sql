/*
# Add shared store location settings

1. Purpose
- Adds the Google Maps directions link and the human-readable location label used by the storefront.
- Keeps location configuration in the existing single-row `store_settings` record so all devices read the same values from Supabase.

2. New columns on `store_settings`
- `location_url` (text, required): Google Maps URL opened by the directions buttons.
- `location_label` (text, required): Address text displayed beside the map and in the footer.

3. Existing data
- Existing `store_settings` rows receive the Universo 22 location defaults automatically.
- No rows, tables, or existing columns are removed or renamed.

4. Security
- `store_settings` already has public shared-app RLS policies and grants for `anon` and `authenticated`.
- This migration does not change RLS policies or privileges; it only extends the existing settings row.

5. Compatibility
- `IF NOT EXISTS` keeps the migration safe to apply when either column is already present.
*/

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS location_url text NOT NULL DEFAULT 'https://maps.app.goo.gl/bzABoLhTwDbN7VgL8';

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS location_label text NOT NULL DEFAULT 'Plato, Magdalena (CP 475030)';

UPDATE store_settings
SET
  location_url = 'https://maps.app.goo.gl/bzABoLhTwDbN7VgL8',
  location_label = 'Plato, Magdalena (CP 475030)'
WHERE id = 1;