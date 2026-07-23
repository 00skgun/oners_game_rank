export type LolPlayerStat = {
  team: string;
  position: string;
  realName: string;
  nickname: string;
  tag: string;
  sets: number;
  kills: number;
  deaths: number;
  assists: number;
  teamKills: number;
};

export const lolPlayers: LolPlayerStat[] = [
  {team:'Team WIND',position:'탑',realName:'최병준',nickname:'달달한우리팀',tag:'KR1',sets:4,kills:13,deaths:11,assists:20,teamKills:61},
  {team:'Team WIND',position:'정글',realName:'김진륜',nickname:'김진륜그는감히전설이라고할수있다',tag:'KR11',sets:4,kills:13,deaths:8,assists:24,teamKills:61},
  {team:'Team WIND',position:'미드',realName:'정석환',nickname:'avengersVSthanos',tag:'KR1',sets:4,kills:8,deaths:15,assists:15,teamKills:61},
  {team:'Team WIND',position:'원딜',realName:'김민규',nickname:'min9o',tag:'KR1',sets:4,kills:24,deaths:11,assists:17,teamKills:61},
  {team:'Team WIND',position:'서폿',realName:'최선',nickname:'최선을다하자',tag:'BEST',sets:4,kills:3,deaths:18,assists:36,teamKills:61},

  {team:'ONERS A',position:'탑',realName:'차윤혁',nickname:'적챔피언을처단할데마시아의힘소환',tag:'궁극기',sets:6,kills:37,deaths:12,assists:38,teamKills:181},
  {team:'ONERS A',position:'정글',realName:'김지우',nickname:'무지성칼두기',tag:'0420',sets:6,kills:55,deaths:13,assists:63,teamKills:181},
  {team:'ONERS A',position:'미드/서폿',realName:'한서준',nickname:'2CaCO3',tag:'KR1',sets:6,kills:18,deaths:18,assists:64,teamKills:181},
  {team:'ONERS A',position:'원딜',realName:'김규민',nickname:'이이규댕',tag:'댕댕댕',sets:6,kills:51,deaths:19,assists:49,teamKills:181},
  {team:'ONERS A',position:'서폿/미드',realName:'이현우',nickname:'어루대',tag:'KR1',sets:6,kills:20,deaths:25,assists:83,teamKills:181},

  {team:'ONERS B',position:'탑',realName:'김재원',nickname:'나는거장이다',tag:'KR1',sets:7,kills:28,deaths:28,assists:32,teamKills:136},
  {team:'ONERS B',position:'정글',realName:'윤동현',nickname:'Classe',tag:'KR711',sets:7,kills:18,deaths:40,assists:68,teamKills:136},
  {team:'ONERS B',position:'미드',realName:'최건영',nickname:'skgun00',tag:'KR1',sets:7,kills:42,deaths:42,assists:28,teamKills:136},
  {team:'ONERS B',position:'원딜',realName:'박유준',nickname:'보성말차',tag:'KR11',sets:7,kills:44,deaths:32,assists:39,teamKills:136},
  {team:'ONERS B',position:'서폿',realName:'문영서',nickname:'쥰옹두천',tag:'0902',sets:7,kills:4,deaths:31,assists:83,teamKills:136},

  {team:'ONERS C',position:'탑',realName:'신승원',nickname:'빡쳐서뒤돌아보지마',tag:'liam',sets:5,kills:29,deaths:27,assists:15,teamKills:81},
  {team:'ONERS C',position:'정글',realName:'김도연',nickname:'은경자',tag:'KR1',sets:5,kills:13,deaths:22,assists:18,teamKills:81},
  {team:'ONERS C',position:'미드',realName:'배수빈',nickname:'삼봉봉',tag:'JYP',sets:5,kills:8,deaths:25,assists:26,teamKills:81},
  {team:'ONERS C',position:'원딜',realName:'이수영',nickname:'롤한판하고접음',tag:'KR1',sets:5,kills:22,deaths:27,assists:23,teamKills:81},
  {team:'ONERS C',position:'서폿',realName:'안재정',nickname:'무적해병상승해병귀신잡는해병대',tag:'안재정',sets:5,kills:9,deaths:36,assists:35,teamKills:81},
];

export const playerKda = (player: LolPlayerStat) =>
  player.deaths === 0 ? Infinity : (player.kills + player.assists) / player.deaths;

export const killParticipation = (player: LolPlayerStat) =>
  player.teamKills === 0 ? 0 : ((player.kills + player.assists) / player.teamKills) * 100;
