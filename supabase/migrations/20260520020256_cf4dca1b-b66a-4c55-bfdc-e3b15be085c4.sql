UPDATE public.restaurants
SET subscription_status = 'active',
    current_period_end = COALESCE(current_period_end, now() + interval '30 days')
WHERE subscription_status = 'pending';

ALTER TABLE public.restaurants ALTER COLUMN subscription_status SET DEFAULT 'active';