-- Fix: "new row violates row-level security policy (USING expression) for table project_outputs"
-- Run this in Supabase SQL Editor. Safe to run multiple times (drops then recreates the policy).

drop policy if exists "Users can update own project outputs" on public.project_outputs;

create policy "Users can update own project outputs"
  on public.project_outputs for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_outputs.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_outputs.project_id
        and projects.user_id = auth.uid()
    )
  );
