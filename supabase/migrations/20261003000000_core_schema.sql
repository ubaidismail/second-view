-- Initial Second View schema. All public content is exposed through filtered views.
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'seeker' check (role in ('seeker','mentor','admin')),
  display_name text,
  created_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true
);
create table public.mentor_applications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  professional_title text not null check (char_length(professional_title) between 2 and 120),
  credential_type text not null check (char_length(credential_type) between 2 and 120),
  licensing_board text not null check (char_length(licensing_board) between 2 and 200),
  license_number text not null check (char_length(license_number) between 2 and 120),
  professional_email text not null,
  affiliation text,
  focus_areas text[] not null default '{}',
  proof_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  pseudonym text not null check (char_length(pseudonym) between 2 and 60),
  title text not null check (char_length(title) between 8 and 160),
  body text not null check (char_length(body) between 20 and 10000),
  sensitivity_veil boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  crisis_flag boolean not null default false,
  flag_reasons text[] not null default '{}',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  search tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))) stored,
  created_at timestamptz not null default now()
);
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 20 and 10000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_helpful boolean not null default false,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, mentor_id)
);
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 4000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','response','followup')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index posts_status_crisis_created_idx on public.posts(status, crisis_flag desc, created_at desc);
create index posts_search_idx on public.posts using gin(search);
create index responses_post_idx on public.responses(post_id);
create index reports_status_created_idx on public.reports(status, created_at desc);

create function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

create function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, role) values(new.id, 'seeker') on conflict(id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

create function public.set_post_crisis_flags()
returns trigger language plpgsql set search_path = ''
as $$
declare
  combined_text text := lower(coalesce(new.title,'') || ' ' || coalesce(new.body,''));
  matched_terms text[];
begin
  -- Starter keyword screen only. It is not a crisis assessment or a replacement
  -- for trained review and immediate crisis resources.
  select array_agg(term) into matched_terms
  from unnest(array[
    'suicide','suicidal','kill myself','end my life','want to die',
    'self harm','self-harm','hurt myself','overdose','being abused',
    'domestic violence','not safe at home'
  ]) as term
  where position(term in combined_text) > 0;
  new.crisis_flag := coalesce(cardinality(matched_terms),0) > 0;
  new.flag_reasons := coalesce(matched_terms,'{}');
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.created_at := now();
  return new;
end;
$$;
create trigger set_post_crisis_flags_before_insert before insert on public.posts
for each row execute procedure public.set_post_crisis_flags();

create function public.sync_mentor_role()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    update public.profiles
    set role = case when new.status = 'approved' then 'mentor' else 'seeker' end
    where id = new.user_id and role <> 'admin';
  end if;
  return new;
end;
$$;
create trigger sync_mentor_role_after_review after update of status on public.mentor_applications
for each row execute procedure public.sync_mentor_role();

create function public.mark_response_helpful(response_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.responses r set is_helpful = true
  from public.posts p
  where r.id = response_id and p.id = r.post_id
    and p.author_id = (select auth.uid()) and p.status = 'approved' and r.status = 'approved';
  if not found then raise exception 'Response not found or not available to this account'; end if;
end;
$$;
revoke all on function public.mark_response_helpful(uuid) from public;
grant execute on function public.mark_response_helpful(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.mentor_applications enable row level security;
alter table public.posts enable row level security;
alter table public.responses enable row level security;
alter table public.followups enable row level security;
alter table public.reports enable row level security;

revoke all on public.profiles, public.categories, public.mentor_applications, public.posts,
  public.responses, public.followups, public.reports from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select, insert on public.mentor_applications to authenticated;
grant update(status, reviewed_by, reviewed_at, rejection_reason) on public.mentor_applications to authenticated;
grant insert on public.posts to authenticated;
grant select (id, category_id, pseudonym, title, body, sensitivity_veil, status, created_at) on public.posts to authenticated;
grant update(status, reviewed_by, reviewed_at) on public.posts to authenticated;
grant select, insert on public.responses to authenticated;
grant update(status, reviewed_by, reviewed_at) on public.responses to authenticated;
grant select, insert on public.followups to authenticated;
grant update(status, reviewed_by, reviewed_at) on public.followups to authenticated;
grant insert on public.reports to authenticated;
grant select, update(status, reviewed_by, reviewed_at) on public.reports to authenticated;

create policy "Active categories are public" on public.categories for select to anon, authenticated
using (is_active or (select public.is_admin()));
create policy "Admins manage categories" on public.categories for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Users read own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Users update own display name" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Admins manage profiles" on public.profiles for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Applicants read own application" on public.mentor_applications for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users submit pending application" on public.mentor_applications for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "Admins review applications" on public.mentor_applications for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Authors and admins read base posts" on public.posts for select to authenticated
using (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "Authenticated users read approved base posts" on public.posts for select to authenticated
using (status = 'approved');
create policy "Seekers create pending posts" on public.posts for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (select role from public.profiles where id = (select auth.uid())) = 'seeker'
  and status = 'pending' and reviewed_by is null and reviewed_at is null
);
create policy "Admins review posts" on public.posts for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Mentors and admins read base responses" on public.responses for select to authenticated
using (mentor_id = (select auth.uid()) or (select public.is_admin()));
create policy "Approved mentors respond to approved posts" on public.responses for insert to authenticated
with check (
  mentor_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null
  and exists(select 1 from public.mentor_applications ma where ma.user_id = (select auth.uid()) and ma.status = 'approved')
  and exists(select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);
create policy "Admins review responses" on public.responses for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Authors and admins read base followups" on public.followups for select to authenticated
using (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "Post authors create one pending followup" on public.followups for insert to authenticated
with check (
  author_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null
  and exists(select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.status = 'approved')
);
create policy "Admins review followups" on public.followups for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Users submit own reports" on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and status = 'open' and reviewed_by is null and reviewed_at is null);
create policy "Admins read reports" on public.reports for select to authenticated
using ((select public.is_admin()));
create policy "Admins review reports" on public.reports for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- These owner-executed views expose approved content without account identifiers.
create view public.public_posts with (security_barrier = true) as
select p.id, p.category_id, c.name as category_name, p.pseudonym, p.title, p.body,
  p.sensitivity_veil, p.created_at
from public.posts p join public.categories c on c.id = p.category_id
where p.status = 'approved' and c.is_active;

create view public.public_responses with (security_barrier = true) as
select r.id, r.post_id, r.body, r.is_helpful, r.created_at,
  ma.full_name as mentor_name, ma.professional_title as mentor_title
from public.responses r
join public.posts p on p.id = r.post_id and p.status = 'approved'
join public.mentor_applications ma on ma.user_id = r.mentor_id and ma.status = 'approved'
where r.status = 'approved';

create view public.public_followups with (security_barrier = true) as
select f.id, f.post_id, p.pseudonym, f.body, f.created_at
from public.followups f join public.posts p on p.id = f.post_id and p.status = 'approved'
where f.status = 'approved';
grant select on public.public_posts, public.public_responses, public.public_followups to anon, authenticated;

-- Moderator queue metadata is available only to authenticated admins and omits author_id.
create view public.admin_post_queue with (security_barrier = true) as
select p.id, p.category_id, p.pseudonym, p.title, p.body, p.crisis_flag,
  p.flag_reasons, p.status, p.created_at
from public.posts p
where p.status = 'pending' and (select public.is_admin());
grant select on public.admin_post_queue to authenticated;

insert into public.categories(name, slug) values
  ('Career & Purpose','career-purpose'),
  ('Emotional Wellbeing','emotional-wellbeing'),
  ('Identity','identity'),
  ('Grief & Transitions','grief-transitions'),
  ('Relationships','relationships')
on conflict(slug) do nothing;

-- Credential documents are private and scoped to the uploader's user folder.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('mentor-proof','mentor-proof',false,10485760,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/png','image/jpeg'];
create policy "Applicants upload own proof" on storage.objects for insert to authenticated
with check (bucket_id = 'mentor-proof' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Applicants and admins read proof" on storage.objects for select to authenticated
using (bucket_id = 'mentor-proof' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "Applicants and admins update proof" on storage.objects for update to authenticated
using (bucket_id = 'mentor-proof' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())))
with check (bucket_id = 'mentor-proof' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "Applicants and admins delete proof" on storage.objects for delete to authenticated
using (bucket_id = 'mentor-proof' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

comment on function public.set_post_crisis_flags() is
'Starter keyword routing only; not a complete crisis detector. Keep all posts pending human review.';
comment on view public.public_posts is
'Approved, active-category posts without author_id or internal moderation metadata.';

-- Bootstrap the first admin through the Supabase SQL Editor after that account signs up:
-- update public.profiles set role = 'admin' where id = '<your auth.users UUID>';
