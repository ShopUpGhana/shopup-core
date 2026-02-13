begin;

-- Enable RLS
alter table campuses enable row level security;
alter table sellers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- ---------- CAMPUSES ----------
-- Everyone can read campus list (public discovery)
drop policy if exists "campuses_select_public" on campuses;
create policy "campuses_select_public"
on campuses for select
to public
using (is_active = true);

-- Only authenticated users can insert/update campuses (you can tighten to admin later)
drop policy if exists "campuses_write_authenticated" on campuses;
create policy "campuses_write_authenticated"
on campuses for all
to authenticated
using (true)
with check (true);

-- ---------- SELLERS ----------
-- Owner can read their own seller profile (full row)
drop policy if exists "sellers_select_owner" on sellers;
create policy "sellers_select_owner"
on sellers for select
to authenticated
using (user_id = auth.uid());

-- Owner can insert their own seller profile (1-to-1)
drop policy if exists "sellers_insert_owner" on sellers;
create policy "sellers_insert_owner"
on sellers for insert
to authenticated
with check (user_id = auth.uid());

-- Owner can update their own seller profile
drop policy if exists "sellers_update_owner" on sellers;
create policy "sellers_update_owner"
on sellers for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Public can read LIMITED seller info, but only if approved
-- NOTE: This allows select on the row; clients should select only safe columns.
-- If you want hard safety, we’ll add a dedicated view later.
drop policy if exists "sellers_select_public_approved" on sellers;
create policy "sellers_select_public_approved"
on sellers for select
to public
using (status = 'approved');

-- ---------- PRODUCTS ----------
-- Public can read published & available products where seller is approved
drop policy if exists "products_select_public_published" on products;
create policy "products_select_public_published"
on products for select
to public
using (
  status = 'published'
  and is_available = true
  and exists (
    select 1
    from sellers s
    where s.id = products.seller_id
      and s.status = 'approved'
  )
);

-- Seller can read their own products (all statuses)
drop policy if exists "products_select_owner" on products;
create policy "products_select_owner"
on products for select
to authenticated
using (
  exists (
    select 1 from sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
);

-- Seller can insert products only for their seller_id
drop policy if exists "products_insert_owner" on products;
create policy "products_insert_owner"
on products for insert
to authenticated
with check (
  exists (
    select 1 from sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
);

-- Seller can update/delete their products
drop policy if exists "products_update_owner" on products;
create policy "products_update_owner"
on products for update
to authenticated
using (
  exists (
    select 1 from sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "products_delete_owner" on products;
create policy "products_delete_owner"
on products for delete
to authenticated
using (
  exists (
    select 1 from sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
);

-- ---------- ORDERS ----------
-- Buyer can read their orders
drop policy if exists "orders_select_buyer" on orders;
create policy "orders_select_buyer"
on orders for select
to authenticated
using (buyer_user_id = auth.uid());

-- Seller can read orders placed to them
drop policy if exists "orders_select_seller" on orders;
create policy "orders_select_seller"
on orders for select
to authenticated
using (
  exists (
    select 1 from sellers s
    where s.id = orders.seller_id
      and s.user_id = auth.uid()
  )
);

-- Buyer can create an order (low friction)
drop policy if exists "orders_insert_buyer" on orders;
create policy "orders_insert_buyer"
on orders for insert
to authenticated
with check (buyer_user_id = auth.uid());

-- Buyer can cancel their own order while still requested/accepted (optional)
drop policy if exists "orders_update_buyer_limited" on orders;
create policy "orders_update_buyer_limited"
on orders for update
to authenticated
using (buyer_user_id = auth.uid())
with check (
  buyer_user_id = auth.uid()
  and status in ('requested', 'accepted', 'cancelled')
);

-- Seller can update status (accept/reject/complete)
drop policy if exists "orders_update_seller" on orders;
create policy "orders_update_seller"
on orders for update
to authenticated
using (
  exists (
    select 1 from sellers s
    where s.id = orders.seller_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from sellers s
    where s.id = orders.seller_id
      and s.user_id = auth.uid()
  )
);

-- ---------- ORDER ITEMS ----------
-- Buyer can read items for their orders
drop policy if exists "order_items_select_buyer" on order_items;
create policy "order_items_select_buyer"
on order_items for select
to authenticated
using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- Seller can read items for orders placed to them
drop policy if exists "order_items_select_seller" on order_items;
create policy "order_items_select_seller"
on order_items for select
to authenticated
using (
  exists (
    select 1 from orders o
    join sellers s on s.id = o.seller_id
    where o.id = order_items.order_id
      and s.user_id = auth.uid()
  )
);

-- Buyer can add items only to their own orders
drop policy if exists "order_items_insert_buyer" on order_items;
create policy "order_items_insert_buyer"
on order_items for insert
to authenticated
with check (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.buyer_user_id = auth.uid()
  )
);

-- Buyer can delete/edit items only while order is requested (optional control)
drop policy if exists "order_items_update_buyer_requested" on order_items;
create policy "order_items_update_buyer_requested"
on order_items for update
to authenticated
using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.buyer_user_id = auth.uid()
      and o.status = 'requested'
  )
)
with check (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.buyer_user_id = auth.uid()
      and o.status = 'requested'
  )
);

drop policy if exists "order_items_delete_buyer_requested" on order_items;
create policy "order_items_delete_buyer_requested"
on order_items for delete
to authenticated
using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.buyer_user_id = auth.uid()
      and o.status = 'requested'
  )
);

commit;
