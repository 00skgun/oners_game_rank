export type FcPlayer={id:string;name:string;group:string;seed:number};
export type FcMatch={id:number;group:string;round:number;a:string;b:string;sa:number|null;sb:number|null;status:'완료'|'미진행'|'기존 집계'};
export const fcPlayers:FcPlayer[]=[['a1','김규민','A',1],['a2','이우빈','A',2],['a3','정명원','A',3],['b1','정민호','B',1],['b2','최건영','B',2],['b3','서혁준','B',3],['c1','조영훈','C',1],['c2','임정우','C',2],['c3','김선호','C',3],['d1','이태훈','D',1],['d2','정유준','D',2],['d3','윤인태','D',3]].map(([id,name,group,seed])=>({id:String(id),name:String(name),group:String(group),seed:Number(seed)}));
const results:Record<number,[number,number]>={1:[2,2],2:[3,1],3:[2,2],4:[3,1],5:[0,0],6:[3,3],7:[3,1],8:[3,2],9:[6,3],19:[1,1],20:[0,1],21:[1,2],28:[4,2],29:[8,1],30:[3,1],31:[4,1],32:[4,1],33:[3,1]};
export const fcMatches:FcMatch[]=[];let id=1;for(const group of ['A','B','C','D']){const ps=fcPlayers.filter(p=>p.group===group);for(const [a,b] of [[ps[0],ps[1]],[ps[0],ps[2]],[ps[1],ps[2]]] as const)for(let round=1;round<=3;round++){const old=group==='B'&&a.name==='정민호'&&b.name==='최건영';const score=results[id];fcMatches.push({id,group,round,a:a.name,b:b.name,sa:score?.[0]??null,sb:score?.[1]??null,status:score?'완료':old?'기존 집계':'미진행'});id++}}
export const initial={최건영:{played:3,w:2,d:1,l:0,gf:9,ga:4,points:7},정민호:{played:3,w:0,d:1,l:2,gf:4,ga:9,points:1}};
export function useInitialBRecord(matches:FcMatch[]){
  const detailed=matches.filter(m=>m.group==='B'&&((m.a==='최건영'&&m.b==='정민호')||(m.a==='정민호'&&m.b==='최건영')));
  return !(detailed.length===3&&detailed.every(m=>m.status==='완료'&&m.sa!==null&&m.sb!==null));
}
export const lolTeams=['Team WIND','ONERS A','ONERS B','ONERS C'];
export const lolMatches=[
  {a:'ONERS B',b:'ONERS C',aw:2,bw:1,status:'완료' as const,playedAt:'2026-07-12'},
  {a:'ONERS A',b:'Team WIND',aw:2,bw:0,status:'완료' as const,playedAt:'2026-07-13'},
  {a:'ONERS A',b:'ONERS C',aw:2,bw:0,status:'완료' as const,playedAt:'2026-07-16'},
  {a:'ONERS B',b:'Team WIND',aw:0,bw:2,status:'완료' as const,playedAt:'2026-07-20'},
];
export const lolStats=[
  {name:'ONERS B',sets:5,kills:82,deaths:109,assists:170},
  {name:'ONERS C',sets:5,kills:81,deaths:137,assists:117},
  {name:'ONERS A',sets:4,kills:118,deaths:33,assists:194},
  {name:'Team WIND',sets:4,kills:61,deaths:63,assists:112},
];
