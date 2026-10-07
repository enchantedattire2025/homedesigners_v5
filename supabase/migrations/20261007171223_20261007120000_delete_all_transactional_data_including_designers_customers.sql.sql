/*
  # Delete All Transactional Data Including Designers and Customers

  Deletes all transactional data: designers, customers, projects, quotes, bills,
  notifications, reviews, vastu, chat, deals, subscriptions, wallpaper orders, etc.

  Preserved (master/system data):
  - material_pricing_master
  - subscription_plans
  - admin_users
  - site_settings
  - whatsapp_settings
  - wallpapers_3d
  - chatbot_knowledge
*/

-- 1. Bill line items and versions (depend on project_bills)
DELETE FROM bill_items;
DELETE FROM bill_versions;
DELETE FROM project_bills;

-- 2. Quote items and acceptance history (depend on designer_quotes)
DELETE FROM quote_items;
DELETE FROM quote_acceptance_history;
DELETE FROM designer_quotes;

-- 3. Vastu recommendations (depend on vastu_analyses)
DELETE FROM vastu_recommendations;
DELETE FROM vastu_analyses;

-- 4. Reviews chain
DELETE FROM review_votes;
DELETE FROM review_responses;
DELETE FROM reviews;

-- 5. Design tool data
DELETE FROM design_furniture;
DELETE FROM design_walls;
DELETE FROM design_rooms;
DELETE FROM design_projects;

-- 6. Project tracking
DELETE FROM project_images;
DELETE FROM project_designs;
DELETE FROM project_activities;
DELETE FROM project_updates;
DELETE FROM project_versions;
DELETE FROM project_team_members;
DELETE FROM project_shares;
DELETE FROM project_assignments;

-- 7. Earnings
DELETE FROM designer_projects_earnings;

-- 8. Notifications and logs
DELETE FROM notifications;
DELETE FROM email_notifications;
DELETE FROM whatsapp_notification_logs;

-- 9. Chat
DELETE FROM chat_messages;
DELETE FROM chat_conversations;

-- 10. Deals
DELETE FROM deal_redemptions;
DELETE FROM designer_deals;

-- 11. Gallery
DELETE FROM shared_gallery_items;

-- 12. Subscriptions transactional data
DELETE FROM subscription_payments;
DELETE FROM subscription_usage_tracking;
DELETE FROM designer_subscriptions;

-- 13. Wallpaper orders
DELETE FROM wallpaper_orders;

-- 14. Customer notification preferences
DELETE FROM customer_notification_preferences;

-- 15. Designer material prices (per-designer, will be lost with designers)
DELETE FROM designer_material_prices;

-- 16. Customers (must come before designers due to NO ACTION on assigned_designer_id)
DELETE FROM customers;

-- 17. Designers
DELETE FROM designers;
