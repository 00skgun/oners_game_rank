export type LolStat={name:string;sets:number;kills:number;deaths:number;assists:number};
export const kda=(s:LolStat)=>s.deaths===0?'Perfect':((s.kills+s.assists)/s.deaths).toFixed(2);
export const averageKills=(s:LolStat)=>s.sets?(s.kills/s.sets).toFixed(1):'0.0';
