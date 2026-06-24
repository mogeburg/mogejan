import { describe, it, expect } from "vitest";
import {
  buildWinContext,
  getPendingScoreDeltas,
  type RoundResolutionSnapshot,
} from "@/utils/roundResolution";
import type { Player } from "@/store";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

function makeSnapshot(overrides?: Partial<RoundResolutionSnapshot>): RoundResolutionSnapshot {
  return {
    players: [
      { name: "P0", score: 500, type: "human", imageUrl: "", colorHex: "#000", charId: "aimoge" },
      { name: "P1", score: 500, type: "cpu", imageUrl: "", colorHex: "#111", charId: "burumoge" },
      { name: "P2", score: 500, type: "cpu", imageUrl: "", colorHex: "#222", charId: "miimoge" },
      { name: "P3", score: 500, type: "cpu", imageUrl: "", colorHex: "#333", charId: "siran" },
    ] as Player[],
    parentIndex: 0,
    ryuukyoku: false,
    winner: null,
    riichi: [false, false, false, false],
    doubleReach: [false, false, false, false],
    ippatsu: [false, false, false, false],
    isRon: false,
    ronTarget: null,
    discards: [[], [], [], []],
    drawnTile: null,
    doraTile: null,
    uradoraTile: null,
    trendTypes: [] as number[],
    hands: [[], [], [], []],
    ponMelds: [[], [], [], []],
    pikasanBonusPending: [false, false, false, false],
    siranGuardActive: [false, false, false, false],
    ...overrides,
  };
}

describe("buildWinContext（スナップショット→評価コンテキスト変換）", () => {
  it("snapshotの全フィールドが正しくマッピングされる", () => {
    const snapshot = makeSnapshot({
      winner: 1,
      isRon: true,
      ronTarget: 2,
      doraTile: c(3),
      hands: [[c(0)], [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], []],
      drawnTile: c(2, 2),
    });
    const ctx = buildWinContext(snapshot);
    expect(ctx.winner).toBe(1);
    expect(ctx.isRon).toBe(true);
    expect(ctx.ronTarget).toBe(2);
    expect(ctx.doraTile).toBe(c(3));
    expect(ctx.hands[1]).toHaveLength(8);
  });
});

describe("getPendingScoreDeltas（保留中のスコア差分計算）", () => {
  it("流局は全員0点", () => {
    const deltas = getPendingScoreDeltas(makeSnapshot({ ryuukyoku: true, winner: null }));
    expect(deltas).toEqual([0, 0, 0, 0]);
  });

  it("勝者nullは全員0点", () => {
    const deltas = getPendingScoreDeltas(makeSnapshot({ winner: null }));
    expect(deltas).toEqual([0, 0, 0, 0]);
  });

  it("ロン和了のスコアを計算する", () => {
    const snapshot = makeSnapshot({
      winner: 1,
      isRon: true,
      ronTarget: 2,
      hands: [[c(0)], [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], []],
      drawnTile: c(2, 2),
      discards: [[], [c(3)], [c(2, 2)], []],
    });
    const deltas = getPendingScoreDeltas(snapshot);
    const totalScore = deltas.reduce((sum, d) => sum + Math.max(0, d), 0);
    expect(totalScore).toBeGreaterThan(0);
    expect(deltas[2]).toBeLessThan(0);
  });

  it("ツモ和了のスコアを計算する", () => {
    const snapshot = makeSnapshot({
      winner: 0,
      isRon: false,
      ronTarget: null,
      hands: [[c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], [], []],
      drawnTile: c(2, 2),
    });
    const deltas = getPendingScoreDeltas(snapshot);
    expect(deltas[0]).toBeGreaterThan(0);
    expect(deltas[1]).toBeLessThan(0);
    expect(deltas[2]).toBeLessThan(0);
    expect(deltas[3]).toBeLessThan(0);
  });

  it("シランガード発動中の支払いを反映する", () => {
    const snapshot = makeSnapshot({
      winner: 1,
      isRon: true,
      ronTarget: 2,
      siranGuardActive: [false, false, true, false],
      hands: [[c(0)], [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], []],
      drawnTile: c(2, 2),
      discards: [[], [c(3)], [c(2, 2)], []],
    });
    const deltas = getPendingScoreDeltas(snapshot);
    expect(deltas[1]).toBe(0);
    expect(deltas[2]).toBe(0);
  });
});
