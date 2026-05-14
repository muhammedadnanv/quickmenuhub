
-- 1. WIPE existing data
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.menu_items;
DELETE FROM public.menu_categories;
DELETE FROM public.user_roles;
DELETE FROM public.restaurants;

-- Remove all existing auth users (start fresh)
DELETE FROM auth.users;

-- 2. Replace user_roles to be GLOBAL (super_admin / cafe_owner)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('super_admin', 'cafe_owner');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin manages roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Drop old restaurant helper functions / triggers that referenced restaurant_id roles
DROP FUNCTION IF EXISTS public.is_restaurant_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.assign_owner_admin() CASCADE;

-- 4. Extend restaurants (cafés) table with new fields
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Replace restaurants RLS: super_admin manages all; owner reads/updates own; public can view (for /menu)
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can create restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can delete own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can update own restaurants" ON public.restaurants;

CREATE POLICY "Public view restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Super admin inserts cafes" ON public.restaurants FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin or owner updates cafe" ON public.restaurants FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = owner_id);
CREATE POLICY "Super admin deletes cafe" ON public.restaurants FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Update menu_categories / menu_items / orders / order_items policies to use new model
-- categories
DROP POLICY IF EXISTS "Owners can create categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Owners can delete categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Owners can update categories" ON public.menu_categories;

CREATE POLICY "Owner or admin manages categories" ON public.menu_categories FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid()));

-- items
DROP POLICY IF EXISTS "Owners can create items" ON public.menu_items;
DROP POLICY IF EXISTS "Owners can delete items" ON public.menu_items;
DROP POLICY IF EXISTS "Owners can update items" ON public.menu_items;

CREATE POLICY "Owner or admin manages items" ON public.menu_items FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid()));

-- orders
DROP POLICY IF EXISTS "Members create orders" ON public.orders;
DROP POLICY IF EXISTS "Members update orders" ON public.orders;
DROP POLICY IF EXISTS "Members view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;

CREATE POLICY "Owner or admin views orders" ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid()));
CREATE POLICY "Owner creates orders" ON public.orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    AND created_by = auth.uid());
CREATE POLICY "Owner or admin updates orders" ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid()));
CREATE POLICY "Owner or admin deletes orders" ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid()));

-- order_items
DROP POLICY IF EXISTS "Members manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Members view order items" ON public.order_items;

CREATE POLICY "Owner or admin manages order items" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders o JOIN public.restaurants r ON r.id = o.restaurant_id
                 WHERE o.id = order_items.order_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o JOIN public.restaurants r ON r.id = o.restaurant_id
                 WHERE o.id = order_items.order_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));

-- 6. Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric NOT NULL DEFAULT 1599,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created', -- created | paid | failed
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin views subscriptions" ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.restaurants r WHERE r.id = subscriptions.cafe_id AND r.owner_id = auth.uid()));

CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 7. Order number trigger needs re-attaching since we dropped CASCADE? It was a function not dropped. Re-create trigger if missing.
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

DROP TRIGGER IF EXISTS touch_orders_updated_at ON public.orders;
CREATE TRIGGER touch_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER touch_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 8. Seed Super Admin auth user
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated', 'authenticated',
    'adnanmuhammad4393@gmail.com',
    crypt('adnanmuhammad4393@quickmenu', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Super Admin"}'::jsonb,
    false, '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'adnanmuhammad4393@gmail.com', 'email_verified', true),
    'email', new_user_id::text, now(), now(), now()
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'super_admin');
END $$;
