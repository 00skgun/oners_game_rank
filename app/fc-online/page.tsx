'use client';

import {useEffect, useMemo, useState} from 'react';
import {FcTable} from '@/components/FcTable';
import {FcBracket, type BracketMatch} from '@/components/FcBracket';
import {fcMatches as fallbackMatches, fcPlayers as fallbackPlayers, initial, useInitialBRecord, type FcMatch, type FcPlayer} from '@/lib/data';
import {createBrowserSupabase} from '@/lib/supabase/browser';
import {rankFc} from '@/lib/rankings/fc-ranking';

type Series = {
  id: string;
  stage: string;
  match_number: number;
  player_a_id: string | null;
  player_b_id: string | null;
  winner_id: string | null;
  status: string;
};
type TournamentGame = {series_id: string; winner_id: string | null};

export default function Fc() {
  const [players, setPlayers] = useState<FcPlayer[]>(fallbackPlayers);
  const [matches, setMatches] = useState<FcMatch[]>(fallbackMatches);
  const [series, setSeries] = useState<Series[]>([]);
  const [games, setGames] = useState<TournamentGame[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    Promise.all([
      supabase.from('fc_players').select('id,name,group_name,seed'),
      supabase.from('fc_matches').select('id,group_name,round_number,player_a_id,player_b_id,player_a_score,player_b_score,status'),
      supabase.from('fc_tournament_series').select('id,stage,match_number,player_a_id,player_b_id,winner_id,status').order('stage').order('match_number'),
      supabase.from('fc_tournament_games').select('series_id,winner_id').order('game_number'),
    ]).then(([p, m, s, g]) => {
      if (p.data?.length && m.data?.length) {
        const ps: FcPlayer[] = p.data.map(x => ({id: x.id, name: x.name, group: x.group_name, seed: x.seed}));
        const byId = new Map(ps.map(x => [x.id, x.name]));
        const ms: FcMatch[] = m.data.map(x => ({
          id: x.id, group: x.group_name, round: x.round_number,
          a: byId.get(x.player_a_id) ?? '-', b: byId.get(x.player_b_id) ?? '-',
          sa: x.player_a_score, sb: x.player_b_score, status: x.status as FcMatch['status'],
        }));
        setPlayers(ps);
        setMatches(ms);
      }
      setSeries((s.data ?? []) as Series[]);
      setGames((g.data ?? []) as TournamentGame[]);
    });
  }, []);

  const ranked = (group: string) => rankFc(
    players.filter(p => p.group === group),
    matches.filter(m => m.group === group),
    group === 'B' && useInitialBRecord(matches) ? initial : {},
  );
  const groups = Object.fromEntries(['A', 'B', 'C', 'D'].map(g => [g, ranked(g)]));
  const nameById = useMemo(() => new Map(players.map(p => [p.id, p.name])), [players]);
  const predictedQuarterfinals: BracketMatch[] = [
    {label: '8강 1경기 · 5판 3선승', a: groups.A[0]?.name ?? 'A조 1위', b: groups.C[1]?.name ?? 'C조 2위'},
    {label: '8강 2경기 · 5판 3선승', a: groups.B[0]?.name ?? 'B조 1위', b: groups.D[1]?.name ?? 'D조 2위'},
    {label: '8강 3경기 · 5판 3선승', a: groups.C[0]?.name ?? 'C조 1위', b: groups.B[1]?.name ?? 'B조 2위'},
    {label: '8강 4경기 · 5판 3선승', a: groups.D[0]?.name ?? 'D조 1위', b: groups.A[1]?.name ?? 'A조 2위'},
  ];

  const makeMatch = (stage: string, number: number, fallback: BracketMatch): BracketMatch => {
    const item = series.find(x => x.stage === stage && x.match_number === number);
    if (!item) return fallback;
    const a = item.player_a_id ? nameById.get(item.player_a_id) ?? '-' : fallback.a;
    const b = item.player_b_id ? nameById.get(item.player_b_id) ?? '-' : fallback.b;
    const seriesGames = games.filter(x => x.series_id === item.id);
    const aWins = seriesGames.filter(x => x.winner_id === item.player_a_id).length;
    const bWins = seriesGames.filter(x => x.winner_id === item.player_b_id).length;
    return {
      label: fallback.label, a, b, aWins, bWins,
      winner: item.winner_id ? nameById.get(item.winner_id) ?? null : null,
      status: item.status,
    };
  };

  const quarterfinals = predictedQuarterfinals.map((fallback, i) => makeMatch('quarterfinal', i + 1, fallback));
  const semifinals = [
    makeMatch('semifinal', 1, {label: '4강 1경기 · 5판 3선승', a: '8강 1경기 승자', b: '8강 2경기 승자'}),
    makeMatch('semifinal', 2, {label: '4강 2경기 · 5판 3선승', a: '8강 3경기 승자', b: '8강 4경기 승자'}),
  ];
  const finals = [
    makeMatch('final', 1, {label: '결승 · 7판 4선승', a: '4강 1경기 승자', b: '4강 2경기 승자'}),
    makeMatch('third', 1, {label: '3·4위전 · 5판 3선승', a: '4강 1경기 패자', b: '4강 2경기 패자'}),
  ];
  const champion = finals[0].winner;

  return <main className="wrap section">
    <div className="eyebrow">FC ONLINE</div>
    <h1>조별 순위</h1>
    <p className="sub">승점 → 동률 상대 승자승 → 전체 득실차 → 전체 득점 → 낮은 시드 순으로 정렬됩니다.</p>
    <section className="section">
      <h2>토너먼트 대진</h2>
      <p className="sub">세트 스코어와 다음 라운드 진출자가 경기 결과에 맞춰 자동으로 표시됩니다.</p>
      {champion && <div className="champion-banner"><span>FC Online 우승</span><b>{champion}</b></div>}
      <FcBracket quarterfinals={quarterfinals} semifinals={semifinals} finals={finals}/>
    </section>
    {['A', 'B', 'C', 'D'].map(g => <section className="section" key={g}>
      <h2>{g}조</h2><FcTable group={g} players={players} matches={matches}/>
    </section>)}
    <section className="section">
      <h2>최근 경기</h2>
      <div className="match-list">{matches.filter(m => m.status === '완료').slice(-6).reverse().map(m =>
        <div className="match" key={m.id}><span className="state">{m.group}조 · {m.round}차</span><b className="right">{m.a}</b><span className="score">{m.sa} : {m.sb}</span><b>{m.b}</b><span className="badge">완료</span></div>
      )}</div>
    </section>
  </main>;
}
