export type BracketMatch = {
  label: string;
  a: string;
  b: string;
  aWins?: number;
  bWins?: number;
  winner?: string | null;
  status?: string;
};

type Props = {
  quarterfinals: BracketMatch[];
  semifinals?: BracketMatch[];
  finals?: BracketMatch[];
};

export function FcBracket({quarterfinals, semifinals = [], finals = []}: Props) {
  return <div className="bracket-shell">
    <div className="bracket">
      <Round title="8강" matches={quarterfinals}/>
      <Round title="4강" matches={semifinals} className="bracket-semis"/>
      <Round title="결승 / 3·4위전" matches={finals} className="bracket-finals"/>
    </div>
  </div>;
}

function Round({title, matches, className = ''}: {title: string; matches: BracketMatch[]; className?: string}) {
  return <div className={`bracket-round ${className}`}>
    <h3>{title}</h3>
    {matches.map((match, index) => <MatchCard key={`${title}-${index}`} match={match} number={index + 1}/>)}
  </div>;
}

function MatchCard({match, number}: {match: BracketMatch; number: number}) {
  const played = match.status === '완료' || Boolean(match.winner);
  return <div className={`bracket-match ${played ? 'is-complete' : ''}`}>
    <div className="bracket-match-head">
      <span>{match.label}</span>
      <b>{played ? '경기 종료' : `M${number}`}</b>
    </div>
    <PlayerRow name={match.a} wins={match.aWins} winner={match.winner === match.a}/>
    <PlayerRow name={match.b} wins={match.bWins} winner={match.winner === match.b}/>
    {played && match.winner && <div className="bracket-advanced"><b>{match.winner}</b> 진출</div>}
  </div>;
}

function PlayerRow({name, wins, winner}: {name: string; wins?: number; winner: boolean}) {
  return <div className={`bracket-player ${winner ? 'is-winner' : ''}`}>
    <span className="seed-dot">{winner ? 'W' : '·'}</span>
    <strong>{name}</strong>
    <span className="bracket-score">{wins ?? '-'}</span>
  </div>;
}
