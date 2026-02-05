-- Migration: update existing caption_settings table
-- Run this when caption_settings already exists and you need to add or align columns.
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).

-- Ensure table exists (no-op if it does)
create table if not exists public.caption_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tiktok_rules jsonb not null default '[]'::jsonb,
  instagram_rules jsonb not null default '[]'::jsonb,
  custom_guidelines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add missing columns to existing table (no-op if columns exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'caption_settings' and column_name = 'custom_guidelines'
  ) then
    alter table public.caption_settings add column custom_guidelines jsonb not null default '[]'::jsonb;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'caption_settings' and column_name = 'created_at'
  ) then
    alter table public.caption_settings add column created_at timestamptz not null default now();
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'caption_settings' and column_name = 'updated_at'
  ) then
    alter table public.caption_settings add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Ensure updated_at trigger exists
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
