type BracketMatch={label:string;a:string;b:string};

export function FcBracket({quarterfinals}:{quarterfinals:BracketMatch[]}){
  return <div className="bracket-shell">
    <div className="bracket">
      <div className="bracket-round">
        <h3>8강</h3>
        {quarterfinals.map((match,i)=><MatchCard key={match.label} match={match} number={i+1}/>) }
      </div>
      <div className="bracket-round bracket-semis">
        <h3>4강</h3>
        <MatchCard number={1} match={{label:'8강 1·2경기 승자',a:'8강 1경기 승자',b:'8강 2경기 승자'}} />
        <MatchCard number={2} match={{label:'8강 3·4경기 승자',a:'8강 3경기 승자',b:'8강 4경기 승자'}} />
      </div>
      <div className="bracket-round bracket-finals">
        <h3>결승 / 3·4위전</h3>
        <MatchCard number={1} match={{label:'결승',a:'4강 1경기 승자',b:'4강 2경기 승자'}} />
        <MatchCard number={2} match={{label:'3·4위전',a:'4강 1경기 패자',b:'4강 2경기 패자'}} />
      </div>
    </div>
  </div>;
}

function MatchCard({match,number}:{match:BracketMatch;number:number}){
  return <div className="bracket-match">
    <div className="bracket-match-head"><span>{match.label}</span><b>M{number}</b></div>
    <div className="bracket-player"><span className="seed-dot">1</span><strong>{match.a}</strong><span>-</span></div>
    <div className="bracket-player"><span className="seed-dot">2</span><strong>{match.b}</strong><span>-</span></div>
  </div>;
}
