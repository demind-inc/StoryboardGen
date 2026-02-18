-- EmailGuard-style normalization guard for Supabase Auth
-- Prevents duplicate auth.users emails that normalize to the same value
-- (e.g. aaa@gmail.com and aaa+test@gmail.com)

create schema if not exists private;

create or replace function private.normalize_auth_email(raw_email text)
returns text
language plpgsql
immutable
as $$
declare
  normalized_email text;
  local_part text;
  domain_part text;
begin
  if raw_email is null then
    return null;
  end if;

  normalized_email := lower(trim(raw_email));

  if position('@' in normalized_email) = 0 then
    return normalized_email;
  end if;

  local_part := split_part(normalized_email, '@', 1);
  domain_part := split_part(normalized_email, '@', 2);

  -- Strip plus-addressing for all domains (e.g. user+tag@any.com -> user@any.com)
  local_part := split_part(local_part, '+', 1);

  if domain_part in ('gmail.com', 'googlemail.com') then
    return local_part || '@gmail.com';
  end if;

  return local_part || '@' || domain_part;
end;
$$;

-- Callable by the app to enforce normalized-email uniqueness before sign-up.
-- Requires the creating role to have SELECT on auth.users (postgres usually does).
-- Returns true if no user exists with that normalized email, false if taken.
create or replace function public.is_normalized_email_available(raw_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  norm text;
  found boolean;
begin
  if raw_email is null or trim(raw_email) = '' then
    return false;
  end if;
  norm := private.normalize_auth_email(trim(raw_email));
  if norm is null then
    return false;
  end if;
  select exists(
    select 1 from auth.users u
    where private.normalize_auth_email(u.email) = norm
  ) into found;
  return not found;
end;
$$;

comment on function public.is_normalized_email_available(text) is
  'Returns true if no auth.users row has the same normalized email (used before sign-up).';

grant execute on function public.is_normalized_email_available(text) to anon;
grant execute on function public.is_normalized_email_available(text) to authenticated;

-- Unique index on auth.users requires ownership of that table (supabase_auth_admin).
-- Run the index separately: see supabase-emailguard-index.sql and run it in
-- Supabase Dashboard SQL Editor (often has sufficient privileges).
