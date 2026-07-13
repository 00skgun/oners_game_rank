'use client';

import type { User } from '@supabase/supabase-js';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';

type Player={id:string;name:string;group_name:string;seed:number};
type FcMatch={id:number;group_name:string;round_number:number;player_a_id:string;player_b_id:string;player_a_score:number|null;player_b_score:number|null;status:string};
type Team={id:string;name:string};
type LolMatch={id:string;team_a_id:string;team_b_id:string;scheduled_at:string|null;status:string};
type LolSet={id:number;match_id:string;set_number:number;team_a_kills:number;team_a_assists:number;team_b_kills:number;team_b_assists:number;winner_team_id:string};

export default function Admin(){
  const supabase=useMemo(()=>createBrowserSupabase(),[]);
  const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()??'';
  const [user,setUser]=useState<User|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const [players,setPlayers]=useState<Player[]>([]),[fcMatches,setFcMatches]=useState<FcMatch[]>([]);
  const [teams,setTeams]=useState<Team[]>([]),[lolMatches,setLolMatches]=useState<LolMatch[]>([]),[lolSets,setLolSets]=useState<LolSet[]>([]);

  async function load(){if(!supabase)return;const [p,f,t,m,s]=await Promise.all([
    supabase.from('fc_players').select('id,name,group_name,seed').order('group_name').order('seed'),
    supabase.from('fc_matches').select('id,group_name,round_number,player_a_id,player_b_id,player_a_score,player_b_score,status').order('group_name').order('id'),
    supabase.from('lol_teams').select('id,name').order('display_order'),
    supabase.from('lol_matches').select('id,team_a_id,team_b_id,scheduled_at,status').order('scheduled_at'),
    supabase.from('lol_match_sets').select('id,match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id').order('match_id').order('set_number'),
  ]);setPlayers(p.data??[]);setFcMatches(f.data??[]);setTeams(t.data??[]);setLolMatches(m.data??[]);setLolSets(s.data??[]);}

  useEffect(()=>{if(!supabase)return;supabase.auth.getUser().then(({data})=>setUser(data.user));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));return()=>data.subscription.unsubscribe()},[supabase]);
  useEffect(()=>{if(user?.email?.toLowerCase()===adminEmail)load()},[user,adminEmail]);

  async function signIn(e:FormEvent){e.preventDefault();if(!supabase)return setMessage('Supabase 설정이 없습니다.');setBusy(true);const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)setMessage('이메일 또는 비밀번호를 확인해 주세요.');else if(data.user.email?.toLowerCase()!==adminEmail){await supabase.auth.signOut();setMessage('관리자 계정만 로그인할 수 있습니다.')}else setMessage('로그인되었습니다.');setBusy(false)}
  async function signOut(){await supabase?.auth.signOut();setMessage('로그아웃되었습니다.')}
  const name=(id:string)=>players.find(x=>x.id===id)?.name??'-',team=(id:string)=>teams.find(x=>x.id===id)?.name??'-';
  const isAdmin=user?.email?.toLowerCase()===adminEmail;

  return <main className="wrap section"><div className="eyebrow">ADMIN</div><h1>경기 관리</h1>{message&&<p className="card">{message}</p>}
    {!isAdmin?<section className="card admin-login"><h2>로그인</h2><form className="admin-form" onSubmit={signIn}><label>이메일<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn" disabled={busy}>{busy?'확인 중...':'로그인'}</button></form></section>:<>
      <div className="admin-head"><span>{user.email}</span><button className="btn secondary" onClick={signOut}>로그아웃</button></div>
      <section className="section"><h2>FC Online 경기 결과</h2><p className="sub">점수를 입력하고 저장하면 완료 경기로 변경됩니다.</p><div className="admin-list">{fcMatches.map(m=><FcEditor key={m.id} match={m} a={name(m.player_a_id)} b={name(m.player_b_id)} supabase={supabase!} onSaved={load}/>)}</div></section>
      <section className="section"><h2>LoL 세트 기록</h2><p className="sub">킬과 어시스트만 입력합니다. 상대 팀 킬이 자동으로 팀 데스가 됩니다.</p><div className="admin-list">{lolSets.map(s=>{const m=lolMatches.find(x=>x.id===s.match_id);return m?<LolSetEditor key={s.id} set={s} match={m} a={team(m.team_a_id)} b={team(m.team_b_id)} teams={teams} supabase={supabase!} onSaved={load}/>:null})}</div></section>
    </>}
  </main>;
}

function FcEditor({match,a,b,supabase,onSaved}:{match:FcMatch;a:string;b:string;supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [sa,setSa]=useState(match.player_a_score?.toString()??''),[sb,setSb]=useState(match.player_b_score?.toString()??''),[saving,setSaving]=useState(false);async function save(){if(sa===''||sb==='')return;setSaving(true);const {error}=await supabase.from('fc_matches').update({player_a_score:Number(sa),player_b_score:Number(sb),status:'완료',played_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',match.id);alert(error?'저장 실패: 관리자 권한 SQL을 확인하세요.':'저장했습니다.');setSaving(false);if(!error)onSaved()}return <div className="admin-row"><span className="admin-label">{match.group_name}조 {match.round_number}차</span><b>{a}</b><input type="number" min="0" value={sa} onChange={e=>setSa(e.target.value)}/><span>:</span><input type="number" min="0" value={sb} onChange={e=>setSb(e.target.value)}/><b>{b}</b><button className="btn" disabled={saving} onClick={save}>저장</button></div>}

function LolSetEditor({set,match,a,b,teams,supabase,onSaved}:{set:LolSet;match:LolMatch;a:string;b:string;teams:Team[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [ak,setAk]=useState(String(set.team_a_kills)),[aa,setAa]=useState(String(set.team_a_assists)),[bk,setBk]=useState(String(set.team_b_kills)),[ba,setBa]=useState(String(set.team_b_assists)),[winner,setWinner]=useState(set.winner_team_id),[saving,setSaving]=useState(false);async function save(){setSaving(true);const {error}=await supabase.from('lol_match_sets').update({team_a_kills:Number(ak),team_a_assists:Number(aa),team_b_kills:Number(bk),team_b_assists:Number(ba),winner_team_id:winner,updated_at:new Date().toISOString()}).eq('id',set.id);alert(error?'저장 실패: 관리자 권한 SQL을 확인하세요.':'저장했습니다.');setSaving(false);if(!error)onSaved()}return <div className="set-editor"><div className="admin-label">{a} vs {b} · {set.set_number}세트</div><div className="set-fields"><label>{a} 킬<input type="number" min="0" value={ak} onChange={e=>setAk(e.target.value)}/></label><label>{a} 어시<input type="number" min="0" value={aa} onChange={e=>setAa(e.target.value)}/></label><label>{b} 킬<input type="number" min="0" value={bk} onChange={e=>setBk(e.target.value)}/></label><label>{b} 어시<input type="number" min="0" value={ba} onChange={e=>setBa(e.target.value)}/></label><label>승자<select value={winner} onChange={e=>setWinner(e.target.value)}>{teams.filter(t=>t.id===match.team_a_id||t.id===match.team_b_id).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button className="btn" disabled={saving} onClick={save}>저장</button></div></div>}
