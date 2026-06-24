import { describe, it, expect } from "vitest";
import { TREND_TILE_START } from "@/constants/tiles";
import { evaluateYaku, type YakuResult } from "@/utils/evaluateYaku";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}
function trend(trendIndex: number): number {
  return TREND_TILE_START + trendIndex * 4;
}

function makeBase() {
  return {
    riichi: false,
    doubleReach: false,
    ippatsu: false,
    isRon: false,
    hasPonMelds: false,
    doraTile: null as number | null,
    uradoraTile: null as number | null,
    allTiles: [] as number[],
    winnerDiscardsEmpty: false,
    playerName: "あいもげ",
    trendTypes: [] as number[],
  };
}

function findYaku(results: YakuResult[], name: string): YakuResult | undefined {
  return results.find((r) => r.name === name);
}

function expectHasYaku(results: YakuResult[], name: string, yaku?: number) {
  const found = findYaku(results, name);
  if (yaku != null) {
    expect(found).toBeDefined();
    expect(found!.yaku).toBe(yaku);
  } else {
    expect(found).toBeDefined();
  }
}

function expectNotYaku(results: YakuResult[], name: string) {
  expect(findYaku(results, name)).toBeUndefined();
}

describe("evaluateYaku", () => {
  describe("ボーナス役 - リーチ", () => {
    it("リーチ中はリーチ役が付与される（1翻）", () => {
      const result = evaluateYaku({ ...makeBase(), riichi: true });
      expectHasYaku(result, "リーチ", 1);
    });

    it("ダブルリーチの場合はWリーチ（2翻）、通常リーチとは重複しない", () => {
      const result = evaluateYaku({ ...makeBase(), doubleReach: true });
      expectHasYaku(result, "Wリーチ", 2);
      expectNotYaku(result, "リーチ");
    });
  });

  describe("ボーナス役 - メンゼン", () => {
    it("リーチかつポンなしでメンゼン（1翻）", () => {
      const result = evaluateYaku({ ...makeBase(), riichi: true, hasPonMelds: false });
      expectHasYaku(result, "メンゼン", 1);
    });

    it("ポンがあるとメンゼンは付与されない", () => {
      const result = evaluateYaku({ ...makeBase(), riichi: true, hasPonMelds: true });
      expectNotYaku(result, "メンゼン");
    });
  });

  describe("ボーナス役 - イッパツ", () => {
    it("イッパツ中はイッパツ役（1翻）", () => {
      const result = evaluateYaku({ ...makeBase(), ippatsu: true });
      expectHasYaku(result, "イッパツ", 1);
    });
  });

  describe("ボーナス役 - ツモ", () => {
    it("ロン以外はツモ役（1翻）", () => {
      const result = evaluateYaku({ ...makeBase(), isRon: false });
      expectHasYaku(result, "ツモ", 1);
    });

    it("ロンの場合はツモ役なし", () => {
      const result = evaluateYaku({ ...makeBase(), isRon: true });
      expectNotYaku(result, "ツモ");
    });
  });

  describe("ボーナス役 - ドラ", () => {
    it("ドラ表示牌と同色を3枚以上でドラ（1翻）", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(2)];
      const result = evaluateYaku({ ...makeBase(), doraTile: c(0), allTiles });
      expectHasYaku(result, "ドラ", 1);
    });

    it("ドラ表示牌がnullならドラなし", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2)];
      const result = evaluateYaku({ ...makeBase(), doraTile: null, allTiles });
      expectNotYaku(result, "ドラ");
    });

    it("3枚未満ならドラなし", () => {
      const allTiles = [c(0), c(0, 1), c(1)];
      const result = evaluateYaku({ ...makeBase(), doraTile: c(0), allTiles });
      expectNotYaku(result, "ドラ");
    });
  });

  describe("ボーナス役 - 裏ドラ", () => {
    it("メンゼンかつ裏ドラ表示牌と同色3枚以上で裏ドラ（1翻）", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1)];
      const result = evaluateYaku({
        ...makeBase(),
        hasPonMelds: false,
        uradoraTile: c(0),
        allTiles,
      });
      expectHasYaku(result, "裏ドラ", 1);
    });

    it("ポンありだと裏ドラなし", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1)];
      const result = evaluateYaku({
        ...makeBase(),
        hasPonMelds: true,
        uradoraTile: c(0),
        allTiles,
      });
      expectNotYaku(result, "裏ドラ");
    });
  });

  describe("ボーナス役 - 自風", () => {
    it("自分のキャラと同じ牌を3枚以上で自風（1翻）", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1)];
      const result = evaluateYaku({
        ...makeBase(),
        playerName: "あいもげ",
        allTiles,
      });
      expectHasYaku(result, "自風", 1);
    });

    it("3枚未満なら自風なし", () => {
      const allTiles = [c(0), c(0, 1), c(1)];
      const result = evaluateYaku({
        ...makeBase(),
        playerName: "あいもげ",
        allTiles,
      });
      expectNotYaku(result, "自風");
    });
  });

  describe("ボーナス役 - 他風", () => {
    it("流行牌と同種を3枚以上で他風（1翻）", () => {
      const allTiles = [trend(0), trend(0) + 1, trend(0) + 2, trend(0) + 3, c(0)];
      const result = evaluateYaku({
        ...makeBase(),
        trendTypes: [0, 1, 2, 3],
        allTiles,
      });
      expectHasYaku(result, "他風", 1);
    });

    it("流行タイプがなければ他風なし", () => {
      const allTiles = [trend(0), trend(0) + 1, trend(0) + 2];
      const result = evaluateYaku({
        ...makeBase(),
        trendTypes: [],
        allTiles,
      });
      expectNotYaku(result, "他風");
    });
  });

  describe("基本役 - 天地人", () => {
    it("捨て牌0で天地人（13翻）", () => {
      const result = evaluateYaku({ ...makeBase(), winnerDiscardsEmpty: true });
      expectHasYaku(result, "天地人", 13);
    });
  });

  describe("基本役 - 流行の予感", () => {
    it("全牌が流行牌で流行の予感（13翻）", () => {
      const allTiles = [trend(0), trend(1), trend(2), trend(0) + 1, trend(1) + 1, trend(2) + 1];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectHasYaku(result, "流行の予感", 13);
    });

    it("通常牌が混ざると非成立", () => {
      const allTiles = [trend(0), c(0)];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectNotYaku(result, "流行の予感");
    });
  });

  describe("基本役 - 全員集合", () => {
    it("9色すべて揃うと全員集合（3翻）", () => {
      const allTiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectHasYaku(result, "全員集合", 3);
    });

    it("1色足りなければ非成立", () => {
      const allTiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7)];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectNotYaku(result, "全員集合");
    });
  });

  describe("基本役 - カタログレイプ（メンゼン・1色・流行なし）", () => {
    it("条件成立で8翻", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(0, 3), c(0, 4), c(0, 5), c(0, 6), c(0, 7), c(0, 8)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: false, allTiles });
      expectHasYaku(result, "カタログレイプ", 8);
    });

    it("流行牌が混ざると非成立", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), trend(0)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: false, allTiles });
      expectNotYaku(result, "カタログレイプ");
    });

    it("ポンありだと非成立", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(0, 3)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: true, allTiles });
      expectNotYaku(result, "カタログレイプ");
    });
  });

  describe("基本役 - カタログレイプ（喰い）", () => {
    it("ポンあり・1色・流行なしで6翻", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(0, 3), c(0, 4)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: true, allTiles });
      expectHasYaku(result, "カタログレイプ（喰い）", 6);
    });
  });

  describe("基本役 - カタログレイプ（便乗）", () => {
    it("流行あり・1色で4翻", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), trend(0)];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectHasYaku(result, "カタログレイプ（便乗）", 4);
    });
  });

  describe("基本役 - ニコデスマン（メンゼン・2色・流行なし）", () => {
    it("条件成立で3翻", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: false, allTiles });
      expectHasYaku(result, "ニコデスマン", 3);
    });
  });

  describe("基本役 - ニコデスマン（喰い）", () => {
    it("ポンあり・2色・流行なしで2翻", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(1), c(1, 1)];
      const result = evaluateYaku({ ...makeBase(), hasPonMelds: true, allTiles });
      expectHasYaku(result, "ニコデスマン（喰い）", 2);
    });
  });

  describe("基本役 - ニコデスマン（便乗）", () => {
    it("流行あり・2色で1翻", () => {
      const allTiles = [c(0), c(0, 1), c(1), c(1, 1), trend(0)];
      const result = evaluateYaku({ ...makeBase(), allTiles });
      expectHasYaku(result, "ニコデスマン（便乗）", 1);
    });
  });

  describe("基本役の優先順位（初回一致が採用）", () => {
    it("天地人が最優先され、他の基本役は付与されない", () => {
      const allTiles = [c(0), c(0, 1), c(0, 2), c(0, 3)];
      const result = evaluateYaku({
        ...makeBase(),
        winnerDiscardsEmpty: true,
        hasPonMelds: false,
        allTiles,
      });
      expect(findYaku(result, "天地人")).toBeDefined();
      expect(findYaku(result, "カタログレイプ")).toBeUndefined();
    });
  });
});
