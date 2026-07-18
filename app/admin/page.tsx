'use client';

import type { User } from '@supabase/supabase-js';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';

type Player={id:string;name:string;group_name:string;seed:number};
type FcMatch={id:number;group_name:string;round_number:number;player_a_id:string;player_b_id:string;player_a_score:number|null;player_b_score:number|null;status:string};
type Team={id:string;name:string};
type LolMatch={id:string;team_a_id:string;team_b_id:string;scheduled_at:string|null;status:string};
type LolSet={id:number;match_id:string;set_number:number;team_a_kills:number;team_a_assists:number;team_b_kills:number;team_b_assists:number;winner_team_id:string};
type LolPlayer={id:string;team_id:string;real_name:string;nickname:string;tag_line:string;position:string};
type PlayerSetStat={id:number;set_id:number;player_id:string;kills:number;deaths:number;assists:number};
type FcSeries={id:string;stage:string;match_number:number;player_a_id:string|null;player_b_id:string|null;required_wins:number;winner_id:string|null;status:string};
type FcTournamentGame={id:number;series_id:string;game_number:number;winner_id:string|null};

export default function Admin(){
  const supabase=useMemo(()=>createBrowserSupabase(),[]);
  const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()??'';
  const [user,setUser]=useState<User|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const [players,setPlayers]=useState<Player[]>([]),[fcMatches,setFcMatches]=useState<FcMatch[]>([]);
  const [teams,setTeams]=useState<Team[]>([]),[lolMatches,setLolMatches]=useState<LolMatch[]>([]),[lolSets,setLolSets]=useState<LolSet[]>([]);
  const [lolPlayers,setLolPlayers]=useState<LolPlayer[]>([]),[playerStats,setPlayerStats]=useState<PlayerSetStat[]>([]);
  const [fcSeries,setFcSeries]=useState<FcSeries[]>([]),[fcTournamentGames,setFcTournamentGames]=useState<FcTournamentGame[]>([]);

  async function load(){if(!supabase)return;const [p,f,t,m,s,lp,ps,fs,fg]=await Promise.all([
    supabase.from('fc_players').select('id,name,group_name,seed').order('group_name').order('seed'),
    supabase.from('fc_matches').select('id,group_name,round_number,player_a_id,player_b_id,player_a_score,player_b_score,status').order('group_name').order('id'),
    supabase.from('lol_teams').select('id,name').order('display_order'),
    supabase.from('lol_matches').select('id,team_a_id,team_b_id,scheduled_at,status').order('scheduled_at'),
    supabase.from('lol_match_sets').select('id,match_id,set_number,team_a_kills,team_a_assists,team_b_kills,team_b_assists,winner_team_id').order('match_id').order('set_number'),
    supabase.from('lol_players').select('id,team_id,real_name,nickname,tag_line,position').order('team_id').order('display_order'),
    supabase.from('lol_player_set_stats').select('id,set_id,player_id,kills,deaths,assists').order('set_id').order('id'),
    supabase.from('fc_tournament_series').select('id,stage,match_number,player_a_id,player_b_id,required_wins,winner_id,status').order('stage').order('match_number'),
    supabase.from('fc_tournament_games').select('id,series_id,game_number,winner_id').order('series_id').order('game_number'),
  ]);setPlayers(p.data??[]);setFcMatches(f.data??[]);setTeams(t.data??[]);setLolMatches(m.data??[]);setLolSets(s.data??[]);setLolPlayers(lp.data??[]);setPlayerStats(ps.data??[]);setFcSeries(fs.data??[]);setFcTournamentGames(fg.data??[]);}

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
      <section className="section"><h2>FC Online 토너먼트</h2><p className="sub">8강·4강·3/4위전은 5판 3선승, 결승은 7판 4선승입니다. 승자와 패자는 다음 경기로 자동 반영됩니다.</p><FcTournamentAdmin players={players} matches={fcMatches} series={fcSeries} games={fcTournamentGames} supabase={supabase!} onSaved={load}/></section>
      <section className="section"><h2>LoL 경기 추가</h2><div className="admin-create-grid"><NewLolMatch teams={teams} supabase={supabase!} onSaved={load}/><NewLolSet matches={lolMatches} sets={lolSets} teams={teams} players={lolPlayers} supabase={supabase!} onSaved={load}/></div></section>
      <section className="section"><h2>LoL 세트 기록</h2><p className="sub">킬과 어시스트만 입력합니다. 상대 팀 킬이 자동으로 팀 데스가 됩니다.</p><div className="admin-list">{lolSets.map(s=>{const m=lolMatches.find(x=>x.id===s.match_id);return m?<LolSetEditor key={s.id} set={s} match={m} a={team(m.team_a_id)} b={team(m.team_b_id)} teams={teams} supabase={supabase!} onSaved={load}/>:null})}</div></section>
      <section className="section"><h2>LoL 개인 기록</h2><p className="sub">세트별 선수의 킬·데스·어시스트를 입력합니다.</p><div className="admin-list">{playerStats.map(stat=>{const player=lolPlayers.find(x=>x.id===stat.player_id),set=lolSets.find(x=>x.id===stat.set_id),match=set?lolMatches.find(x=>x.id===set.match_id):undefined;return player&&set&&match?<PlayerStatEditor key={stat.id} stat={stat} player={player} label={`${team(match.team_a_id)} vs ${team(match.team_b_id)} · ${set.set_number}세트`} supabase={supabase!} onSaved={load}/>:null})}</div></section>
    </>}
  </main>;
}

function FcEditor({match,a,b,supabase,onSaved}:{match:FcMatch;a:string;b:string;supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [sa,setSa]=useState(match.player_a_score?.toString()??''),[sb,setSb]=useState(match.player_b_score?.toString()??''),[saving,setSaving]=useState(false);async function save(){if(sa===''||sb==='')return;setSaving(true);const {error}=await supabase.from('fc_matches').update({player_a_score:Number(sa),player_b_score:Number(sb),status:'완료',played_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',match.id);alert(error?'저장 실패: 관리자 권한 SQL을 확인하세요.':'저장했습니다.');setSaving(false);if(!error)onSaved()}return <div className="admin-row"><span className="admin-label">{match.group_name}조 {match.round_number}차</span><b>{a}</b><input type="number" min="0" value={sa} onChange={e=>setSa(e.target.value)}/><span>:</span><input type="number" min="0" value={sb} onChange={e=>setSb(e.target.value)}/><b>{b}</b><button className="btn" disabled={saving} onClick={save}>저장</button></div>}

function FcTournamentAdmin({players,matches,series,games,supabase,onSaved}:{players:Player[];matches:FcMatch[];series:FcSeries[];games:FcTournamentGame[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){
  const [creating,setCreating]=useState(false);
  const seeds=getTournamentSeeds(players,matches);
  async function createBracket(){
    if(seeds.some(x=>!x)){alert('각 조의 1·2위가 정해졌는지 확인하세요.');return}
    setCreating(true);
    const rows=[
      {stage:'quarterfinal',match_number:1,player_a_id:seeds[0],player_b_id:seeds[5],required_wins:3,status:'예정'},
      {stage:'quarterfinal',match_number:2,player_a_id:seeds[2],player_b_id:seeds[7],required_wins:3,status:'예정'},
      {stage:'quarterfinal',match_number:3,player_a_id:seeds[4],player_b_id:seeds[3],required_wins:3,status:'예정'},
      {stage:'quarterfinal',match_number:4,player_a_id:seeds[6],player_b_id:seeds[1],required_wins:3,status:'예정'},
      {stage:'semifinal',match_number:1,player_a_id:null,player_b_id:null,required_wins:3,status:'예정'},
      {stage:'semifinal',match_number:2,player_a_id:null,player_b_id:null,required_wins:3,status:'예정'},
      {stage:'final',match_number:1,player_a_id:null,player_b_id:null,required_wins:4,status:'예정'},
      {stage:'third',match_number:1,player_a_id:null,player_b_id:null,required_wins:3,status:'예정'},
    ];
    const {error}=await supabase.from('fc_tournament_series').upsert(rows,{onConflict:'stage,match_number'});
    alert(error?'대진 생성 실패: '+error.message:'현재 조별 순위로 토너먼트 대진을 만들었습니다.');
    setCreating(false);
    if(!error)onSaved();
  }
  if(!series.length)return <div className="card"><p>아직 토너먼트 대진이 없습니다.</p><button className="btn" disabled={creating} onClick={createBracket}>{creating?'생성 중...':'현재 순위로 토너먼트 만들기'}</button></div>;
  const order={quarterfinal:0,semifinal:1,final:2,third:3} as Record<string,number>;
  return <div className="admin-list">{[...series].sort((a,b)=>(order[a.stage]??9)-(order[b.stage]??9)||a.match_number-b.match_number).map(item=>
    <FcTournamentEditor key={item.id} item={item} allSeries={series} games={games} players={players} supabase={supabase} onSaved={onSaved}/>
  )}</div>;
}

function FcTournamentEditor({item,allSeries,games,players,supabase,onSaved}:{item:FcSeries;allSeries:FcSeries[];games:FcTournamentGame[];players:Player[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){
  const requiredWins=item.stage==='final'?4:3;
  const [a,setA]=useState(item.player_a_id??''),[b,setB]=useState(item.player_b_id??'');
  const currentGames=games.filter(g=>g.series_id===item.id);
  const [aw,setAw]=useState(String(currentGames.filter(g=>g.winner_id===item.player_a_id).length));
  const [bw,setBw]=useState(String(currentGames.filter(g=>g.winner_id===item.player_b_id).length));
  const [saving,setSaving]=useState(false);
  useEffect(()=>{setA(item.player_a_id??'');setB(item.player_b_id??'');setAw(String(games.filter(g=>g.series_id===item.id&&g.winner_id===item.player_a_id).length));setBw(String(games.filter(g=>g.series_id===item.id&&g.winner_id===item.player_b_id).length))},[item,games]);
  const stageName:Record<string,string>={quarterfinal:'8강',semifinal:'4강',final:'결승',third:'3·4위전'};
  async function fillNext(targetStage:string,targetNumber:number,field:'player_a_id'|'player_b_id',playerId:string){
    const target=allSeries.find(x=>x.stage===targetStage&&x.match_number===targetNumber);
    if(!target||target[field]===playerId)return;
    await supabase.from('fc_tournament_games').delete().eq('series_id',target.id);
    await supabase.from('fc_tournament_series').update({[field]:playerId,winner_id:null,status:'예정'}).eq('id',target.id);
  }
  async function save(){
    const aWins=Number(aw),bWins=Number(bw);
    if(!a||!b||a===b)return alert('서로 다른 두 선수를 선택하세요.');
    if(aWins===bWins||Math.max(aWins,bWins)!==requiredWins||Math.min(aWins,bWins)<0||Math.min(aWins,bWins)>=requiredWins)return alert(`${requiredWins}:0, ${requiredWins}:1처럼 최종 세트 스코어를 입력하세요.`);
    setSaving(true);
    const winner=aWins>bWins?a:b,loser=aWins>bWins?b:a;
    const {error}=await supabase.from('fc_tournament_series').update({player_a_id:a,player_b_id:b,required_wins:requiredWins,winner_id:winner,status:'완료'}).eq('id',item.id);
    if(!error){
      await supabase.from('fc_tournament_games').delete().eq('series_id',item.id);
      const winners=[...Array(aWins).fill(a),...Array(bWins).fill(b)];
      if(winners.length)await supabase.from('fc_tournament_games').insert(winners.map((winner_id,index)=>({series_id:item.id,game_number:index+1,winner_id,player_a_score:winner_id===a?1:0,player_b_score:winner_id===b?1:0})));
      if(item.stage==='quarterfinal'){
        const semifinal=item.match_number<=2?1:2;
        const field=item.match_number%2===1?'player_a_id':'player_b_id';
        await fillNext('semifinal',semifinal,field,winner);
      }else if(item.stage==='semifinal'){
        const field=item.match_number===1?'player_a_id':'player_b_id';
        await fillNext('final',1,field,winner);
        await fillNext('third',1,field,loser);
      }
    }
    alert(error?'토너먼트 저장 실패: '+error.message:`${players.find(p=>p.id===winner)?.name??'승자'} 진출로 저장했습니다.`);
    setSaving(false);
    if(!error)onSaved();
  }
  return <div className="tournament-editor">
    <div className="tournament-editor-head"><b>{stageName[item.stage]??item.stage} {item.stage==='final'||item.stage==='third'?'':item.match_number+'경기'} · {requiredWins===4?'7판 4선승':'5판 3선승'}</b>{item.winner_id&&<span className="badge">{players.find(p=>p.id===item.winner_id)?.name} 진출</span>}</div>
    <div className="tournament-fields">
      <label>선수 1<select value={a} onChange={e=>setA(e.target.value)}><option value="">선택</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>세트<input type="number" min="0" max={requiredWins} value={aw} onChange={e=>setAw(e.target.value)}/></label>
      <span>:</span>
      <label>세트<input type="number" min="0" max={requiredWins} value={bw} onChange={e=>setBw(e.target.value)}/></label>
      <label>선수 2<select value={b} onChange={e=>setB(e.target.value)}><option value="">선택</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <button className="btn" disabled={saving||!a||!b} onClick={save}>저장</button>
    </div>
  </div>;
}

function getTournamentSeeds(players:Player[],matches:FcMatch[]){
  const ids:Record<string,string>={};
  for(const group of ['A','B','C','D']){
    const rows=players.filter(p=>p.group_name===group).map(p=>({player:p,points:0,gf:0,ga:0}));
    for(const match of matches.filter(m=>m.group_name===group&&m.status==='완료'&&m.player_a_score!==null&&m.player_b_score!==null)){
      const a=rows.find(x=>x.player.id===match.player_a_id),b=rows.find(x=>x.player.id===match.player_b_id);
      if(!a||!b)continue;
      a.gf+=match.player_a_score!;a.ga+=match.player_b_score!;b.gf+=match.player_b_score!;b.ga+=match.player_a_score!;
      if(match.player_a_score!>match.player_b_score!)a.points+=3;else if(match.player_a_score!<match.player_b_score!)b.points+=3;else{a.points++;b.points++}
    }
    rows.sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.player.seed-b.player.seed);
    ids[`${group}1`]=rows[0]?.player.id??'';ids[`${group}2`]=rows[1]?.player.id??'';
  }
  return [ids.A1,ids.A2,ids.B1,ids.B2,ids.C1,ids.C2,ids.D1,ids.D2];
}

function LolSetEditor({set,match,a,b,teams,supabase,onSaved}:{set:LolSet;match:LolMatch;a:string;b:string;teams:Team[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [ak,setAk]=useState(String(set.team_a_kills)),[aa,setAa]=useState(String(set.team_a_assists)),[bk,setBk]=useState(String(set.team_b_kills)),[ba,setBa]=useState(String(set.team_b_assists)),[winner,setWinner]=useState(set.winner_team_id),[saving,setSaving]=useState(false);async function save(){setSaving(true);const {error}=await supabase.from('lol_match_sets').update({team_a_kills:Number(ak),team_a_assists:Number(aa),team_b_kills:Number(bk),team_b_assists:Number(ba),winner_team_id:winner,updated_at:new Date().toISOString()}).eq('id',set.id);alert(error?'저장 실패: 관리자 권한 SQL을 확인하세요.':'저장했습니다.');setSaving(false);if(!error)onSaved()}return <div className="set-editor"><div className="admin-label">{a} vs {b} · {set.set_number}세트</div><div className="set-fields"><label>{a} 킬<input type="number" min="0" value={ak} onChange={e=>setAk(e.target.value)}/></label><label>{a} 어시<input type="number" min="0" value={aa} onChange={e=>setAa(e.target.value)}/></label><label>{b} 킬<input type="number" min="0" value={bk} onChange={e=>setBk(e.target.value)}/></label><label>{b} 어시<input type="number" min="0" value={ba} onChange={e=>setBa(e.target.value)}/></label><label>승자<select value={winner} onChange={e=>setWinner(e.target.value)}>{teams.filter(t=>t.id===match.team_a_id||t.id===match.team_b_id).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button className="btn" disabled={saving} onClick={save}>저장</button></div></div>}

function PlayerStatEditor({stat,player,label,supabase,onSaved}:{stat:PlayerSetStat;player:LolPlayer;label:string;supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [kills,setKills]=useState(String(stat.kills)),[deaths,setDeaths]=useState(String(stat.deaths)),[assists,setAssists]=useState(String(stat.assists)),[saving,setSaving]=useState(false);async function save(){setSaving(true);const {error}=await supabase.from('lol_player_set_stats').update({kills:Number(kills),deaths:Number(deaths),assists:Number(assists),updated_at:new Date().toISOString()}).eq('id',stat.id);alert(error?'저장 실패: 개인 기록 권한 SQL을 확인하세요.':'저장했습니다.');setSaving(false);if(!error)onSaved()}return <div className="player-editor"><div><div className="admin-label">{label}</div><b>{player.real_name}({player.nickname})</b><span className="player-tag"> {player.position}</span></div><label>킬<input type="number" min="0" value={kills} onChange={e=>setKills(e.target.value)}/></label><label>데스<input type="number" min="0" value={deaths} onChange={e=>setDeaths(e.target.value)}/></label><label>어시<input type="number" min="0" value={assists} onChange={e=>setAssists(e.target.value)}/></label><button className="btn" disabled={saving} onClick={save}>저장</button></div>}

function NewLolMatch({teams,supabase,onSaved}:{teams:Team[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [a,setA]=useState(''),[b,setB]=useState(''),[date,setDate]=useState(''),[saving,setSaving]=useState(false);useEffect(()=>{if(!a&&teams[0])setA(teams[0].id);if(!b&&teams[1])setB(teams[1].id)},[teams,a,b]);async function save(){if(!a||!b||a===b)return alert('서로 다른 두 팀을 선택하세요.');setSaving(true);const {error}=await supabase.from('lol_matches').insert({team_a_id:a,team_b_id:b,scheduled_at:date?new Date(date).toISOString():null,status:'예정'});alert(error?'경기 생성 실패: '+error.message:'경기를 추가했습니다.');setSaving(false);if(!error)onSaved()}return <div className="card"><h3>새 경기</h3><div className="admin-form"><label>팀 1<select value={a} onChange={e=>setA(e.target.value)}>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>팀 2<select value={b} onChange={e=>setB(e.target.value)}>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>경기 일시<input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="btn" disabled={saving} onClick={save}>경기 추가</button></div></div>}

function NewLolSet({matches,sets,teams,players,supabase,onSaved}:{matches:LolMatch[];sets:LolSet[];teams:Team[];players:LolPlayer[];supabase:NonNullable<ReturnType<typeof createBrowserSupabase>>;onSaved:()=>void}){const [matchId,setMatchId]=useState(''),[setNumber,setSetNumber]=useState('1'),[ak,setAk]=useState('0'),[aa,setAa]=useState('0'),[bk,setBk]=useState('0'),[ba,setBa]=useState('0'),[winner,setWinner]=useState(''),[saving,setSaving]=useState(false);const match=matches.find(m=>m.id===matchId);useEffect(()=>{if(!matchId&&matches[0])setMatchId(matches[0].id)},[matches,matchId]);useEffect(()=>{if(match&&!winner)setWinner(match.team_a_id)},[match,winner]);const teamName=(id:string)=>teams.find(t=>t.id===id)?.name??'-';async function save(){if(!match||!winner)return;const number=Number(setNumber);if(number<1||number>3)return alert('세트 번호는 1~3만 가능합니다.');const existed=sets.some(s=>s.match_id===match.id&&s.set_number===number);setSaving(true);const {data,error}=await supabase.from('lol_match_sets').upsert({match_id:match.id,set_number:number,team_a_kills:Number(ak),team_a_assists:Number(aa),team_b_kills:Number(bk),team_b_assists:Number(ba),winner_team_id:winner,updated_at:new Date().toISOString()},{onConflict:'match_id,set_number'}).select('id').single();if(error){alert('세트 저장 실패: '+error.message);setSaving(false);return}if(!existed&&data){const rows=players.filter(p=>p.team_id===match.team_a_id||p.team_id===match.team_b_id).map(p=>({set_id:data.id,player_id:p.id,kills:0,deaths:0,assists:0}));if(rows.length)await supabase.from('lol_player_set_stats').insert(rows)}const relevant=sets.filter(s=>s.match_id===match.id&&s.set_number!==number);const winners=[...relevant.map(s=>s.winner_team_id),winner];const complete=winners.filter(x=>x===match.team_a_id).length>=2||winners.filter(x=>x===match.team_b_id).length>=2;await supabase.from('lol_matches').update({status:complete?'완료':'예정',updated_at:new Date().toISOString()}).eq('id',match.id);alert('세트를 저장했습니다.');setSaving(false);onSaved()}return <div className="card"><h3>세트 추가</h3><div className="admin-form"><label>경기<select value={matchId} onChange={e=>{setMatchId(e.target.value);setWinner('')}}>{matches.map(m=><option key={m.id} value={m.id}>{teamName(m.team_a_id)} vs {teamName(m.team_b_id)} · {m.scheduled_at?.slice(0,10)??'날짜 미정'}</option>)}</select></label><label>세트 번호<input type="number" min="1" max="3" value={setNumber} onChange={e=>setSetNumber(e.target.value)}/></label>{match&&<><div className="compact-fields"><label>{teamName(match.team_a_id)} 킬<input type="number" min="0" value={ak} onChange={e=>setAk(e.target.value)}/></label><label>어시<input type="number" min="0" value={aa} onChange={e=>setAa(e.target.value)}/></label><label>{teamName(match.team_b_id)} 킬<input type="number" min="0" value={bk} onChange={e=>setBk(e.target.value)}/></label><label>어시<input type="number" min="0" value={ba} onChange={e=>setBa(e.target.value)}/></label></div><label>세트 승자<select value={winner} onChange={e=>setWinner(e.target.value)}><option value={match.team_a_id}>{teamName(match.team_a_id)}</option><option value={match.team_b_id}>{teamName(match.team_b_id)}</option></select></label></>}<button className="btn" disabled={saving||!match} onClick={save}>세트 저장</button></div></div>}
