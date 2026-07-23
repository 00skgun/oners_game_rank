-- ONERS B 0:2 ONERS A, played 2026-07-23. Safe to run repeatedly.
do $$
declare
  b_id uuid;
  a_id uuid;
  v_match_id uuid;
begin
  select id into b_id from public.lol_teams where name='ONERS B';
  select id into a_id from public.lol_teams where name='ONERS A';
  select id into v_match_id from public.lol_matches
   where ((team_a_id=b_id and team_b_id=a_id) or (team_a_id=a_id and team_b_id=b_id))
     and (scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-23'
   order by created_at limit 1;
  if v_match_id is null then
    insert into public.lol_matches(team_a_id,team_b_id,scheduled_at,status)
    values(b_id,a_id,'2026-07-23 00:00:00+09','완료') returning id into v_match_id;
  else
    update public.lol_matches set team_a_id=b_id,team_b_id=a_id,status='완료',updated_at=now()
     where id=v_match_id;
  end if;
  insert into public.lol_match_sets(match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id)
  values(v_match_id,1,26,29,35,60,a_id),(v_match_id,2,28,51,28,43,a_id)
  on conflict(match_id,set_number) do update set
    team_a_kills=excluded.team_a_kills,team_a_assists=excluded.team_a_assists,
    team_b_kills=excluded.team_b_kills,team_b_assists=excluded.team_b_assists,
    winner_team_id=excluded.winner_team_id,updated_at=now();
end $$;

update public.lol_players
set nickname='무지성칼두기',updated_at=now()
where team_id=(select id from public.lol_teams where name='ONERS A') and real_name='김지우';

with raw(set_number,real_name,kills,deaths,assists) as (values
 (1,'최건영',13,8,1),(1,'김재원',8,6,2),(1,'윤동현',1,9,7),(1,'박유준',4,6,7),(1,'문영서',0,6,12),
 (1,'차윤혁',6,4,9),(1,'김지우',15,3,10),(1,'이현우',8,7,9),(1,'김규민',6,6,11),(1,'한서준',0,6,21),
 (2,'최건영',5,6,7),(2,'김재원',2,7,4),(2,'윤동현',4,8,16),(2,'박유준',14,4,6),(2,'문영서',3,3,18),
 (2,'차윤혁',10,5,6),(2,'김지우',8,5,8),(2,'한서준',3,6,7),(2,'김규민',7,4,8),(2,'이현우',0,8,14)
), target as (
 select m.id from public.lol_matches m
 join public.lol_teams b on b.id=m.team_a_id and b.name='ONERS B'
 join public.lol_teams a on a.id=m.team_b_id and a.name='ONERS A'
 where (m.scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-23'
 order by m.created_at limit 1
)
insert into public.lol_player_set_stats(set_id,player_id,kills,deaths,assists)
select s.id,p.id,r.kills,r.deaths,r.assists from raw r cross join target t
join public.lol_match_sets s on s.match_id=t.id and s.set_number=r.set_number
join public.lol_players p on p.real_name=r.real_name
on conflict(set_id,player_id) do update set
  kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,updated_at=now();
