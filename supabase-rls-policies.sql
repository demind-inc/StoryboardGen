-- Row-Level Security (RLS) Policies for Multi-Image Generator
-- Run this SQL script in your Supabase SQL editor after creating the tables

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.usage_limits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reference_library enable row level security;
alter table public.prompt_library enable row level security;
alter table public.caption_settings enable row level security;

-- Projects & outputs (see supabase-projects.sql for table definitions)
alter table public.projects enable row level security;
alter table public.project_outputs enable row level security;

-- Upsert support: required for on_conflict=project_id,scene_index
create unique index if not exists project_outputs_project_id_scene_index_uidx
  on public.project_outputs(project_id, scene_index);

-- Profiles policies: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Usage limits policies: users can read/update their own usage
create policy "Users can view own usage"
  on public.usage_limits for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage_limits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage_limits for update
  using (auth.uid() = user_id);

-- Subscriptions policies: users can read/update their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Reference library policies: users can manage their own references
create policy "Users can view own references"
  on public.reference_library for select
  using (auth.uid() = user_id);

create policy "Users can insert own references"
  on public.reference_library for insert
  with check (auth.uid() = user_id);

create policy "Users can update own references"
  on public.reference_library for update
  using (auth.uid() = user_id);

create policy "Users can delete own references"
  on public.reference_library for delete
  using (auth.uid() = user_id);

-- Prompt library policies: users can manage their own prompts
create policy "Users can view own prompts"
  on public.prompt_library for select
  using (auth.uid() = user_id);

create policy "Users can insert own prompts"
  on public.prompt_library for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prompts"
  on public.prompt_library for update
  using (auth.uid() = user_id);

create policy "Users can delete own prompts"
  on public.prompt_library for delete
  using (auth.uid() = user_id);

-- Caption settings policies: users can read/insert/update their own settings
create policy "Users can view own caption settings"
  on public.caption_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own caption settings"
  on public.caption_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own caption settings"
  on public.caption_settings for update
  using (auth.uid() = user_id);
