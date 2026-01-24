-- Add operating hours to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN opening_time time DEFAULT '09:00:00',
ADD COLUMN closing_time time DEFAULT '22:00:00',
ADD COLUMN is_open_today boolean DEFAULT true;