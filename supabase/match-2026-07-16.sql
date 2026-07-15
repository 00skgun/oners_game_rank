-- ONERS A 2:0 ONERS C, played 2026-07-16. Safe to run repeatedly.
do $$
declare
  a_id uuid;
  c_id uuid;
  v_match_id uuid;
begin
  select id into a_id from public.lol_teams where name='ONERS A';
  select id into c_id from public.lol_teams where name='ONERS C';
  select id into v_match_id from public.lol_matches
   where team_a_id=a_id and team_b_id=c_id
     and (scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-16'
   order by created_at limit 1;
  if v_match_id is null then
    insert into public.lol_matches(team_a_id,team_b_id,scheduled_at,status)
    values(a_id,c_id,'2026-07-16 00:00:00+09','완료') returning id into v_match_id;
  else
    update public.lol_matches set status='완료',updated_at=now() where id=v_match_id;
  end if;
  insert into public.lol_match_sets(match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id)
  values(v_match_id,1,35,48,8,15,a_id),(v_match_id,2,33,42,11,14,a_id)
  on conflict(match_id,set_number) do update set
    team_a_kills=excluded.team_a_kills,team_a_assists=excluded.team_a_assists,
    team_b_kills=excluded.team_b_kills,team_b_assists=excluded.team_b_assists,
    winner_team_id=excluded.winner_team_id,updated_at=now();
end $$;

with raw(set_number,nickname,kills,deaths,assists) as (values
 (1,'어루대',0,3,19),(1,'적챔피언을처단할데마시아의힘소환',8,1,3),(1,'뜨극뜨극',6,2,14),(1,'2CaCO3',5,1,6),(1,'이이규댕',16,1,6),
 (1,'빡쳐서뒤돌아보지마',1,6,2),(1,'은경자',3,8,1),(1,'삼봉봉',0,5,4),(1,'롤한판하고접음',3,6,2),(1,'무적해병상승해병귀신잡는해병대',1,10,6),
 (2,'어루대',10,4,6),(2,'적챔피언을처단할데마시아의힘소환',4,1,4),(2,'뜨극뜨극',7,1,13),(2,'이이규댕',11,3,5),(2,'2CaCO3',1,2,14),
 (2,'빡쳐서뒤돌아보지마',3,6,0),(2,'은경자',1,6,4),(2,'삼봉봉',3,9,2),(2,'롤한판하고접음',2,6,4),(2,'무적해병상승해병귀신잡는해병대',2,6,4)
), target as (
 select m.id from public.lol_matches m
 join public.lol_teams a on a.id=m.team_a_id and a.name='ONERS A'
 join public.lol_teams c on c.id=m.team_b_id and c.name='ONERS C'
 where (m.scheduled_at at time zone 'Asia/Seoul')::date=date '2026-07-16'
 order by m.created_at limit 1
)
insert into public.lol_player_set_stats(set_id,player_id,kills,deaths,assists)
select s.id,p.id,r.kills,r.deaths,r.assists from raw r cross join target t
join public.lol_match_sets s on s.match_id=t.id and s.set_number=r.set_number
join public.lol_players p on p.nickname=r.nickname
on conflict(set_id,player_id) do update set kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,updated_at=now();
