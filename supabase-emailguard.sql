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

  if domain_part in ('gmail.com', 'googlemail.com') then
    local_part := split_part(local_part, '+', 1);
    return local_part || '@gmail.com';
  end if;

  return local_part || '@' || domain_part;
end;
$$;

-- Unique index over normalized email enforces the guard in auth.users itself.
create unique index if not exists email_normalized_unique_idx
on auth.users (private.normalize_auth_email(email));
