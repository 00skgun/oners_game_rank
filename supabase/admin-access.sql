-- Run once after creating the administrator in Authentication > Users.
-- The oldest Auth user is registered as the single administrator.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users(user_id,email)
select id,lower(email) from auth.users where email is not null order by created_at limit 1
on conflict(user_id) do update set email=excluded.email;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.admin_users
    where user_id=auth.uid()
      and email=lower(coalesce(auth.jwt()->>'email',''))
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

drop policy if exists admin_read_self on public.admin_users;
create policy admin_read_self on public.admin_users for select to authenticated
using(user_id=auth.uid());

do $$
declare t text;
begin
  foreach t in array array['competitions','fc_players','fc_matches','fc_tournament_series','fc_tournament_games','lol_teams','lol_matches','lol_match_sets'] loop
    execute format('drop policy if exists admin_write on %I',t);
    execute format('create policy admin_write on %I for all to authenticated using (public.is_admin()) with check (public.is_admin())',t);
  end loop;
end $$;

-- Create all 36 FC group fixtures if they do not exist yet.
insert into public.fc_matches(group_name,round_number,player_a_id,player_b_id,status,source_type)
select a.group_name,r.n,a.id,b.id,
  case when a.name='정민호' and b.name='최건영' then '기존 집계' else '미진행' end,
  'seed'
from public.fc_players a
join public.fc_players b on b.group_name=a.group_name and b.seed>a.seed
cross join generate_series(1,3) r(n)
on conflict(group_name,round_number,player_a_id,player_b_id) do nothing;

-- Apply the completed FC scores extracted from the workbook.
with scores(group_name,round_number,a_name,b_name,a_score,b_score) as (values
  ('A',1,'김규민','이우빈',2,2),('A',2,'김규민','이우빈',3,1),('A',3,'김규민','이우빈',2,2),
  ('A',1,'김규민','정명원',3,1),('A',2,'김규민','정명원',0,0),('A',3,'김규민','정명원',3,3),
  ('A',1,'이우빈','정명원',3,1),('A',2,'이우빈','정명원',3,2),('A',3,'이우빈','정명원',6,3),
  ('C',1,'조영훈','임정우',1,1),('C',2,'조영훈','임정우',0,1),('C',3,'조영훈','임정우',1,2),
  ('D',1,'이태훈','정유준',4,2),('D',2,'이태훈','정유준',8,1),('D',3,'이태훈','정유준',3,1),
  ('D',1,'이태훈','윤인태',4,1),('D',2,'이태훈','윤인태',4,1),('D',3,'이태훈','윤인태',3,1)
)
update public.fc_matches m set
  player_a_score=s.a_score,player_b_score=s.b_score,status='완료',played_at=coalesce(m.played_at,now()),updated_at=now()
from scores s
join public.fc_players a on a.name=s.a_name
join public.fc_players b on b.name=s.b_name
where m.group_name=s.group_name and m.round_number=s.round_number and m.player_a_id=a.id and m.player_b_id=b.id;
