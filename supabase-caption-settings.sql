-- Caption settings table (create if not exists).
-- If caption_settings already exists, run supabase-caption-settings-migration.sql instead to add missing columns.

create table if not exists public.caption_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tiktok_rules jsonb not null default '[]'::jsonb,
  instagram_rules jsonb not null default '[]'::jsonb,
  custom_guidelines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: keep updated_at current (run once to create the trigger)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_caption_settings_updated_at on public.caption_settings;
create trigger set_caption_settings_updated_at
before update on public.caption_settings
for each row execute procedure public.set_updated_at();
