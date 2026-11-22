-- ============================================================
--  온라인 마음쉼터 — Supabase 테이블 설정
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

-- 1) 염원 테이블
create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  status      text not null default 'pending',  -- pending(검토중) / public(공개) / hidden(숨김)
  session_id  text,
  reported    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2) 방문 기록 테이블 (오늘 방문자 수 집계용)
create table if not exists public.visits (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
--  RLS(행 수준 보안) — 공개 키(anon)로 할 수 있는 일을 제한
-- ============================================================
alter table public.wishes enable row level security;
alter table public.visits enable row level security;

-- 염원: 누구나 '공개된 글'만 읽을 수 있음
create policy "read public wishes"
  on public.wishes for select
  using (status = 'public');

-- 염원: anon 직접 insert/update/delete 는 허용하지 않음
--   (저장은 서버리스 함수가 service_role 키로만 수행 → 검열을 반드시 거침)

-- 방문: 누구나 자기 방문 1건 기록 가능 + 집계용 조회 가능
create policy "insert own visit"  on public.visits for insert with check (true);
create policy "count visits"      on public.visits for select using (true);

-- 조회 속도용 인덱스
create index if not exists wishes_status_idx on public.wishes (status, created_at desc);
create index if not exists visits_created_idx on public.visits (created_at);
