import { describe, it, expect } from "vitest";
import {
  canFormWinningHand,
  canFormAllStarHand,
  canFormTenpai,
  findWaiterId,
  getEligiblePonPlayerIndexes,
  findAllWaitingColors,
  canFormAllStarTenpai,
  findAllStarWaiterId,
} from "@/utils/check";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

describe("canFormAllStarHand（全員集合の判定）", () => {
  it("9色すべて揃っている場合はtrue", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)];
    expect(canFormAllStarHand(tiles)).toBe(true);
  });

  it("余分な牌があっても9色揃っていればtrue", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8), c(0, 1), c(1, 1)];
    expect(canFormAllStarHand(tiles)).toBe(true);
  });

  it("9色未満ならfalse", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7)];
    expect(canFormAllStarHand(tiles)).toBe(false);
  });

  it("1色足りなければfalse", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(7, 1)];
    expect(canFormAllStarHand(tiles)).toBe(false);
  });
});

describe("canFormWinningHand（アガリ形の判定）", () => {
  it("3組の3枚同一色で構成された9枚はアガリ", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(2)];
    expect(canFormWinningHand(tiles)).toBe(true);
  });

  it("全員集合（9色1枚ずつ）もアガリ", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)];
    expect(canFormWinningHand(tiles)).toBe(true);
  });

  it("枚数が3の倍数でない場合はfalse", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1)];
    expect(canFormWinningHand(tiles)).toBe(false);
  });

  it("グループ数が足りなければfalse", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(2), c(2), c(3), c(3)];
    expect(canFormWinningHand(tiles)).toBe(false);
  });

  it("12枚（4グループ）でもアガリ", () => {
    const tiles = [
      c(0), c(0), c(0),
      c(1), c(1), c(1),
      c(2), c(2), c(2),
      c(3), c(3), c(3),
    ];
    expect(canFormWinningHand(tiles)).toBe(true);
  });
});

describe("canFormAllStarTenpai（全員集合テンパイの判定）", () => {
  it("9枚中8色が揃っていればtrue（1色重複）", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(0, 1)];
    expect(canFormAllStarTenpai(tiles)).toBe(true);
  });

  it("既にアガリ形（9色揃い）でもtrue", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(8)];
    expect(canFormAllStarTenpai(tiles)).toBe(true);
  });

  it("7色しかなければfalse", () => {
    const tiles = [c(0), c(0, 1), c(0, 2), c(1), c(2), c(3), c(4), c(5), c(6)];
    expect(canFormAllStarTenpai(tiles)).toBe(false);
  });

  it("枚数が9枚でなければfalse", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7)];
    expect(canFormAllStarTenpai(tiles)).toBe(false);
  });
});

describe("findAllStarWaiterId（全員集合の待ち牌特定）", () => {
  it("重複している色を捨て牌候補として返す", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(0, 1)];
    const waiter = findAllStarWaiterId(tiles);
    expect(waiter).toBe(c(0));
  });

  it("枚数が9枚でなければnull", () => {
    expect(findAllStarWaiterId([c(0), c(1), c(2)])).toBeNull();
  });
});

describe("canFormTenpai（テンパイ判定）", () => {
  it("標準的なテンパイ形（1枚切ると2メンツ+雀頭）", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(3)];
    expect(canFormTenpai(tiles)).toBe(true);
  });

  it("全員集合テンパイもtrue", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(0, 1)];
    expect(canFormTenpai(tiles)).toBe(true);
  });

  it("既にアガリ形でもtrue（グループから1枚切ればテンパイ）", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(2)];
    expect(canFormTenpai(tiles)).toBe(true);
  });

  it("テンパイでなければfalse", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(2), c(3), c(4), c(5), c(6)];
    expect(canFormTenpai(tiles)).toBe(false);
  });
});

describe("findWaiterId（待ち牌の特定）", () => {
  it("標準テンパイの捨てたい牌を返す", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(3)];
    expect(findWaiterId(tiles)).toBe(c(3));
  });

  it("全員集合テンパイでは重複牌を返す", () => {
    const tiles = [c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7), c(0, 1)];
    expect(findWaiterId(tiles)).toBe(c(0));
  });

  it("アガリ形でも捨て牌候補が存在する", () => {
    const tiles = [c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(2)];
    expect(findWaiterId(tiles)).not.toBeNull();
  });

  it("枚数違いはnull", () => {
    expect(findWaiterId([c(0), c(1)])).toBeNull();
  });
});

describe("getEligiblePonPlayerIndexes（ポン可能なプレイヤーの検出）", () => {
  it("該当プレイヤーがいなければ空配列", () => {
    const result = getEligiblePonPlayerIndexes({
      hands: [[c(0)], [c(1)], [c(2)], [c(3)]],
      riichi: [false, false, false, false],
      tileId: c(0),
      exceptPlayer: 0,
    });
    expect(result).toEqual([]);
  });

  it("同じ色を2枚以上持つプレイヤーを検出する", () => {
    const result = getEligiblePonPlayerIndexes({
      hands: [[c(0)], [c(1), c(1, 1), c(2), c(3), c(4)], [c(2)], [c(3)]],
      riichi: [false, false, false, false],
      tileId: c(1),
      exceptPlayer: 0,
    });
    expect(result).toEqual([1]);
  });

  it("リーチ中のプレイヤーは除外", () => {
    const result = getEligiblePonPlayerIndexes({
      hands: [[c(0)], [c(1), c(1, 1)], [c(2)], [c(3)]],
      riichi: [false, true, false, false],
      tileId: c(1),
      exceptPlayer: 0,
    });
    expect(result).toEqual([]);
  });

  it("手牌が5枚未満のプレイヤーはスキップ", () => {
    const result = getEligiblePonPlayerIndexes({
      hands: [[c(0)], [c(1), c(1, 1), c(0), c(0, 1)], [c(2)], [c(3)]],
      riichi: [false, false, false, false],
      tileId: c(1),
      exceptPlayer: 0,
    });
    expect(result).toEqual([]);
  });

  it("exceptPlayer自身は除外", () => {
    const result = getEligiblePonPlayerIndexes({
      hands: [[c(0), c(0, 1), c(0, 2), c(0, 3), c(0, 4)], [c(1)], [c(2)], [c(3)]],
      riichi: [false, false, false, false],
      tileId: c(0),
      exceptPlayer: 0,
    });
    expect(result).toEqual([]);
  });
});

describe("findAllWaitingColors（待ち色の全検出）", () => {
  it("単純なテンパイ形で待ち色を検出", () => {
    const hand = [c(0), c(0), c(0), c(1), c(1)];
    const openMelds: number[][] = [];
    const trendTypes: number[] = [];
    const waiting = findAllWaitingColors(hand, openMelds, trendTypes);
    expect(waiting).toContain(1);
  });

  it("アガリ牌がない場合は空配列", () => {
    const hand = [c(0), c(1), c(2)];
    const openMelds: number[][] = [];
    const trendTypes: number[] = [];
    const waiting = findAllWaitingColors(hand, openMelds, trendTypes);
    expect(waiting).toEqual([]);
  });
});
