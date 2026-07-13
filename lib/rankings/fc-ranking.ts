import type { FcMatch, FcPlayer } from "../data";

export type FcRow = {
  name: string;
  seed: number;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

type CarryRow = Pick<FcRow, "played" | "w" | "d" | "l" | "gf" | "ga" | "points">;

const COMPLETED = "\uC644\uB8CC";

export function rankFc(
  players: FcPlayer[],
  matches: FcMatch[],
  carry: Partial<Record<string, CarryRow>> = {},
): FcRow[] {
  const rows = new Map<string, FcRow>();

  for (const player of players) {
    const initial = carry[player.name];
    rows.set(player.name, {
      name: player.name,
      seed: player.seed,
      played: initial?.played ?? 0,
      w: initial?.w ?? 0,
      d: initial?.d ?? 0,
      l: initial?.l ?? 0,
      gf: initial?.gf ?? 0,
      ga: initial?.ga ?? 0,
      gd: 0,
      points: initial?.points ?? 0,
    });
  }

  for (const match of matches) {
    if (match.status !== COMPLETED || match.sa === null || match.sb === null) continue;
    const a = rows.get(match.a);
    const b = rows.get(match.b);
    if (!a || !b) continue;

    a.played += 1;
    b.played += 1;
    a.gf += match.sa;
    a.ga += match.sb;
    b.gf += match.sb;
    b.ga += match.sa;

    if (match.sa > match.sb) {
      a.w += 1;
      b.l += 1;
      a.points += 3;
    } else if (match.sa < match.sb) {
      b.w += 1;
      a.l += 1;
      b.points += 3;
    } else {
      a.d += 1;
      b.d += 1;
      a.points += 1;
      b.points += 1;
    }
  }

  for (const row of rows.values()) row.gd = row.gf - row.ga;

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      headToHead(a, b, matches) ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.seed - b.seed,
  );
}

function headToHead(a: FcRow, b: FcRow, matches: FcMatch[]): number {
  const meetings = matches.filter(
    (match) =>
      match.status === COMPLETED &&
      ((match.a === a.name && match.b === b.name) ||
        (match.a === b.name && match.b === a.name)),
  );
  let aPoints = 0;
  let bPoints = 0;

  for (const match of meetings) {
    const aScore = match.a === a.name ? match.sa! : match.sb!;
    const bScore = match.a === b.name ? match.sa! : match.sb!;
    if (aScore > bScore) aPoints += 3;
    else if (bScore > aScore) bPoints += 3;
    else {
      aPoints += 1;
      bPoints += 1;
    }
  }

  return bPoints - aPoints;
}
