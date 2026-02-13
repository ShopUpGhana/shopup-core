-- shopup-core (A1) - Clean schema in public.*
-- Assumes Supabase default extensions available (pgcrypto is usually enabled)
-- If gen_random_uuid() fails, enable pgcrypto in Supabase dashboard.

begin;

-- ---------- ENUMS ----------
do $$ begin
  create type seller_status as enum ('draft', 'pending', 'approved', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type seller_trust_tier as enum ('campus_seller', 'verified', 'registered_business');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type product_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum ('requested', 'accepted', 'rejected', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ---------- CORE TABLES ----------

-- Campus catalog (public-readable)
create table if not exists campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text null,
  country text not null default 'Ghana',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, city, country)
);

-- Sellers: 1-to-1 with auth.users (locked)
create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- campus anchoring (v1)
  campus_id uuid null references campuses(id) on delete set null,

  -- public shop identity (keep this safe to expose)
  display_name text not null,             -- shop name (can be personal brand)
  handle text null unique,                -- e.g., "legon-thrift-king"
  bio text null,

  -- contact (WhatsApp-first) - optional
  whatsapp_phone text null,               -- e.g., +233xxxxxxxxx

  status seller_status not null default 'draft',
  trust_tier seller_trust_tier not null default 'campus_seller',

  -- lightweight verification artifacts (no government reg required)
  campus_email text null,                 -- used for campus verification if you choose
  verified_at timestamptz null,
  suspended_reason text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products (always reference sellers.id)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  campus_id uuid null references campuses(id) on delete set null, -- allows “campus feed” without joins

  title text not null,
  description text null,
  category text null,                     -- keep flexible for v1
  price_ghs numeric(12,2) not null check (price_ghs >= 0),
  currency text not null default 'GHS',

  status product_status not null default 'draft',
  is_available boolean not null default true,

  -- images: keep simple v1 (array of URLs)
  image_urls text[] not null default '{}'::text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders (lightweight “intent” model)
-- Buyer is auth.users, but commerce references seller_id (locked)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references sellers(id) on delete restrict,
  campus_id uuid null references campuses(id) on delete set null,

  status order_status not null default 'requested',

  -- simple “what do you want?” payload for MVP
  note text null,
  contact_phone text null,                -- buyer contact if needed
  preferred_fulfillment text null,        -- e.g., "campus pickup", "meetup", "delivery"

  -- totals (optional MVP; can compute later)
  subtotal_ghs numeric(12,2) null check (subtotal_ghs is null or subtotal_ghs >= 0),
  total_ghs numeric(12,2) null check (total_ghs is null or total_ghs >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: order line items (recommended even in MVP)
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,

  quantity int not null default 1 check (quantity > 0),
  unit_price_ghs numeric(12,2) not null check (unit_price_ghs >= 0),

  created_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_sellers_campus on sellers(campus_id);
create index if not exists idx_sellers_status on sellers(status);
create index if not exists idx_products_seller on products(seller_id);
create index if not exists idx_products_campus on products(campus_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_orders_buyer on orders(buyer_user_id);
create index if not exists idx_orders_seller on orders(seller_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);

-- ---------- UPDATED_AT TRIGGER ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger tr_campuses_updated_at
  before update on campuses
  for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger tr_sellers_updated_at
  before update on sellers
  for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger tr_products_updated_at
  before update on products
  for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger tr_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

commit;
