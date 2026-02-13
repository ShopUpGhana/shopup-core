begin;

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  campus_id uuid null references campuses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

drop policy if exists "user_profiles_select_owner" on user_profiles;
create policy "user_profiles_select_owner"
on user_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_profiles_insert_owner" on user_profiles;
create policy "user_profiles_insert_owner"
on user_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_profiles_update_owner" on user_profiles;
create policy "user_profiles_update_owner"
on user_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger tr_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();

commit;
