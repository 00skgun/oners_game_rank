import { describe, expect, it } from "vitest";
import { rankFc } from "./fc-ranking";
import { kda } from "./lol-stats";
import type { FcMatch, FcPlayer } from "../data";

const players: FcPlayer[] = [
  { id: "1", name: "Alpha", group: "A", seed: 2 },
  { id: "2", name: "Bravo", group: "A", seed: 1 },
  { id: "3", name: "Charlie", group: "A", seed: 3 },
];

function match(id: number, a: string, b: string, sa: number, sb: number): FcMatch {
  return { id, group: "A", round: 1, a, b, sa, sb, status: "\uC644\uB8CC" };
}

describe("FC ranking", () => {
  it("calculates points and goal difference", () => {
    const result = rankFc(players, [match(1, "Alpha", "Bravo", 2, 1)]);
    expect(result[0]).toMatchObject({ name: "Alpha", points: 3, gd: 1 });
  });

  it("uses head-to-head for a two-player tie", () => {
    const result = rankFc(players, [
      match(1, "Alpha", "Bravo", 1, 0),
      match(2, "Alpha", "Charlie", 0, 3),
      match(3, "Bravo", "Charlie", 5, 0),
    ]);
    expect(result.findIndex((row) => row.name === "Alpha"))
      .toBeLessThan(result.findIndex((row) => row.name === "Bravo"));
  });

  it("excludes unfinished matches", () => {
    const unfinished = { ...match(1, "Alpha", "Bravo", 3, 0), status: "\uBBF8\uC9C4\uD589" as const };
    expect(rankFc(players, [unfinished]).every((row) => row.played === 0)).toBe(true);
  });
});

describe("LoL stats", () => {
  it("calculates KDA", () => {
    expect(kda({ name: "A", sets: 1, kills: 10, deaths: 5, assists: 15 })).toBe("5.00");
  });

  it("returns Perfect when deaths are zero", () => {
    expect(kda({ name: "A", sets: 1, kills: 2, deaths: 0, assists: 3 })).toBe("Perfect");
  });
});
