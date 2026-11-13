/*
# Add 'despacho' category to notifications

1. Modified Tables
- `notifications`: adds 'despacho' to the allowed values for the `category` CHECK constraint.
2. Security
- No RLS changes. Existing policies remain valid.
*/

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_category_check
  CHECK (category IN ('stock', 'pedido', 'recompra', 'sistema', 'despacho'));
