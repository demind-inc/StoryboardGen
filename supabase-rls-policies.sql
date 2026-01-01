-- Row-Level Security (RLS) Policies for Multi-Image Generator
-- Run this SQL script in your Supabase SQL editor after creating the tables

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.usage_limits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reference_library enable row level security;
alter table public.prompt_library enable row level security;

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
