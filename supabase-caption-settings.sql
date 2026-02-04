create table if not exists public.caption_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tiktok_rules text[] not null default '{}',
  instagram_rules text[] not null default '{}',
  tiktok_caption text not null,
  instagram_caption text not null,
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
