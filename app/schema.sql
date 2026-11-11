-- Euro Sphere database schema (Supabase / PostgreSQL)
-- Review this file before running it. Back up an existing database first.
-- This creates student profiles with NO automatic A1-C1 access.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  email text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_level text not null check (course_level in ('A1','A2','B1','B2','C1')),
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique(student_id, course_level)
);

create table if not exists public.course_content (
  id uuid primary key default gen_random_uuid(),
  course_level text not null check (course_level in ('A1','A2','B1','B2','C1')),
  content_type text not null check (content_type in ('daily','recorded','test','vocabulary','grammar','conversation','pronunciation','revision','exam')),
  title text not null,
  description text,
  resource_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  course_level text not null check (course_level in ('A1','A2','B1','B2','C1')),
  title text not null,
  starts_at timestamptz not null,
  teacher_name text,
  meeting_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_level text check (course_level in ('A1','A2','B1','B2','C1')),
  title text not null default 'Course test',
  score integer not null default 0 check (score >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, email, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,'student'),'@',1)), new.email, 'student')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.course_access enable row level security;
alter table public.course_content enable row level security;
alter table public.live_classes enable row level security;
alter table public.quiz_results enable row level security;

-- Profiles: users see their own record; admins can see all profiles.
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own_name" on public.profiles;
create policy "profiles_update_own_name" on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
-- Prevent ordinary authenticated users from changing the role field.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

-- Course access: student can read their own grants; only admin can manage grants.
drop policy if exists "course_access_select_self_or_admin" on public.course_access;
create policy "course_access_select_self_or_admin" on public.course_access for select to authenticated
using (student_id = auth.uid() or public.is_admin());
drop policy if exists "course_access_admin_insert" on public.course_access;
create policy "course_access_admin_insert" on public.course_access for insert to authenticated
with check (public.is_admin());
drop policy if exists "course_access_admin_delete" on public.course_access;
create policy "course_access_admin_delete" on public.course_access for delete to authenticated
using (public.is_admin());

-- Course content is only visible to students with access to that specific level, or admins.
drop policy if exists "course_content_select_if_assigned" on public.course_content;
create policy "course_content_select_if_assigned" on public.course_content for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.course_access ca where ca.student_id = auth.uid() and ca.course_level = course_content.course_level
));
drop policy if exists "course_content_admin_insert" on public.course_content;
create policy "course_content_admin_insert" on public.course_content for insert to authenticated
with check (public.is_admin());
drop policy if exists "course_content_admin_delete" on public.course_content;
create policy "course_content_admin_delete" on public.course_content for delete to authenticated
using (public.is_admin());

-- Live class schedule: only users with that level can read its meeting link; admins manage it.
drop policy if exists "live_classes_select_if_assigned" on public.live_classes;
create policy "live_classes_select_if_assigned" on public.live_classes for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.course_access ca where ca.student_id = auth.uid() and ca.course_level = live_classes.course_level
));
drop policy if exists "live_classes_admin_insert" on public.live_classes;
create policy "live_classes_admin_insert" on public.live_classes for insert to authenticated
with check (public.is_admin());
drop policy if exists "live_classes_admin_delete" on public.live_classes;
create policy "live_classes_admin_delete" on public.live_classes for delete to authenticated
using (public.is_admin());

-- Results are readable by the student and admin. Result insertion is admin-only for now,
-- because trustworthy test scoring needs a server-side grading function before enabling student submissions.
drop policy if exists "quiz_results_select_self_or_admin" on public.quiz_results;
create policy "quiz_results_select_self_or_admin" on public.quiz_results for select to authenticated
using (student_id = auth.uid() or public.is_admin());
drop policy if exists "quiz_results_admin_insert" on public.quiz_results;
create policy "quiz_results_admin_insert" on public.quiz_results for insert to authenticated
with check (public.is_admin());

grant select on public.course_access to authenticated;
grant insert, delete on public.course_access to authenticated;
grant select, insert, delete on public.course_content to authenticated;
grant select, insert, delete on public.live_classes to authenticated;
grant select on public.quiz_results to authenticated;
grant insert on public.quiz_results to authenticated;

-- IMPORTANT: After creating your own account, run the following ONE line in Supabase SQL Editor
-- to promote only the intended academy owner to admin. Replace the email if needed.
-- Do not add admin role assignment to frontend code.
-- update public.profiles set role = 'admin' where email = 'eurospherehisar@gmail.com';
