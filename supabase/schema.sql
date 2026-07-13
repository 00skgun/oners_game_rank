create extension if not exists pgcrypto;
create table if not exists competitions(id uuid primary key default gen_random_uuid(),name text not null unique,game_type text not null check(game_type in('fc_online','lol')),status text not null default '진행 중',created_at timestamptz not null default now());
create table if not exists fc_players(id uuid primary key default gen_random_uuid(),name text not null unique,group_name text not null check(group_name in('A','B','C','D')),seed int not null check(seed>0),created_at timestamptz default now(),updated_at timestamptz default now(),unique(group_name,seed));
create table if not exists fc_matches(id bigint generated always as identity primary key,group_name text not null check(group_name in('A','B','C','D')),round_number int not null check(round_number between 1 and 3),player_a_id uuid not null references fc_players,player_b_id uuid not null references fc_players,player_a_score int check(player_a_score>=0),player_b_score int check(player_b_score>=0),status text not null default '미진행' check(status in('미진행','완료','기존 집계')),source_type text not null default 'seed',played_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now(),unique(group_name,round_number,player_a_id,player_b_id),check(player_a_id<>player_b_id));
create table if not exists fc_tournament_series(id uuid primary key default gen_random_uuid(),stage text not null,match_number int not null,player_a_id uuid references fc_players,player_b_id uuid references fc_players,required_wins int not null,winner_id uuid references fc_players,status text not null default '예정',unique(stage,match_number));
create table if not exists fc_tournament_games(id bigint generated always as identity primary key,series_id uuid not null references fc_tournament_series on delete cascade,game_number int not null,player_a_score int check(player_a_score>=0),player_b_score int check(player_b_score>=0),winner_id uuid references fc_players,unique(series_id,game_number));
create table if not exists lol_teams(id uuid primary key default gen_random_uuid(),name text not null unique,display_order int not null unique,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists lol_matches(id uuid primary key default gen_random_uuid(),team_a_id uuid not null references lol_teams,team_b_id uuid not null references lol_teams,scheduled_at timestamptz,status text not null default '예정' check(status in('예정','완료')),created_at timestamptz default now(),updated_at timestamptz default now(),check(team_a_id<>team_b_id));
create table if not exists lol_match_sets(id bigint generated always as identity primary key,match_id uuid not null references lol_matches on delete cascade,set_number int not null check(set_number between 1 and 3),team_a_kills int not null check(team_a_kills>=0),team_a_assists int not null check(team_a_assists>=0),team_b_kills int not null check(team_b_kills>=0),team_b_assists int not null check(team_b_assists>=0),winner_team_id uuid not null references lol_teams,created_at timestamptz default now(),updated_at timestamptz default now(),unique(match_id,set_number));

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select lower(coalesce(auth.jwt()->>'email',''))=lower(coalesce(current_setting('app.settings.admin_email',true),''))$$;
alter table competitions enable row level security;alter table fc_players enable row level security;alter table fc_matches enable row level security;alter table fc_tournament_series enable row level security;alter table fc_tournament_games enable row level security;alter table lol_teams enable row level security;alter table lol_matches enable row level security;alter table lol_match_sets enable row level security;
do $$ declare t text; begin foreach t in array array['competitions','fc_players','fc_matches','fc_tournament_series','fc_tournament_games','lol_teams','lol_matches','lol_match_sets'] loop execute format('drop policy if exists public_read on %I',t);execute format('create policy public_read on %I for select using (true)',t);execute format('drop policy if exists admin_write on %I',t);execute format('create policy admin_write on %I for all to authenticated using (public.is_admin()) with check (public.is_admin())',t);end loop;end $$;

update lol_teams set name='Team WIND',updated_at=now() where name='가천 WIND' and not exists(select 1 from lol_teams where name='Team WIND');
insert into lol_teams(name,display_order) values('Team WIND',1),('ONERS A',2),('ONERS B',3),('ONERS C',4) on conflict(name) do update set display_order=excluded.display_order;
insert into fc_players(name,group_name,seed) values('김규민','A',1),('이우빈','A',2),('정명원','A',3),('정민호','B',1),('최건영','B',2),('서혁준','B',3),('조영훈','C',1),('임정우','C',2),('김선호','C',3),('이태훈','D',1),('정유준','D',2),('윤인태','D',3) on conflict(name) do update set group_name=excluded.group_name,seed=excluded.seed,updated_at=now();

-- LoL format: four-team single round robin. Rank 1-2 play the final; rank 3-4 play the third-place match.
insert into competitions(name,game_type,status) values('ONERS CUP LoL','lol','진행 중') on conflict(name) do update set status=excluded.status;

-- 2026-07-12: the team containing skgun00 is ONERS B; its opponent is ONERS C.
-- The block is idempotent: rerunning this file updates the same match and its three sets.
do $$
declare
  b_id uuid;
  c_id uuid;
  v_match_id uuid;
begin
  select id into b_id from lol_teams where name='ONERS B';
  select id into c_id from lol_teams where name='ONERS C';
  select id into v_match_id from lol_matches where team_a_id=b_id and team_b_id=c_id order by created_at limit 1;

  if v_match_id is null then
    insert into lol_matches(team_a_id,team_b_id,scheduled_at,status)
    values(b_id,c_id,'2026-07-12 00:00:00+09','완료') returning id into v_match_id;
  else
    update lol_matches set scheduled_at='2026-07-12 00:00:00+09',status='완료',updated_at=now() where id=v_match_id;
  end if;

  insert into lol_match_sets(match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id)
  values
    (v_match_id,1,21,43,14,24,b_id),
    (v_match_id,2,16,34,23,39,c_id),
    (v_match_id,3,32,76,25,25,b_id)
  on conflict(match_id,set_number) do update set
    team_a_kills=excluded.team_a_kills,
    team_a_assists=excluded.team_a_assists,
    team_b_kills=excluded.team_b_kills,
    team_b_assists=excluded.team_b_assists,
    winner_team_id=excluded.winner_team_id,
    updated_at=now();
end $$;

-- 2026-07-13: the team containing 어루대 is ONERS A; its opponent is Team WIND.
do $$
declare
  a_id uuid;
  wind_id uuid;
  v_match_id uuid;
begin
  select id into a_id from lol_teams where name='ONERS A';
  select id into wind_id from lol_teams where name='Team WIND';
  select id into v_match_id from lol_matches where team_a_id=a_id and team_b_id=wind_id order by created_at limit 1;

  if v_match_id is null then
    insert into lol_matches(team_a_id,team_b_id,scheduled_at,status)
    values(a_id,wind_id,'2026-07-13 00:00:00+09','완료') returning id into v_match_id;
  else
    update lol_matches set scheduled_at='2026-07-13 00:00:00+09',status='완료',updated_at=now() where id=v_match_id;
  end if;

  insert into lol_match_sets(match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id)
  values
    (v_match_id,1,27,65,10,22,a_id),
    (v_match_id,2,23,39,4,4,a_id)
  on conflict(match_id,set_number) do update set
    team_a_kills=excluded.team_a_kills,
    team_a_assists=excluded.team_a_assists,
    team_b_kills=excluded.team_b_kills,
    team_b_assists=excluded.team_b_assists,
    winner_team_id=excluded.winner_team_id,
    updated_at=now();
end $$;
