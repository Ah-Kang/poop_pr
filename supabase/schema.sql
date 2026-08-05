create table if not exists public.users (
  kakao_id text primary key,
  nickname text not null,
  display_nickname text,
  profile_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists display_nickname text;

create table if not exists public.scores (
  kakao_id text primary key references public.users(kakao_id) on delete cascade,
  gold bigint not null default 0,
  dps bigint not null default 0,
  toilet_level integer not null default 0,
  poop_level integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_saves (
  kakao_id text primary key references public.users(kakao_id) on delete cascade,
  gold bigint not null default 0,
  toilet_level integer not null default 0,
  poop_levels jsonb not null default '[]'::jsonb,
  selected_poop_id integer not null default 0,
  item_levels jsonb not null default '[]'::jsonb,
  cosmetics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves
  add column if not exists cosmetics jsonb not null default '{}'::jsonb;

create table if not exists public.user_activity (
  kakao_id text primary key references public.users(kakao_id) on delete cascade,
  total_play_seconds bigint not null default 0,
  session_count integer not null default 0,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_activity (
  kakao_id text not null references public.users(kakao_id) on delete cascade,
  activity_date date not null default current_date,
  play_seconds bigint not null default 0,
  primary key (kakao_id, activity_date)
);

alter table public.users enable row level security;
alter table public.scores enable row level security;
alter table public.game_saves enable row level security;
alter table public.user_activity enable row level security;
alter table public.daily_activity enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.scores from anon, authenticated;
revoke all on public.game_saves from anon, authenticated;
revoke all on public.user_activity from anon, authenticated;
revoke all on public.daily_activity from anon, authenticated;
