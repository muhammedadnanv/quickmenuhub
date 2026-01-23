-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT DEFAULT 'Fresh • Local • Delicious',
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for slug lookups
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_categories_restaurant ON public.menu_categories(restaurant_id);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
-- Anyone can view restaurants (for public menu access)
CREATE POLICY "Anyone can view restaurants"
  ON public.restaurants FOR SELECT
  USING (true);

-- Owners can insert their own restaurants
CREATE POLICY "Owners can create restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own restaurants
CREATE POLICY "Owners can update own restaurants"
  ON public.restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own restaurants
CREATE POLICY "Owners can delete own restaurants"
  ON public.restaurants FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for menu_categories
-- Anyone can view categories (for public menu)
CREATE POLICY "Anyone can view categories"
  ON public.menu_categories FOR SELECT
  USING (true);

-- Restaurant owners can manage categories
CREATE POLICY "Owners can create categories"
  ON public.menu_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update categories"
  ON public.menu_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete categories"
  ON public.menu_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for menu_items
-- Anyone can view menu items (for public menu)
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Restaurant owners can manage items
CREATE POLICY "Owners can create items"
  ON public.menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update items"
  ON public.menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete items"
  ON public.menu_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  base_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  new_slug := base_slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql SET search_path = public;