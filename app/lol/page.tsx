import { lolMatches, lolStats, lolTeams } from "@/lib/data";
import { rankLol } from "@/lib/rankings/lol-ranking";
import { averageKills, kda } from "@/lib/rankings/lol-stats";
import { killParticipation, lolPlayers, playerKda } from "@/lib/lol-players";

export default function Lol() {
  const standings = rankLol(lolTeams, lolMatches);
  const stats = [...lolStats].sort((a, b) => {
    const aKda = a.deaths === 0 ? (a.kills + a.assists > 0 ? Infinity : 0) : Number(kda(a));
    const bKda = b.deaths === 0 ? (b.kills + b.assists > 0 ? Infinity : 0) : Number(kda(b));
    return bKda - aKda;
  });
  const playerStats = [...lolPlayers].sort((a, b) =>
    playerKda(b) - playerKda(a) || b.kills - a.kills || b.assists - a.assists,
  );

  return <main className="wrap section">
    <div className="eyebrow">LEAGUE OF LEGENDS</div>
    <h1>4팀 단일 풀리그</h1>
    <p className="sub">각 팀이 서로 한 번씩 경기합니다. 풀리그 종료 후 1·2위는 결승, 3·4위는 3·4위전을 진행합니다.</p>

    <section className="section">
      <h2>팀 순위</h2>
      <div className="table-shell"><table className="table">
        <thead><tr>{["순위","팀명","경기","승","패","세트 승","세트 패","세트 득실","포스트시즌"].map((x)=><th key={x}>{x}</th>)}</tr></thead>
        <tbody>{standings.map((row,i)=><tr key={row.name}>
          <td><span className={i<2?"medal":"rank"}>{i+1}</span></td>
          <td><div className="team"><span className="avatar">{row.name[0]}</span>{row.name}</div></td>
          <td>{row.played}</td><td>{row.w}</td><td>{row.l}</td><td>{row.sf}</td><td>{row.sa}</td>
          <td>{row.sf-row.sa>0?"+":""}{row.sf-row.sa}</td>
          <td><span className="badge">{i<2?"결승 진출권":"3·4위전"}</span></td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <section className="section">
      <h2>완료 경기</h2>
      <div className="match-list">{lolMatches.map((match)=><div className="match" key={`${match.a}-${match.b}`}>
        <span className="state">{match.playedAt}</span><b className="right">{match.a}</b>
        <span className="score">{match.aw} : {match.bw}</span><b>{match.b}</b><span className="badge">완료</span>
      </div>)}</div>
    </section>

    <section className="section">
      <h2>팀 통계</h2>
      <div className="table-shell"><table className="table">
        <thead><tr>{["순위","팀명","진행 세트","킬","데스","어시스트","KDA","세트당 평균 킬"].map((x)=><th key={x}>{x}</th>)}</tr></thead>
        <tbody>{stats.map((row,i)=><tr key={row.name}>
          <td><span className={i<2?"medal":"rank"}>{i+1}</span></td>
          <td><div className="team"><span className="avatar">{row.name[0]}</span>{row.name}</div></td>
          <td>{row.sets}</td><td>{row.kills}</td><td>{row.deaths}</td><td>{row.assists}</td><td><b>{row.sets?kda(row):"-"}</b></td><td>{averageKills(row)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <section className="section">
      <h2>개인 순위</h2>
      <p className="sub">현재까지 진행된 세트의 개인 기록을 합산했으며 KDA 순으로 정렬됩니다.</p>
      <div className="table-shell"><table className="table">
        <thead><tr>{["순위","선수","팀","포지션","세트","킬","데스","어시스트","KDA","킬관여율"].map((x)=><th key={x}>{x}</th>)}</tr></thead>
        <tbody>{playerStats.map((player,i)=><tr key={`${player.team}-${player.nickname}`}>
          <td><span className={i<2?"medal":"rank"}>{i+1}</span></td>
          <td>
            <div className="player-name">{player.realName}({player.nickname})</div>
            <div className="player-tag">#{player.tag}</div>
          </td>
          <td>{player.team}</td><td>{player.position}</td><td>{player.sets}</td>
          <td>{player.kills}</td><td>{player.deaths}</td><td>{player.assists}</td>
          <td><b>{Number.isFinite(playerKda(player))?playerKda(player).toFixed(2):"Perfect"}</b></td>
          <td>{killParticipation(player).toFixed(1)}%</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </main>;
}
