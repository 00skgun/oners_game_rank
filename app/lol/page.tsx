'use client';

import {useEffect,useState} from 'react';
import {lolMatches as fallbackMatches,lolStats as fallbackStats,lolTeams as fallbackTeams} from '@/lib/data';
import {rankLol} from '@/lib/rankings/lol-ranking';
import {averageKills,kda,type LolStat} from '@/lib/rankings/lol-stats';
import {killParticipation,lolPlayers,playerKda} from '@/lib/lol-players';
import {createBrowserSupabase} from '@/lib/supabase/browser';

type PublicMatch={a:string;b:string;aw:number;bw:number;status:'완료';playedAt:string};

export default function Lol(){
  const [teams,setTeams]=useState<string[]>(fallbackTeams),[matches,setMatches]=useState<PublicMatch[]>(fallbackMatches),[teamStats,setTeamStats]=useState<LolStat[]>(fallbackStats);
  useEffect(()=>{const supabase=createBrowserSupabase();if(!supabase)return;Promise.all([
    supabase.from('lol_teams').select('id,name').order('display_order'),
    supabase.from('lol_matches').select('id,team_a_id,team_b_id,scheduled_at,status'),
    supabase.from('lol_match_sets').select('match_id,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id'),
  ]).then(([t,m,s])=>{if(!t.data?.length||!m.data?.length||!s.data?.length)return;const names=new Map(t.data.map(x=>[x.id,x.name]));const stats=new Map<string,LolStat>(t.data.map(x=>[x.id,{name:x.name,sets:0,kills:0,deaths:0,assists:0}]));const publicMatches:PublicMatch[]=[];for(const match of m.data){const sets=s.data.filter(x=>x.match_id===match.id);if(!sets.length)continue;let aw=0,bw=0;for(const set of sets){if(set.winner_team_id===match.team_a_id)aw++;else if(set.winner_team_id===match.team_b_id)bw++;const a=stats.get(match.team_a_id)!,b=stats.get(match.team_b_id)!;a.sets++;b.sets++;a.kills+=set.team_a_kills;a.deaths+=set.team_b_kills;a.assists+=set.team_a_assists;b.kills+=set.team_b_kills;b.deaths+=set.team_a_kills;b.assists+=set.team_b_assists}publicMatches.push({a:names.get(match.team_a_id)??'-',b:names.get(match.team_b_id)??'-',aw,bw,status:'완료',playedAt:match.scheduled_at?.slice(0,10)??''})}setTeams(t.data.map(x=>x.name));setMatches(publicMatches);setTeamStats([...stats.values()])})},[]);

  const standings=rankLol(teams,matches);
  const stats=[...teamStats].sort((a,b)=>{const ak=a.deaths===0?(a.kills+a.assists>0?Infinity:0):Number(kda(a));const bk=b.deaths===0?(b.kills+b.assists>0?Infinity:0):Number(kda(b));return bk-ak});
  const playerStats=[...lolPlayers].sort((a,b)=>playerKda(b)-playerKda(a)||b.kills-a.kills||b.assists-a.assists);

  return <main className="wrap section"><div className="eyebrow">LEAGUE OF LEGENDS</div><h1>4팀 단일 풀리그</h1><p className="sub">각 팀이 서로 한 번씩 경기합니다. 풀리그 종료 후 1·2위는 결승, 3·4위는 3·4위전을 진행합니다.</p>
    <section className="section"><h2>팀 순위</h2><div className="table-shell"><table className="table"><thead><tr>{['순위','팀명','경기','승','패','세트 승','세트 패','세트 득실','포스트시즌'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{standings.map((r,i)=><tr key={r.name}><td><span className={i<2?'medal':'rank'}>{i+1}</span></td><td><div className="team"><span className="avatar">{r.name[0]}</span>{r.name}</div></td><td>{r.played}</td><td>{r.w}</td><td>{r.l}</td><td>{r.sf}</td><td>{r.sa}</td><td>{r.sf-r.sa>0?'+':''}{r.sf-r.sa}</td><td><span className="badge">{i<2?'결승 진출권':'3·4위전'}</span></td></tr>)}</tbody></table></div></section>
    <section className="section"><h2>완료 경기</h2><div className="match-list">{matches.map(m=><div className="match" key={`${m.a}-${m.b}`}><span className="state">{m.playedAt}</span><b className="right">{m.a}</b><span className="score">{m.aw} : {m.bw}</span><b>{m.b}</b><span className="badge">완료</span></div>)}</div></section>
    <section className="section"><h2>팀 통계</h2><div className="table-shell"><table className="table"><thead><tr>{['순위','팀명','진행 세트','킬','데스','어시스트','KDA','세트당 평균 킬'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{stats.map((r,i)=><tr key={r.name}><td><span className={i<2?'medal':'rank'}>{i+1}</span></td><td><div className="team"><span className="avatar">{r.name[0]}</span>{r.name}</div></td><td>{r.sets}</td><td>{r.kills}</td><td>{r.deaths}</td><td>{r.assists}</td><td><b>{r.sets?kda(r):'-'}</b></td><td>{averageKills(r)}</td></tr>)}</tbody></table></div></section>
    <section className="section"><h2>개인 순위</h2><p className="sub">현재까지 진행된 세트의 개인 기록을 합산했으며 KDA 순으로 정렬됩니다.</p><div className="table-shell"><table className="table"><thead><tr>{['순위','선수','팀','포지션','세트','킬','데스','어시스트','KDA','킬관여율'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{playerStats.map((p,i)=><tr key={`${p.team}-${p.nickname}`}><td><span className={i<2?'medal':'rank'}>{i+1}</span></td><td><div className="player-name">{p.realName}({p.nickname})</div><div className="player-tag">#{p.tag}</div></td><td>{p.team}</td><td>{p.position}</td><td>{p.sets}</td><td>{p.kills}</td><td>{p.deaths}</td><td>{p.assists}</td><td><b>{Number.isFinite(playerKda(p))?playerKda(p).toFixed(2):'Perfect'}</b></td><td>{killParticipation(p).toFixed(1)}%</td></tr>)}</tbody></table></div></section>
  </main>;
}
