/*
# Create fast-food store schema (single-tenant, no auth)

1. New Tables
- `categories`: menu categories (Combos, Hamburguesas, Salchipapas, Perros Calientes, Bebidas, Adicionales).
  - id (uuid pk), name (text, unique), slug (text, unique), sort_order (int), created_at.
- `products`: menu items.
  - id (uuid pk), category_id (fk -> categories), name, description, base_price (numeric),
    image_url (text), variations (jsonb), extras (jsonb), available (bool default true),
    sort_order (int), created_at.
  - `variations`: array of {id, name, priceDelta} representing sizes/styles.
  - `extras`: array of {id, name, price} representing optional toppings/ingredients.
- `reviews`: customer reviews with optional photo.
  - id (uuid pk), customer_name (text), rating (int 1..5), comment (text),
    image_url (text nullable), status (text default 'approved' — values: 'approved','hidden'),
    created_at.
- `store_settings`: single-row config (whatsapp number, delivery fee, promo text).
  - id (int pk default 1), whatsapp_number (text), delivery_fee (numeric), promo_title (text),
    promo_subtitle (text), promo_badge (text), updated_at.

2. Security
- RLS enabled on all tables.
- Grants CRUD to anon + authenticated (single-tenant, no sign-in; data intentionally public/shared).
- Policies use USING (true) / WITH CHECK (true) — appropriate for a public/shared no-auth store app.
- Reviews INSERT restricted so the moderation workflow (admin hides/approves) stays sane:
  new reviews are INSERT-able by anyone but UPDATE/DELETE are also open so the admin (client-side
  password gate) can moderate. This is a storefront, not multi-user private data.

3. Seed Data
- 6 categories, 18 products with real Pexels image URLs, 5 starter reviews, 1 settings row.
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO anon, authenticated;
DROP POLICY IF EXISTS "public_categories_select" ON categories;
CREATE POLICY "public_categories_select" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_categories_insert" ON categories;
CREATE POLICY "public_categories_insert" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_categories_update" ON categories;
CREATE POLICY "public_categories_update" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_categories_delete" ON categories;
CREATE POLICY "public_categories_delete" ON categories FOR DELETE TO anon, authenticated USING (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  base_price numeric(10,0) NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
DROP POLICY IF EXISTS "public_products_select" ON products;
CREATE POLICY "public_products_select" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_products_insert" ON products;
CREATE POLICY "public_products_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_products_update" ON products;
CREATE POLICY "public_products_update" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_products_delete" ON products;
CREATE POLICY "public_products_delete" ON products FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO anon, authenticated;
DROP POLICY IF EXISTS "public_reviews_select" ON reviews;
CREATE POLICY "public_reviews_select" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_reviews_insert" ON reviews;
CREATE POLICY "public_reviews_insert" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_reviews_update" ON reviews;
CREATE POLICY "public_reviews_update" ON reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_reviews_delete" ON reviews;
CREATE POLICY "public_reviews_delete" ON reviews FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

-- STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id int PRIMARY KEY DEFAULT 1,
  whatsapp_number text NOT NULL DEFAULT '573001112233',
  delivery_fee numeric(10,0) NOT NULL DEFAULT 5000,
  promo_title text NOT NULL DEFAULT '',
  promo_subtitle text NOT NULL DEFAULT '',
  promo_badge text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON store_settings TO anon, authenticated;
DROP POLICY IF EXISTS "public_settings_select" ON store_settings;
CREATE POLICY "public_settings_select" ON store_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_settings_insert" ON store_settings;
CREATE POLICY "public_settings_insert" ON store_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_settings_update" ON store_settings;
CREATE POLICY "public_settings_update" ON store_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_settings_delete" ON store_settings;
CREATE POLICY "public_settings_delete" ON store_settings FOR DELETE TO anon, authenticated USING (true);

-- SEED CATEGORIES (use explicit ids so product seed can reference them)
INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Combos', 'combos', 1),
  ('22222222-2222-2222-2222-222222222222', 'Hamburguesas', 'hamburguesas', 2),
  ('33333333-3333-3333-3333-333333333333', 'Salchipapas', 'salchipapas', 3),
  ('44444444-4444-4444-4444-444444444444', 'Perros Calientes', 'perros-calientes', 4),
  ('55555555-5555-5555-5555-555555555555', 'Bebidas', 'bebidas', 5),
  ('66666666-6666-6666-6666-666666666666', 'Adicionales', 'adicionales', 6)
ON CONFLICT (name) DO NOTHING;

-- SEED PRODUCTS
INSERT INTO products (category_id, name, description, base_price, image_url, variations, extras, available, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Combo Doble Clásico', 'Dos hamburguesas de carne, queso cheddar, papas medianas y bebida.', 23900, 'https://images.pexels.com/photos/20003199/pexels-photo-20003199.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":8000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"papa-grande","name":"Papas Grandes","price":3500}]',
  true, 1),
('11111111-1111-1111-1111-111111111111', 'Combo Bacon Lover', 'Hamburguesa con doble tocino, queso ahumado, aros de cebolla y bebida.', 25900, 'https://images.pexels.com/photos/16962427/pexels-photo-16962427.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":9000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000}]',
  true, 2),
('11111111-1111-1111-1111-111111111111', 'Combo Especial Casa', 'Hamburguesa especial de la casa, papas gajo y bebida grande.', 28900, 'https://images.pexels.com/photos/4809147/pexels-photo-4809147.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":10000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000}]',
  true, 3),

('22222222-2222-2222-2222-222222222222', 'Hamburguesa Clásica', 'Carne 150g, queso americano, lechuga, tomate y salsa de la casa.', 15900, 'https://images.pexels.com/photos/23910856/pexels-photo-23910856.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"sencilla","name":"Sencilla","priceDelta":0},{"id":"doble","name":"Doble","priceDelta":4000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"extra-carne","name":"Extra Carne","price":4500},{"id":"huevo","name":"Huevo","price":2000}]',
  true, 1),
('22222222-2222-2222-2222-222222222222', 'Hamburguesa BBQ', 'Carne 150g, queso, tocino, aros de cebolla y salsa BBQ.', 17900, 'https://images.pexels.com/photos/20722035/pexels-photo-20722035.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"sencilla","name":"Sencilla","priceDelta":0},{"id":"doble","name":"Doble","priceDelta":4000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"extra-carne","name":"Extra Carne","price":4500}]',
  true, 2),
('22222222-2222-2222-2222-222222222222', 'Hamburguesa Especial', 'Doble carne, queso doble, huevo, tocino y salsas artesanales.', 21900, 'https://images.pexels.com/photos/32807693/pexels-photo-32807693.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"sencilla","name":"Sencilla","priceDelta":0},{"id":"doble","name":"Doble","priceDelta":5000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"extra-carne","name":"Extra Carne","price":4500}]',
  true, 3),

('33333333-3333-3333-3333-333333333333', 'Salchipapa Clásica', 'Papas crujientes con salchicha y salsas de la casa.', 12900, 'https://images.pexels.com/photos/32986485/pexels-photo-32986485.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":6000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"huevo","name":"Huevo","price":2000}]',
  true, 1),
('33333333-3333-3333-3333-333333333333', 'Salchipapa Mixta', 'Papas con salchicha, pollo, chorizo y salsas especiales.', 16900, 'https://images.pexels.com/photos/29285460/pexels-photo-29285460.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":7000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"huevo","name":"Huevo","price":2000}]',
  true, 2),
('33333333-3333-3333-3333-333333333333', 'Salchipapa Hawaiana', 'Papas, salchicha, piña, queso derretido y salsa golf.', 15900, 'https://images.pexels.com/photos/27758758/pexels-photo-27758758.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"personal","name":"Personal","priceDelta":0},{"id":"familiar","name":"Familiar","priceDelta":6000}]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000}]',
  true, 3),

('44444444-4444-4444-4444-444444444444', 'Perro Clásico', 'Salchicha americana, pan, salsa rosada, mostaza y queso.', 10900, 'https://images.pexels.com/photos/5041477/pexels-photo-5041477.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"chorizo","name":"Chorizo","price":3500}]',
  true, 1),
('44444444-4444-4444-4444-444444444444', 'Perro Especial', 'Salchicha doble, tocino, queso cheddar, aros de cebolla y salsas.', 14900, 'https://images.pexels.com/photos/4669301/pexels-photo-4669301.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000},{"id":"chorizo","name":"Chorizo","price":3500}]',
  true, 2),
('44444444-4444-4444-4444-444444444444', 'Perro Mexicano', 'Salchicha, guacamole, jalapeños, queso y salsa picante.', 13900, 'https://images.pexels.com/photos/23106708/pexels-photo-23106708.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]',
  '[{"id":"extra-queso","name":"Extra Queso","price":2500},{"id":"extra-tocino","name":"Extra Tocino","price":3000}]',
  true, 3),

('55555555-5555-5555-5555-555555555555', 'Gaseosa 400ml', 'Bebida gaseosa fría a elegir: Coca-Cola, Sprite o Fanta.', 4000, 'https://images.pexels.com/photos/17650224/pexels-photo-17650224.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"coca","name":"Coca-Cola","priceDelta":0},{"id":"sprite","name":"Sprite","priceDelta":0},{"id":"fanta","name":"Fanta","priceDelta":0}]',
  '[]',
  true, 1),
('55555555-5555-5555-5555-555555555555', 'Gaseosa 1.5L', 'Bebida gaseosa familiar 1.5 litros a elegir.', 9000, 'https://images.pexels.com/photos/5869812/pexels-photo-5869812.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"coca","name":"Coca-Cola","priceDelta":0},{"id":"sprite","name":"Sprite","priceDelta":0}]',
  '[]',
  true, 2),
('55555555-5555-5555-5555-555555555555', 'Limonada Natural', 'Limonada fresca con hielo, perfecta para acompañar.', 6000, 'https://images.pexels.com/photos/15823325/pexels-photo-15823325.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"tradicional","name":"Tradicional","priceDelta":0},{"id":"coco","name":"Con Coco","priceDelta":1500}]',
  '[]',
  true, 3),
('55555555-5555-5555-5555-555555555555', 'Milkshake', 'Batido de leche cremoso en sabor chocolate, vainilla o fresa.', 12000, 'https://images.pexels.com/photos/30660270/pexels-photo-30660270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[{"id":"chocolate","name":"Chocolate","priceDelta":0},{"id":"vainilla","name":"Vainilla","priceDelta":0},{"id":"fresa","name":"Fresa","priceDelta":1000}]',
  '[]',
  true, 4),

('66666666-6666-6666-6666-666666666666', 'Extra Queso', 'Porción adicional de queso derretido.', 2500, 'https://images.pexels.com/photos/23106715/pexels-photo-23106715.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '[]', '[]', true, 1),
('66666666-6666-6666-6666-666666666666', 'Extra Tocino', 'Tiras extra de tocino crujiente.', 3000, 'https://images.pexels.com/photos/9552569/pexels-photo-9552569.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '[]', '[]', true, 2),
('66666666-6666-6666-6666-666666666666', 'Aros de Cebolla', 'Aros de cebolla crujientes (6 unidades).', 4500, 'https://images.pexels.com/photos/37284045/pexels-photo-37284045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '[]', '[]', true, 3),
('66666666-6666-6666-6666-666666666666', 'Porción de Papas', 'Papas crujientes adicionales.', 5000, 'https://images.pexels.com/photos/29285459/pexels-photo-29285459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '[]', '[]', true, 4)
ON CONFLICT DO NOTHING;

-- SEED REVIEWS
INSERT INTO reviews (customer_name, rating, comment, image_url, status, created_at) VALUES
('María González', 5, 'Las mejores hamburguesas del barrio, super jugosas y entregaron rapidísimo. Pedimos el combo bacon y espectacular.', 'https://images.pexels.com/photos/20003199/pexels-photo-20003199.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', now() - interval '2 days'),
('Carlos Pérez', 5, 'La salchipapa mixta es una locura, viene muy bien servida. Volveré a pedir seguro.', 'https://images.pexels.com/photos/29285460/pexels-photo-29285460.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', now() - interval '5 days'),
('Andrea Torres', 4, 'Muy rica la comida, el perro clásico estaba delicioso. Solo tardaron un poco más de lo prometido.', 'https://images.pexels.com/photos/5041477/pexels-photo-5041477.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', now() - interval '8 days'),
('Juan Restrepo', 5, 'Pedimos el combo especial de la casa para la familia y todos quedaron felices. Salsas riquísimas.', 'https://images.pexels.com/photos/4809147/pexels-photo-4809147.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', now() - interval '12 days'),
('Valentina Gómez', 5, 'El milkshake de chocolate es increible, súper cremoso. La comida siempre llega calientcita.', 'https://images.pexels.com/photos/30660270/pexels-photo-30660270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', now() - interval '15 days')
ON CONFLICT DO NOTHING;

-- SEED SETTINGS
INSERT INTO store_settings (id, whatsapp_number, delivery_fee, promo_title, promo_subtitle, promo_badge) VALUES
(1, '573001112233', 5000, 'Combo del Día: 2x1 en Combos Clásicos', 'Solo por hoy, llevá dos combos al precio de uno. ¡Pedí antes de las 9pm!', 'PROMO HOY')
ON CONFLICT (id) DO NOTHING;
