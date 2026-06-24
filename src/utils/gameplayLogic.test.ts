import { describe, it, expect } from "vitest";
import {
  getCutinRarity,
  getCutinImageVariant,
  shouldUseEchoVoice,
  getRiichiWinningCandidates,
  getProjectedTotalYaku,
  canDeclareRiichiForTiles,
} from "@/utils/gameplayLogic";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

describe("getCutinRarity（カットインレアリティ判定）", () => {
  it("13翻以上でepic", () => {
    expect(getCutinRarity(13)).toBe("epic");
    expect(getCutinRarity(20)).toBe("epic");
  });
  it("6～12翻でrare", () => {
    expect(getCutinRarity(6)).toBe("rare");
    expect(getCutinRarity(8)).toBe("rare");
    expect(getCutinRarity(12)).toBe("rare");
  });
  it("0～5翻でnormal", () => {
    expect(getCutinRarity(0)).toBe("normal");
    expect(getCutinRarity(3)).toBe("normal");
    expect(getCutinRarity(5)).toBe("normal");
  });
});

describe("getCutinImageVariant（カットイン画像バリアント判定）", () => {
  it("8翻以上でbaiman", () => {
    expect(getCutinImageVariant(8)).toBe("baiman");
    expect(getCutinImageVariant(13)).toBe("baiman");
  });
  it("8翻未満でnormal", () => {
    expect(getCutinImageVariant(0)).toBe("normal");
    expect(getCutinImageVariant(7)).toBe("normal");
  });
});

describe("shouldUseEchoVoice（エコーボイス判定）", () => {
  it("rare以上でエコーボイス", () => {
    expect(shouldUseEchoVoice(6)).toBe(true);
    expect(shouldUseEchoVoice(13)).toBe(true);
  });
  it("normalレアリティではエコーボイスなし", () => {
    expect(shouldUseEchoVoice(0)).toBe(false);
    expect(shouldUseEchoVoice(5)).toBe(false);
  });
});

describe("getRiichiWinningCandidates（リーチ和了候補一覧）", () => {
  it("9種類の基本牌IDを含む", () => {
    const candidates = getRiichiWinningCandidates([0, 1]);
    for (let colorIdx = 0; colorIdx < 9; colorIdx++) {
      expect(candidates).toContain(c(colorIdx));
    }
  });

  it("流行タイプのトレンド牌も含む", () => {
    const candidates = getRiichiWinningCandidates([2, 5]);
    const trendBase = 82;
    expect(candidates).toContain(trendBase + 2 * 4);
    expect(candidates).toContain(trendBase + 5 * 4);
  });
});

describe("getProjectedTotalYaku（投影翻数計算）", () => {
  it("ロン・リーチなし・役なしで0翻", () => {
    const total = getProjectedTotalYaku({
      riichi: false,
      doubleReach: false,
      ippatsu: false,
      isRon: true,
      hasPonMelds: false,
      doraTile: null,
      uradoraTile: null,
      allTiles: [c(0), c(1), c(2)],
      winnerDiscardsEmpty: false,
      playerName: "nonexistent",
      trendTypes: [],
    });
    expect(total).toBe(0);
  });

  it("リーチありで最低2翻（リーチ+メンゼン）", () => {
    const total = getProjectedTotalYaku({
      riichi: true,
      doubleReach: false,
      ippatsu: false,
      isRon: true,
      hasPonMelds: false,
      doraTile: null,
      uradoraTile: null,
      allTiles: [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1), c(2, 2)],
      winnerDiscardsEmpty: false,
      playerName: "nonexistent",
      trendTypes: [],
    });
    expect(total).toBeGreaterThanOrEqual(2);
  });

  it("全員集合（3翻）を検出できる", () => {
    const allTiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)];
    const total = getProjectedTotalYaku({
      riichi: false,
      doubleReach: false,
      ippatsu: false,
      isRon: false,
      hasPonMelds: false,
      doraTile: null,
      uradoraTile: null,
      allTiles,
      winnerDiscardsEmpty: false,
      playerName: "nonexistent",
      trendTypes: [],
    });
    expect(total).toBeGreaterThanOrEqual(3);
  });
});

describe("canDeclareRiichiForTiles（リーチ宣言可否判定）", () => {
  it("有効な捨て牌と2翻以上の条件でtrue", () => {
    const result = canDeclareRiichiForTiles({
      tiles: [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(3)],
      discardTileId: c(3),
      openMeldTiles: [],
      hasPonMelds: false,
      doraTile: null,
      playerName: "nonexistent",
      trendTypes: [],
      winnerDiscardsEmpty: false,
      doubleReach: false,
      minTotalYaku: 2,
    });
    expect(result).toBe(true);
  });

  it("必要翻数に達しなければfalse", () => {
    const result = canDeclareRiichiForTiles({
      tiles: [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(3)],
      discardTileId: c(3),
      openMeldTiles: [],
      hasPonMelds: false,
      doraTile: null,
      playerName: "nonexistent",
      trendTypes: [],
      winnerDiscardsEmpty: false,
      doubleReach: false,
      minTotalYaku: 99,
    });
    expect(result).toBe(false);
  });

  it("全員集合テンパイもリーチ可能", () => {
    const result = canDeclareRiichiForTiles({
      tiles: [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)],
      discardTileId: c(0),
      openMeldTiles: [],
      hasPonMelds: false,
      doraTile: null,
      playerName: "nonexistent",
      trendTypes: [],
      winnerDiscardsEmpty: false,
      doubleReach: false,
    });
    expect(result).toBe(true);
  });

  it("ダブルリーチ（捨て牌0）の条件を考慮する", () => {
    const result = canDeclareRiichiForTiles({
      tiles: [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(3)],
      discardTileId: c(3),
      openMeldTiles: [],
      hasPonMelds: false,
      doraTile: null,
      playerName: "nonexistent",
      trendTypes: [],
      winnerDiscardsEmpty: true,
      doubleReach: true,
      minTotalYaku: 3,
    });
    // ダブルリーチ(2) + メンゼン(1) + 天地人(13) = 16翻 → 条件クリア
    expect(result).toBe(true);
  });
});
