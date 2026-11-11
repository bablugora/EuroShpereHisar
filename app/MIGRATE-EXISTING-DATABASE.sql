-- Euro Sphere compatibility migration for the database already created in this project.
-- IMPORTANT: Run this in the DEVELOPMENT Supabase project only, after reviewing it.
-- It preserves existing course_access.level and quiz_results.points columns while adding
-- aliases expected by the current frontend. It does NOT grant any course access.

begin;

-- Profiles: frontend needs email for the admin student list. Role is never writable by students.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email
from auth.users u where u.id = p.id and (p.email is null or p.email = '');

-- course_access: the existing schema uses `level`; this frontend uses `course_level`.
alter table public.course_access add column if not exists course_level text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='course_access' and column_name='level'
  ) then
    execute 'update public.course_access set course_level = level::text where course_level is null';
  end if;
end $$;

create or replace function public.eurosphere_sync_course_access_level()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.course_level is not null then
    if new.course_level not in ('A1','A2','B1','B2','C1') then
      raise exception 'Invalid course level';
    end if;
    if new.level is null or new.level::text is distinct from new.course_level then
      new.level := new.course_level::public.course_level;
    end if;
  elsif new.level is not null then
    new.course_level := new.level::text;
  end if;
  return new;
end;
$$;
drop trigger if exists eurosphere_sync_course_access_level on public.course_access;
create trigger eurosphere_sync_course_access_level
before insert or update of level, course_level on public.course_access
for each row execute function public.eurosphere_sync_course_access_level();

-- Existing quiz_results uses points/correct_answers; frontend expects score/title.
alter table public.quiz_results add column if not exists score integer;
alter table public.quiz_results add column if not exists title text;
alter table public.quiz_results add column if not exists course_level text;
update public.quiz_results set score = coalesce(score, points, correct_answers, 0);
update public.quiz_results set title = coalesce(title, 'Course test');

-- Keep score and points aligned for older reports. Students are still not allowed to insert scores.
create or replace function public.eurosphere_sync_quiz_score()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.score is null then new.score := coalesce(new.points, new.correct_answers, 0); end if;
  if new.title is null then new.title := 'Course test'; end if;
  if new.course_level is not null and new.course_level not in ('A1','A2','B1','B2','C1') then
    raise exception 'Invalid course level';
  end if;
  return new;
end;
$$;
drop trigger if exists eurosphere_sync_quiz_score on public.quiz_results;
create trigger eurosphere_sync_quiz_score
before insert or update on public.quiz_results
for each row execute function public.eurosphere_sync_quiz_score();

-- Content and class tables used by the app. They are not auto-populated with public links.
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

alter table public.course_content enable row level security;
alter table public.live_classes enable row level security;

drop policy if exists "eurosphere_content_assigned_or_admin" on public.course_content;
create policy "eurosphere_content_assigned_or_admin" on public.course_content
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.course_access ca
    where ca.student_id = auth.uid() and coalesce(ca.course_level, ca.level::text) = course_content.course_level
  )
);
drop policy if exists "eurosphere_content_admin_insert" on public.course_content;
create policy "eurosphere_content_admin_insert" on public.course_content
for insert to authenticated with check (public.is_admin());
drop policy if exists "eurosphere_content_admin_delete" on public.course_content;
create policy "eurosphere_content_admin_delete" on public.course_content
for delete to authenticated using (public.is_admin());

drop policy if exists "eurosphere_classes_assigned_or_admin" on public.live_classes;
create policy "eurosphere_classes_assigned_or_admin" on public.live_classes
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.course_access ca
    where ca.student_id = auth.uid() and coalesce(ca.course_level, ca.level::text) = live_classes.course_level
  )
);
drop policy if exists "eurosphere_classes_admin_insert" on public.live_classes;
create policy "eurosphere_classes_admin_insert" on public.live_classes
for insert to authenticated with check (public.is_admin());
drop policy if exists "eurosphere_classes_admin_delete" on public.live_classes;
create policy "eurosphere_classes_admin_delete" on public.live_classes
for delete to authenticated using (public.is_admin());

grant select, insert, delete on public.course_content to authenticated;
grant select, insert, delete on public.live_classes to authenticated;
-- course_access management remains governed by the existing admin-only RLS policies.
-- No course rows are inserted here; all A1-C1 access remains as already configured.

commit;
