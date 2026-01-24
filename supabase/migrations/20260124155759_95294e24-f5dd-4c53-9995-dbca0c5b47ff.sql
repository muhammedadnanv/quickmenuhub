-- Add is_special column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN is_special boolean DEFAULT false;