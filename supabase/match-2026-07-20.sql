-- ONERS B 0:2 Team WIND, played 2026-07-20. Safe to run repeatedly.
do $$
declare
  b_id uuid;
  wind_id uuid;
  v_match_id uuid;
begin
  select id into b_id from public.lol_teams where name='ONERS B';
  select id into wind_id from public.lol_teams where name='Team WIND';

  select id into v_match_id from public.lol_matches
   where ((team_a_id=b_id and team_b_id=wind_id) or (team_a_id=wind_id and team_b_id=b_id))
     and (scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-20'
   order by created_at limit 1;

  if v_match_id is null then
    insert into public.lol_matches(team_a_id,team_b_id,scheduled_at,status)
    values(b_id,wind_id,'2026-07-20 00:00:00+09','완료') returning id into v_match_id;
  else
    update public.lol_matches set team_a_id=b_id,team_b_id=wind_id,status='완료',updated_at=now()
     where id=v_match_id;
  end if;

  insert into public.lol_match_sets(match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id)
  values
    (v_match_id,1,8,11,26,41,wind_id),
    (v_match_id,2,5,6,21,45,wind_id)
  on conflict(match_id,set_number) do update set
    team_a_kills=excluded.team_a_kills,team_a_assists=excluded.team_a_assists,
    team_b_kills=excluded.team_b_kills,team_b_assists=excluded.team_b_assists,
    winner_team_id=excluded.winner_team_id,updated_at=now();
end $$;

with raw(set_number,nickname,kills,deaths,assists) as (values
 (1,'skgun00',2,7,1),(1,'나는거장이다',2,3,1),(1,'Classe',1,5,3),(1,'보성말차',2,5,2),(1,'쥬옹두천',1,6,4),
 (1,'avengersVSthanos',4,3,3),(1,'김진륜그는감히전설이라고할수있다',3,0,11),(1,'달달한우리팀',6,1,8),(1,'min9o',12,2,6),(1,'최선을다하자',1,2,13),
 (2,'skgun00',2,6,1),(2,'나는거장이다',1,3,0),(2,'Classe',2,5,2),(2,'보성말차',0,3,2),(2,'쥬옹두천',0,4,1),
 (2,'avengersVSthanos',1,1,8),(2,'김진륜그는감히전설이라고할수있다',9,1,6),(2,'달달한우리팀',5,2,9),(2,'min9o',6,0,8),(2,'최선을다하자',0,1,14)
), target as (
 select m.id from public.lol_matches m
 join public.lol_teams b on b.id=m.team_a_id and b.name='ONERS B'
 join public.lol_teams w on w.id=m.team_b_id and w.name='Team WIND'
 where (m.scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-20'
 order by m.created_at limit 1
)
insert into public.lol_player_set_stats(set_id,player_id,kills,deaths,assists)
select s.id,p.id,r.kills,r.deaths,r.assists from raw r cross join target t
join public.lol_match_sets s on s.match_id=t.id and s.set_number=r.set_number
join public.lol_players p on p.nickname=r.nickname
on conflict(set_id,player_id) do update set
  kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,updated_at=now();
