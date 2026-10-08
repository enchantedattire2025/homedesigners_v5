/*
# Clear all transactional data from dev database (fresh start)

## Purpose
Wipe all transactional/user-generated data from the dev database while
preserving master data:
- material_pricing_master (55 rows of material pricing reference data)
- designer_material_prices (55 rows of material pricing assigned to designers)
- admin_users (admin account reference)

## What gets deleted
1. All rows from 44 transactional tables (designers, customers, projects,
   quotes, bills, reviews, notifications, wallpaper orders, etc.)
2. All auth.users EXCEPT the admin account
   (enchantedattire2025@gmail.com)

## What is preserved
- material_pricing_master — master pricing reference data
- designer_material_prices — material pricing data
- admin_users — admin account
- site_settings — site configuration
- All table schemas, RLS policies, functions, triggers, indexes
- Storage bucket definitions and objects (storage API handles objects)
*/

-- 1. Truncate all transactional tables (order handles FK dependencies)
--    Using CASCADE to handle any remaining FK references

-- Bill system
TRUNCATE TABLE public.bill_versions CASCADE;
TRUNCATE TABLE public.bill_items CASCADE;
TRUNCATE TABLE public.project_bills CASCADE;

-- Quote system
TRUNCATE TABLE public.quote_items CASCADE;
TRUNCATE TABLE public.designer_quotes CASCADE;
TRUNCATE TABLE public.quote_acceptance_history CASCADE;

-- Project system
TRUNCATE TABLE public.project_versions CASCADE;
TRUNCATE TABLE public.project_activities CASCADE;
TRUNCATE TABLE public.project_updates CASCADE;
TRUNCATE TABLE public.project_team_members CASCADE;
TRUNCATE TABLE public.project_assignments CASCADE;
TRUNCATE TABLE public.project_shares CASCADE;
TRUNCATE TABLE public.project_images CASCADE;
TRUNCATE TABLE public.project_designs CASCADE;
TRUNCATE TABLE public.design_projects CASCADE;
TRUNCATE TABLE public.design_furniture CASCADE;
TRUNCATE TABLE public.design_rooms CASCADE;
TRUNCATE TABLE public.design_walls CASCADE;
TRUNCATE TABLE public.shared_gallery_items CASCADE;

-- Review system
TRUNCATE TABLE public.review_votes CASCADE;
TRUNCATE TABLE public.review_responses CASCADE;
TRUNCATE TABLE public.reviews CASCADE;

-- Subscription system
TRUNCATE TABLE public.subscription_usage_tracking CASCADE;
TRUNCATE TABLE public.subscription_payments CASCADE;
TRUNCATE TABLE public.designer_subscriptions CASCADE;
TRUNCATE TABLE public.subscription_plans CASCADE;

-- Deals system
TRUNCATE TABLE public.deal_redemptions CASCADE;
TRUNCATE TABLE public.designer_deals CASCADE;
TRUNCATE TABLE public.designer_projects_earnings CASCADE;

-- Notifications
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.email_notifications CASCADE;
TRUNCATE TABLE public.customer_notification_preferences CASCADE;

-- WhatsApp
TRUNCATE TABLE public.whatsapp_notification_logs CASCADE;
TRUNCATE TABLE public.whatsapp_settings CASCADE;

-- Vastu
TRUNCATE TABLE public.vastu_recommendations CASCADE;
TRUNCATE TABLE public.vastu_analyses CASCADE;

-- Chatbot
TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.chat_conversations CASCADE;
TRUNCATE TABLE public.chatbot_knowledge CASCADE;

-- Wallpaper orders
TRUNCATE TABLE public.wallpaper_orders CASCADE;
TRUNCATE TABLE public.wallpapers_3d CASCADE;

-- Designers and customers (transactional user data)
TRUNCATE TABLE public.designers CASCADE;
TRUNCATE TABLE public.customers CASCADE;

-- 2. Delete all auth users EXCEPT the admin account
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM auth.users
  WHERE email = 'enchantedattire2025@gmail.com'
);

-- Note: designer_material_prices and material_pricing_master are NOT truncated
-- Note: admin_users is NOT truncated
-- Note: site_settings is NOT truncated
