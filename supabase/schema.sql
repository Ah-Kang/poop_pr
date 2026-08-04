create table if not exists public.users (
  kakao_id text primary key,
  nickname text not null,
  profile_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.scores enable row level security;
alter table public.game_saves enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.scores from anon, authenticated;
revoke all on public.game_saves from anon, authenticated;
