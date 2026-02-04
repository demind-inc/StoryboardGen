-- Project storage schema for generated results
-- Run this SQL script in your Supabase SQL editor

-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  prompts text[] not null,
  tiktok_captions text[] not null default '{}',
  instagram_captions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create project outputs table
create table if not exists public.project_outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_index integer not null,
  prompt text not null,
  file_path text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_outputs_project_id_idx
  on public.project_outputs(project_id);

create index if not exists projects_user_id_idx
  on public.projects(user_id);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.project_outputs enable row level security;

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Project outputs policies (tied to project ownership)
create policy "Users can view own project outputs"
  on public.project_outputs for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_outputs.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project outputs"
  on public.project_outputs for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_outputs.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project outputs"
  on public.project_outputs for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_outputs.project_id
        and projects.user_id = auth.uid()
    )
  );

-- Storage bucket: project-outputs
-- Create the bucket in Supabase Storage if it doesn't exist
insert into storage.buckets (id, name, public)
values ('project-outputs', 'project-outputs', false)
on conflict (id) do nothing;

-- Storage policies for project-outputs bucket
create policy "Users can upload own project outputs"
  on storage.objects for insert
  with check (
    bucket_id = 'project-outputs' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own project outputs"
  on storage.objects for select
  using (
    bucket_id = 'project-outputs' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own project outputs"
  on storage.objects for delete
  using (
    bucket_id = 'project-outputs' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
