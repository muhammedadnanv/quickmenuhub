
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _restaurant_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND restaurant_id=_restaurant_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id=_restaurant_id AND owner_id=_user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND restaurant_id=_restaurant_id);
$$;

DROP POLICY IF EXISTS "Members view roles" ON public.user_roles;
CREATE POLICY "Members view roles" ON public.user_roles FOR SELECT
  USING (public.is_restaurant_member(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS "Owner manages roles" ON public.user_roles;
CREATE POLICY "Owner manages roles" ON public.user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.assign_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, restaurant_id, role)
  VALUES (NEW.owner_id, NEW.id, 'admin') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_assign_owner_admin ON public.restaurants;
CREATE TRIGGER trg_assign_owner_admin AFTER INSERT ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.assign_owner_admin();

INSERT INTO public.user_roles(user_id, restaurant_id, role)
SELECT owner_id, id, 'admin' FROM public.restaurants
ON CONFLICT DO NOTHING;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS tax_percent numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_prep_minutes integer DEFAULT 15;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  order_number integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  table_number text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  prep_minutes integer NOT NULL DEFAULT 15,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  price_snapshot numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(order_number),0)+1 INTO next_num
  FROM public.orders WHERE restaurant_id=NEW.restaurant_id AND created_at::date=CURRENT_DATE;
  NEW.order_number := next_num;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number BEFORE INSERT ON public.orders
FOR EACH ROW WHEN (NEW.order_number IS NULL OR NEW.order_number = 0)
EXECUTE FUNCTION public.set_order_number();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Members view orders" ON public.orders;
CREATE POLICY "Members view orders" ON public.orders FOR SELECT
  USING (public.is_restaurant_member(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS "Members create orders" ON public.orders;
CREATE POLICY "Members create orders" ON public.orders FOR INSERT
  WITH CHECK (public.is_restaurant_member(auth.uid(), restaurant_id) AND created_by=auth.uid());
DROP POLICY IF EXISTS "Members update orders" ON public.orders;
CREATE POLICY "Members update orders" ON public.orders FOR UPDATE
  USING (public.is_restaurant_member(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), restaurant_id, 'admin')
         OR EXISTS(SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid()));

DROP POLICY IF EXISTS "Members view order items" ON public.order_items;
CREATE POLICY "Members view order items" ON public.order_items FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.is_restaurant_member(auth.uid(), o.restaurant_id)));
DROP POLICY IF EXISTS "Members manage order items" ON public.order_items;
CREATE POLICY "Members manage order items" ON public.order_items FOR ALL
  USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.is_restaurant_member(auth.uid(), o.restaurant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.is_restaurant_member(auth.uid(), o.restaurant_id)));

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images','restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read restaurant images" ON storage.objects FOR SELECT
    USING (bucket_id = 'restaurant-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth upload restaurant images" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth update restaurant images" ON storage.objects FOR UPDATE
    USING (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth delete restaurant images" ON storage.objects FOR DELETE
    USING (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
