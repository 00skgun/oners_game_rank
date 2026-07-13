-- LoL roster and per-set player stats. Run after schema.sql and admin-access.sql.
create table if not exists public.lol_players(
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.lol_teams(id) on delete cascade,
  real_name text not null,
  nickname text not null,
  tag_line text not null,
  position text not null,
  display_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(nickname,tag_line)
);

create table if not exists public.lol_player_set_stats(
  id bigint generated always as identity primary key,
  set_id bigint not null references public.lol_match_sets(id) on delete cascade,
  player_id uuid not null references public.lol_players(id) on delete cascade,
  kills int not null default 0 check(kills>=0),
  deaths int not null default 0 check(deaths>=0),
  assists int not null default 0 check(assists>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(set_id,player_id)
);

alter table public.lol_players enable row level security;
alter table public.lol_player_set_stats enable row level security;
drop policy if exists public_read on public.lol_players;
create policy public_read on public.lol_players for select using(true);
drop policy if exists admin_write on public.lol_players;
create policy admin_write on public.lol_players for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists public_read on public.lol_player_set_stats;
create policy public_read on public.lol_player_set_stats for select using(true);
drop policy if exists admin_write on public.lol_player_set_stats;
create policy admin_write on public.lol_player_set_stats for all to authenticated using(public.is_admin()) with check(public.is_admin());

with roster(team_name,position,real_name,nickname,tag_line,display_order) as (values
 ('Team WIND','탑','최병준','달달한우리팀','KR1',1),('Team WIND','정글','김진륜','김진륜그는감히전설이라고할수있다','KR11',2),('Team WIND','미드','정석환','avengersVSthanos','KR1',3),('Team WIND','원딜','김민규','min9o','KR1',4),('Team WIND','서폿','최선','최선을다하자','BEST',5),
 ('ONERS A','탑','차윤혁','적챔피언을처단할데마시아의힘소환','궁극기',1),('ONERS A','정글','김지우','뜨극뜨극','0420',2),('ONERS A','미드/서폿','한서준','2CaCO3','KR1',3),('ONERS A','원딜','김규민','이이규댕','댕댕댕',4),('ONERS A','서폿/미드','이현우','어루대','KR1',5),
 ('ONERS B','탑','김재원','나는거장이다','KR1',1),('ONERS B','정글','윤동현','Classe','KR711',2),('ONERS B','미드','최건영','skgun00','KR1',3),('ONERS B','원딜','박유준','보성말차','KR11',4),('ONERS B','서폿','문영서','쥰옹두천','0902',5),
 ('ONERS C','탑','신승원','빡쳐서뒤돌아보지마','liam',1),('ONERS C','정글','김도연','은경자','KR1',2),('ONERS C','미드','배수빈','삼봉봉','JYP',3),('ONERS C','원딜','이수영','롤한판하고접음','KR1',4),('ONERS C','서폿','안재정','무적해병상승해병귀신잡는해병대','안재정',5)
)
insert into public.lol_players(team_id,position,real_name,nickname,tag_line,display_order)
select t.id,r.position,r.real_name,r.nickname,r.tag_line,r.display_order from roster r join public.lol_teams t on t.name=r.team_name
on conflict(nickname,tag_line) do update set team_id=excluded.team_id,position=excluded.position,real_name=excluded.real_name,display_order=excluded.display_order,updated_at=now();

with raw(team_a,team_b,set_number,nickname,kills,deaths,assists) as (values
 ('ONERS B','ONERS C',1,'나는거장이다',6,2,1),('ONERS B','ONERS C',1,'Classe',1,1,16),('ONERS B','ONERS C',1,'skgun00',9,2,5),('ONERS B','ONERS C',1,'보성말차',5,5,6),('ONERS B','ONERS C',1,'쥰옹두천',0,4,15),
 ('ONERS B','ONERS C',1,'빡쳐서뒤돌아보지마',4,4,4),('ONERS B','ONERS C',1,'은경자',5,3,3),('ONERS B','ONERS C',1,'삼봉봉',3,3,1),('ONERS B','ONERS C',1,'롤한판하고접음',2,6,7),('ONERS B','ONERS C',1,'무적해병상승해병귀신잡는해병대',0,5,9),
 ('ONERS B','ONERS C',2,'나는거장이다',4,5,6),('ONERS B','ONERS C',2,'Classe',1,6,9),('ONERS B','ONERS C',2,'skgun00',5,5,4),('ONERS B','ONERS C',2,'보성말차',6,5,4),('ONERS B','ONERS C',2,'쥰옹두천',0,3,11),
 ('ONERS B','ONERS C',2,'빡쳐서뒤돌아보지마',13,3,5),('ONERS B','ONERS C',2,'은경자',2,1,4),('ONERS B','ONERS C',2,'삼봉봉',2,3,8),('ONERS B','ONERS C',2,'롤한판하고접음',6,5,7),('ONERS B','ONERS C',2,'무적해병상승해병귀신잡는해병대',0,4,15),
 ('ONERS B','ONERS C',3,'나는거장이다',5,2,18),('ONERS B','ONERS C',3,'Classe',8,6,15),('ONERS B','ONERS C',3,'skgun00',6,8,9),('ONERS B','ONERS C',3,'보성말차',13,4,12),('ONERS B','ONERS C',3,'쥰옹두천',0,5,22),
 ('ONERS B','ONERS C',3,'빡쳐서뒤돌아보지마',8,8,4),('ONERS B','ONERS C',3,'은경자',2,4,6),('ONERS B','ONERS C',3,'삼봉봉',0,5,11),('ONERS B','ONERS C',3,'롤한판하고접음',9,4,3),('ONERS B','ONERS C',3,'무적해병상승해병귀신잡는해병대',6,11,1),
 ('ONERS A','Team WIND',1,'적챔피언을처단할데마시아의힘소환',4,1,11),('ONERS A','Team WIND',1,'뜨극뜨극',13,1,11),('ONERS A','Team WIND',1,'2CaCO3',3,2,7),('ONERS A','Team WIND',1,'이이규댕',5,3,15),('ONERS A','Team WIND',1,'어루대',2,3,21),
 ('ONERS A','Team WIND',1,'달달한우리팀',1,3,3),('ONERS A','Team WIND',1,'김진륜그는감히전설이라고할수있다',0,4,6),('ONERS A','Team WIND',1,'avengersVSthanos',3,5,3),('ONERS A','Team WIND',1,'min9o',4,5,3),('ONERS A','Team WIND',1,'최선을다하자',2,10,7),
 ('ONERS A','Team WIND',2,'적챔피언을처단할데마시아의힘소환',5,0,5),('ONERS A','Team WIND',2,'뜨극뜨극',6,1,7),('ONERS A','Team WIND',2,'2CaCO3',6,1,9),('ONERS A','Team WIND',2,'이이규댕',6,2,4),('ONERS A','Team WIND',2,'어루대',0,0,14),
 ('ONERS A','Team WIND',2,'달달한우리팀',1,5,0),('ONERS A','Team WIND',2,'김진륜그는감히전설이라고할수있다',1,3,1),('ONERS A','Team WIND',2,'avengersVSthanos',0,6,1),('ONERS A','Team WIND',2,'min9o',2,4,0),('ONERS A','Team WIND',2,'최선을다하자',0,5,2)
)
insert into public.lol_player_set_stats(set_id,player_id,kills,deaths,assists)
select s.id,p.id,r.kills,r.deaths,r.assists from raw r
join public.lol_teams ta on ta.name=r.team_a join public.lol_teams tb on tb.name=r.team_b
join public.lol_matches m on m.team_a_id=ta.id and m.team_b_id=tb.id
join public.lol_match_sets s on s.match_id=m.id and s.set_number=r.set_number
join public.lol_players p on p.nickname=r.nickname
on conflict(set_id,player_id) do update set kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,updated_at=now();
