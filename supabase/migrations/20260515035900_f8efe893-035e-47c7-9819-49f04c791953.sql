CREATE TABLE public.posters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL DEFAULT 'Menu Poster',
  theme_color text NOT NULL DEFAULT '#c4654a',
  accent_color text NOT NULL DEFAULT '#2d1810',
  contact_email text,
  contact_phone text,
  website_url text,
  item_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin views posters" ON public.posters FOR SELECT
USING (has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = posters.cafe_id AND r.owner_id = auth.uid()));

CREATE POLICY "Owner creates posters" ON public.posters FOR INSERT
WITH CHECK ((EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = posters.cafe_id AND r.owner_id = auth.uid())) AND created_by = auth.uid());

CREATE POLICY "Owner or admin updates posters" ON public.posters FOR UPDATE
USING (has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = posters.cafe_id AND r.owner_id = auth.uid()));

CREATE POLICY "Owner or admin deletes posters" ON public.posters FOR DELETE
USING (has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = posters.cafe_id AND r.owner_id = auth.uid()));

CREATE TRIGGER touch_posters_updated_at BEFORE UPDATE ON public.posters
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();