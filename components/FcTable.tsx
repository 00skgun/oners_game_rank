import {fcMatches as defaultMatches,fcPlayers as defaultPlayers,initial,useInitialBRecord,type FcMatch,type FcPlayer} from '@/lib/data';
import {rankFc} from '@/lib/rankings/fc-ranking';

export function FcTable({group='A',players=defaultPlayers,matches=defaultMatches}:{group?:string;players?:FcPlayer[];matches?:FcMatch[]}){
  const carry=group==='B'&&useInitialBRecord(matches)?initial:{};
  const rows=rankFc(players.filter(p=>p.group===group),matches.filter(m=>m.group===group),carry);
  return <div className="table-shell"><table className="table"><thead><tr>{['순위','선수','경기','승','무','패','득점','실점','득실','승점','진출 상태'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.name}><td><span className={i<2?'medal':'rank'}>{i+1}</span></td><td><div className="team"><span className="avatar">{r.name[0]}</span>{r.name}</div></td><td>{r.played}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd>0?'+':''}{r.gd}</td><td><b>{r.points}</b></td><td><span className="badge">{i<2?'8강 진출권':'현재 3위'}</span></td></tr>)}</tbody></table></div>;
}
