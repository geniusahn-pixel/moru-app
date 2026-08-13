-- ─────────────────────────────────────────────────────────────
-- 온북(OnBook) 데이터베이스 스키마
--
-- Supabase 프로젝트에서 이 파일 전체를 한 번 실행하세요.
--   Supabase 대시보드 → SQL Editor → New query → 붙여넣기 → Run
--
-- 정책: "하나의 모임" — 로그인한(가입한) 사용자는 모든 책·모임·설정을
-- 함께 보고 편집할 수 있습니다. 비로그인 사용자는 접근 불가.
-- ─────────────────────────────────────────────────────────────

-- 책
create table if not exists public.books (
  id text primary key,
  title text not null default '',
  author text default '',
  cover text default '',
  status text default 'want',
  total_pages int default 0,
  current_page int default 0,
  start_date date,
  end_date date,
  rating int default 0,
  one_liner text default '',
  notes text default '',
  discussion text default '',
  meeting_id text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

-- 모임
create table if not exists public.meetings (
  id text primary key,
  title text not null default '',
  date date,
  place text default '',
  book_id text,
  memo text default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

-- 모임 공용 설정(연간 목표) — 단일 행(id = 'group')
create table if not exists public.settings (
  id text primary key,
  year int,
  target int
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.books enable row level security;
alter table public.meetings enable row level security;
alter table public.settings enable row level security;

-- 로그인한 사용자면 전부 허용 (하나의 모임 = 모두 공유)
do $$
begin
  -- books
  if not exists (select 1 from pg_policies where tablename='books' and policyname='books_all_authenticated') then
    create policy books_all_authenticated on public.books
      for all to authenticated using (true) with check (true);
  end if;
  -- meetings
  if not exists (select 1 from pg_policies where tablename='meetings' and policyname='meetings_all_authenticated') then
    create policy meetings_all_authenticated on public.meetings
      for all to authenticated using (true) with check (true);
  end if;
  -- settings
  if not exists (select 1 from pg_policies where tablename='settings' and policyname='settings_all_authenticated') then
    create policy settings_all_authenticated on public.settings
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- 실시간 동기화용 (변경 사항을 다른 접속자에게 즉시 전달)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'books'
  ) then
    alter publication supabase_realtime add table public.books;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'meetings'
  ) then
    alter publication supabase_realtime add table public.meetings;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'settings'
  ) then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;
