import { describe, it, expect } from "vitest";
import {
  buildWinnerTiles,
  canShowUradora,
  evaluateWinner,
  type WinEvaluationContext,
} from "@/utils/winResult";
import type { Player } from "@/store";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

function makeContext(overrides?: Partial<WinEvaluationContext>): WinEvaluationContext {
  return {
    players: [
      { name: "Player 0", score: 500, type: "human", imageUrl: "", colorHex: "#000", charId: "aimoge" },
      { name: "Player 1", score: 500, type: "cpu", imageUrl: "", colorHex: "#111", charId: "burumoge" },
      { name: "Player 2", score: 500, type: "cpu", imageUrl: "", colorHex: "#222", charId: "miimoge" },
      { name: "Player 3", score: 500, type: "cpu", imageUrl: "", colorHex: "#333", charId: "siran" },
    ] as Player[],
    winner: 0,
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
    anokoSubstitutionPending: [false, false, false, false],
    ...overrides,
  };
}

describe("buildWinnerTiles（勝者の全タイル構築）", () => {
  it("勝者nullなら空配列", () => {
    const ctx = makeContext({ winner: null });
    expect(buildWinnerTiles(ctx)).toEqual([]);
  });

  it("ツモ和了：手牌＋ポンメンツ＋ツモ牌を含む", () => {
    const ctx = makeContext({
      winner: 0,
      hands: [[c(0), c(0, 1), c(0, 2)], [], [], []],
      ponMelds: [[[c(1), c(1, 1), c(1, 2)]], [], [], []],
      drawnTile: c(2),
    });
    const tiles = buildWinnerTiles(ctx);
    expect(tiles).toContain(c(0));
    expect(tiles).toContain(c(1));
    expect(tiles).toContain(c(2));
  });

  it("ロン和了：最終捨て牌を含む", () => {
    const ctx = makeContext({
      winner: 0,
      isRon: true,
      ronTarget: 1,
      hands: [[c(0), c(0, 1), c(0, 2)], [], [], []],
      discards: [[], [c(3)], [], []],
      drawnTile: null,
    });
    const tiles = buildWinnerTiles(ctx);
    expect(tiles).toContain(c(3));
  });

  it("ツモ和了でツモ牌あり", () => {
    const ctx = makeContext({
      winner: 0,
      hands: [[c(0), c(0, 1)], [], [], []],
      drawnTile: c(0, 2),
    });
    const tiles = buildWinnerTiles(ctx);
    expect(tiles).toContain(c(0, 2));
  });
});

describe("canShowUradora（裏ドラ表示条件）", () => {
  it("勝者nullならfalse", () => {
    expect(canShowUradora(makeContext({ winner: null }))).toBe(false);
  });

  it("裏ドラ表示牌nullならfalse", () => {
    expect(canShowUradora(makeContext({ uradoraTile: null }))).toBe(false);
  });

  it("リーチ宣言していなければfalse", () => {
    expect(canShowUradora(makeContext({ winner: 0, uradoraTile: c(0), riichi: [false, false, false, false] }))).toBe(false);
  });

  it("ポンがあるとfalse", () => {
    expect(canShowUradora(makeContext({
      winner: 0,
      uradoraTile: c(0),
      riichi: [true, false, false, false],
      ponMelds: [[[c(1), c(1, 1), c(1, 2)]], [], [], []],
    }))).toBe(false);
  });

  it("条件成立（リーチ・メンゼン・裏ドラあり）", () => {
    expect(canShowUradora(makeContext({
      winner: 0,
      uradoraTile: c(0),
      riichi: [true, false, false, false],
    }))).toBe(true);
  });
});

describe("evaluateWinner（勝者の役評価）", () => {
  it("勝者nullなら空配列", () => {
    expect(evaluateWinner(makeContext({ winner: null }))).toEqual([]);
  });

  it("リーチ中の勝者にリーチ役が付与される", () => {
    const ctx = makeContext({
      winner: 0,
      riichi: [true, false, false, false],
      hands: [[c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], [], []],
      drawnTile: c(2, 2),
    });
    const results = evaluateWinner(ctx);
    expect(results.some((r) => r.name === "リーチ")).toBe(true);
  });

  it("ツモ和了でツモ役が付与される", () => {
    const ctx = makeContext({
      winner: 0,
      hands: [[c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], [], []],
      drawnTile: c(2, 2),
    });
    const results = evaluateWinner(ctx);
    expect(results.some((r) => r.name === "ツモ")).toBe(true);
  });

  it("ピカさんボーナス保留中は「そうだね」が追加", () => {
    const ctx = makeContext({
      winner: 0,
      pikasanBonusPending: [true, false, false, false],
      hands: [[c(0)], [], [], []],
    });
    const results = evaluateWinner(ctx);
    expect(results.some((r) => r.name === "そうだね")).toBe(true);
  });
});
