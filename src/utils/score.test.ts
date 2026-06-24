import { describe, it, expect } from "vitest";
import { calcScoreDeltas, yakuRankName } from "@/utils/score";
import type { Player } from "@/store";

function makePlayers(overrides: Partial<Player>[] = []): Player[] {
  return Array.from({ length: 4 }, (_, i) => ({
    name: `Player ${i}`,
    score: 500,
    type: (i === 0 ? "human" : "cpu") as "human" | "cpu",
    imageUrl: "",
    colorHex: "#000",
    charId: "aimoge",
    ...(overrides[i] ?? {}),
  }));
}

function singleYaku(yaku: number) {
  return [{ name: "test", yaku }];
}

describe("yakuRankName（役ランク名の取得）", () => {
  it("5翻で満貫", () => {
    expect(yakuRankName(5)).toBe("満貫");
  });
  it("6翻で跳満", () => {
    expect(yakuRankName(6)).toBe("跳満");
  });
  it("8翻で倍満", () => {
    expect(yakuRankName(8)).toBe("倍満");
  });
  it("11翻で三倍満", () => {
    expect(yakuRankName(11)).toBe("三倍満");
  });
  it("13翻以上で役満", () => {
    expect(yakuRankName(13)).toBe("役満");
  });
  it("0翻はundefined", () => {
    expect(yakuRankName(0)).toBeUndefined();
  });
  it("4翻はundefined", () => {
    expect(yakuRankName(4)).toBeUndefined();
  });
});

describe("calcScoreDeltas（点数計算）", () => {
  it("流局は全員0点", () => {
    const deltas = calcScoreDeltas({
      ryuukyoku: true,
      winner: null,
      yaku: singleYaku(0),
      players: makePlayers(),
      parentIndex: 0,
      isRon: false,
      ronTarget: null,
    });
    expect(deltas).toEqual([0, 0, 0, 0]);
  });

  it("勝者nullは全員0点", () => {
    const deltas = calcScoreDeltas({
      ryuukyoku: false,
      winner: null,
      yaku: singleYaku(5),
      players: makePlayers(),
      parentIndex: 0,
      isRon: false,
      ronTarget: null,
    });
    expect(deltas).toEqual([0, 0, 0, 0]);
  });

  describe("ロン", () => {
    it("子のロン：放銃者が全額支払う", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 1,
        yaku: singleYaku(3),
        players: makePlayers(),
        parentIndex: 0,
        isRon: true,
        ronTarget: 2,
      });
      expect(deltas[1]).toBe(40);
      expect(deltas[2]).toBe(-40);
      expect(deltas[0]).toBe(0);
      expect(deltas[3]).toBe(0);
    });

    it("親のロン：スコア×1.5を受け取る", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 0,
        yaku: singleYaku(3),
        players: makePlayers(),
        parentIndex: 0,
        isRon: true,
        ronTarget: 1,
      });
      expect(deltas[0]).toBe(60);
      expect(deltas[1]).toBe(-60);
    });

    it("シランガード発動中：双方0点", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 1,
        yaku: singleYaku(3),
        players: makePlayers(),
        parentIndex: 0,
        isRon: true,
        ronTarget: 2,
        siranGuardActive: [false, false, true, false],
      });
      expect(deltas[1]).toBe(0);
      expect(deltas[2]).toBe(0);
    });
  });

  describe("ツモ", () => {
    it("親のツモ：他の3人が均等に支払う", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 0,
        yaku: singleYaku(5),
        players: makePlayers(),
        parentIndex: 0,
        isRon: false,
        ronTarget: null,
      });
      const perPlayer = Math.floor(Math.floor(80 * 1.5) / 3);
      expect(deltas[0]).toBe(perPlayer * 3);
      expect(deltas[1]).toBe(-perPlayer);
      expect(deltas[2]).toBe(-perPlayer);
      expect(deltas[3]).toBe(-perPlayer);
    });

    it("子のツモ：親は2倍、子は1倍を支払う", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 1,
        yaku: singleYaku(5),
        players: makePlayers(),
        parentIndex: 0,
        isRon: false,
        ronTarget: null,
      });
      const perPlayer = Math.floor(80 / 3);
      expect(deltas[1]).toBe(perPlayer * (1 + 2 + 1));
      expect(deltas[0]).toBe(-(perPlayer * 2));
      expect(deltas[2]).toBe(-perPlayer);
      expect(deltas[3]).toBe(-perPlayer);
    });

    it("シランガード発動中：保護されたプレイヤーは支払わない", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 1,
        yaku: singleYaku(3),
        players: makePlayers(),
        parentIndex: 0,
        isRon: false,
        ronTarget: null,
        siranGuardActive: [false, false, true, false],
      });
      const perPlayer = Math.floor(40 / 3);
      expect(deltas[1]).toBe(perPlayer * 3);
      expect(deltas[2]).toBe(0);
      expect(deltas[0]).toBe(-(perPlayer * 2));
    });
  });

  describe("スコア変換のエッジケース", () => {
    it("0翻はスコア0", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 0,
        yaku: singleYaku(0),
        players: makePlayers(),
        parentIndex: 0,
        isRon: true,
        ronTarget: 1,
      });
      expect(deltas[0] === 0).toBe(true);
      expect(deltas[1] === 0).toBe(true);
    });

    it("13翻以上は役満（320点）", () => {
      const deltas = calcScoreDeltas({
        ryuukyoku: false,
        winner: 1,
        yaku: singleYaku(13),
        players: makePlayers(),
        parentIndex: 0,
        isRon: true,
        ronTarget: 2,
      });
      expect(deltas[1]).toBe(320);
      expect(deltas[2]).toBe(-320);
    });
  });
});
