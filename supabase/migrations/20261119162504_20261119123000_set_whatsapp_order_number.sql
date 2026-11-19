/*
# Set default WhatsApp order number

1. Purpose
- Updates the WhatsApp number that receives customer orders and contact messages for UNIVERSO 22.

2. Modified table
- `store_settings`: existing single row now has `whatsapp_number` = `573142616195` (Colombia country code 57 + 3142616195).
- The column keeps a new matching default so a fresh settings row also uses this number.

3. Data safety
- No tables, columns, rows, or policies are removed. Only the value of `whatsapp_number` changes.

4. Security
- No changes to RLS policies or privileges; the existing shared-app policies keep applying.
*/

UPDATE store_settings
SET whatsapp_number = '573142616195'
WHERE id = 1;