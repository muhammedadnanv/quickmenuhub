## Café Management System – Conversion Plan

Transform the current restaurant menu builder into an in-café operations system: order taking, billing, menu admin, sales analytics, with role-based access (admin / staff).

### Scope changes from current app
- Keep: auth, restaurants, menu_categories, menu_items, image storage, public menu (becomes optional "digital menu view")
- Add: orders, order_items, user_roles, daily/weekly/monthly sales analytics
- Replace top-level UX: Dashboard becomes a café operations workspace with sidebar (POS, Menu Admin, Orders, Reports, Settings)

### Database (new migration)
- `app_role` enum: `admin`, `staff`
- `user_roles` table (user_id, role) + `has_role()` security definer function
- Extend `menu_items`: `image_url`, `tax_rate` (default 0), already has `is_available`
- Extend `restaurants`: `tax_percent`, `default_prep_minutes`
- `orders`: id, restaurant_id, created_by, order_number (auto), status (`pending|preparing|ready|completed|cancelled`), customer_name, table_number, subtotal, tax, discount, total, prep_minutes, created_at, completed_at
- `order_items`: id, order_id, menu_item_id, name_snapshot, price_snapshot, quantity, line_total
- RLS: only restaurant owner + assigned staff/admin can see orders; admins manage menu; staff can create/update orders
- Trigger: auto-generate order_number per restaurant per day; auto-update `updated_at`

### Frontend structure
- `AppLayout` with shadcn sidebar (collapsible) – used inside the café workspace
- Routes:
  - `/` Landing (kept, rebranded to Café Management)
  - `/auth` (kept)
  - `/dashboard` Restaurant picker (kept, simplified)
  - `/cafe/:restaurantId/pos` POS / take order screen
  - `/cafe/:restaurantId/orders` Active + history orders, status updates
  - `/cafe/:restaurantId/menu` Menu admin (categories + items + images + availability) – admin only
  - `/cafe/:restaurantId/reports` Sales reports (daily/weekly/monthly, top items, revenue chart)
  - `/cafe/:restaurantId/settings` Restaurant settings + staff management (admin only)
  - `/menu/:slug` Public digital menu (kept)

### POS screen (core)
- Two-pane responsive layout: menu grid (categories tabs + item cards with images) | cart panel
- Cart: qty +/-, remove, customer name, table #, discount input (% or flat)
- Live calculation: subtotal → discount → tax → grand total
- "Place order" creates order + items, shows estimated prep time, prints/show receipt
- Mobile/tablet: cart becomes bottom sheet

### Orders screen
- Tabs: Active (pending/preparing/ready) and Completed
- Cards with order #, items, total, elapsed time, status transitions buttons
- Realtime via Supabase channel on `orders` table

### Reports
- Cards: today's revenue, today's orders, avg ticket, this week, this month
- Recharts line chart (revenue over last 30 days), bar chart (top 10 items), category breakdown
- Date range filter

### Roles
- Admin: full access (menu admin, settings, reports, POS, orders)
- Staff: POS + orders only
- Owner of restaurant is auto-admin
- Settings page lets admin invite staff by email (insert into user_roles after they sign up)

### Design
- Warm café palette: deep espresso, cream, caramel accent; serif display font (e.g., Fraunces) + Inter body
- All colors via HSL semantic tokens in `index.css` / `tailwind.config.ts`
- Touch-friendly POS buttons (min 44px), large item cards optimized for tablet

### Deliverable steps
1. Migration: roles, orders, order_items, item image_url, restaurant tax/prep fields, RLS, triggers
2. Storage: extend `restaurant-images` bucket usage for menu item images
3. Design tokens refresh (café theme)
4. Sidebar layout + route restructure
5. POS screen + cart logic
6. Orders screen with realtime
7. Menu admin upgrade (image upload, availability toggle, tax rate)
8. Reports screen with Recharts
9. Settings: staff invites
10. Rebrand landing + favicon copy as "Quick Menu Hub – Café Management"

After approval I will start with the migration.
