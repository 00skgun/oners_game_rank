'use client';

import {useEffect,useState} from 'react';
import {FcTable} from '@/components/FcTable';
import {fcMatches as fallbackMatches,fcPlayers as fallbackPlayers,type FcMatch,type FcPlayer} from '@/lib/data';
import {createBrowserSupabase} from '@/lib/supabase/browser';
import {rankFc} from '@/lib/rankings/fc-ranking';
import {initial,useInitialBRecord} from '@/lib/data';
import {FcBracket} from '@/components/FcBracket';

export default function Fc(){
  const [players,setPlayers]=useState<FcPlayer[]>(fallbackPlayers),[matches,setMatches]=useState<FcMatch[]>(fallbackMatches);
  useEffect(()=>{const supabase=createBrowserSupabase();if(!supabase)return;Promise.all([
    supabase.from('fc_players').select('id,name,group_name,seed'),
    supabase.from('fc_matches').select('id,group_name,round_number,player_a_id,player_b_id,player_a_score,player_b_score,status'),
  ]).then(([p,m])=>{if(!p.data?.length||!m.data?.length)return;const ps:FcPlayer[]=p.data.map(x=>({id:x.id,name:x.name,group:x.group_name,seed:x.seed}));const byId=new Map(ps.map(x=>[x.id,x.name]));const ms:FcMatch[]=m.data.map(x=>({id:x.id,group:x.group_name,round:x.round_number,a:byId.get(x.player_a_id)??'-',b:byId.get(x.player_b_id)??'-',sa:x.player_a_score,sb:x.player_b_score,status:x.status as FcMatch['status']}));setPlayers(ps);setMatches(ms)})},[]);
  const ranked=(group:string)=>rankFc(players.filter(p=>p.group===group),matches.filter(m=>m.group===group),group==='B'&&useInitialBRecord(matches)?initial:{});
  const groups=Object.fromEntries(['A','B','C','D'].map(g=>[g,ranked(g)]));
  const quarterfinals=[
    {label:'8강 1경기 · A1 vs C2',a:groups.A[0]?.name??'A조 1위',b:groups.C[1]?.name??'C조 2위'},
    {label:'8강 2경기 · B1 vs D2',a:groups.B[0]?.name??'B조 1위',b:groups.D[1]?.name??'D조 2위'},
    {label:'8강 3경기 · C1 vs B2',a:groups.C[0]?.name??'C조 1위',b:groups.B[1]?.name??'B조 2위'},
    {label:'8강 4경기 · D1 vs A2',a:groups.D[0]?.name??'D조 1위',b:groups.A[1]?.name??'A조 2위'},
  ];
  return <main className="wrap section"><div className="eyebrow">FC ONLINE</div><h1>조별 순위</h1><p className="sub">승점 → 동률 상대 승자승 → 전체 득실차 → 전체 득점 → 낮은 시드 순으로 정렬됩니다.</p><section className="section"><h2>토너먼트 대진</h2><p className="sub">현재 조별 순위를 기준으로 예상 상대가 자동 반영됩니다.</p><FcBracket quarterfinals={quarterfinals}/></section>{['A','B','C','D'].map(g=><section className="section" key={g}><h2>{g}조</h2><FcTable group={g} players={players} matches={matches}/></section>)}<section className="section"><h2>최근 경기</h2><div className="match-list">{matches.filter(m=>m.status==='완료').slice(-6).reverse().map(m=><div className="match" key={m.id}><span className="state">{m.group}조 · {m.round}차</span><b className="right">{m.a}</b><span className="score">{m.sa} : {m.sb}</span><b>{m.b}</b><span className="badge">완료</span></div>)}</div></section></main>;
}
