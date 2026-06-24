import { describe, it, expect } from "vitest";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";

// Color mapping:
//   0: aimoge, 1: burumoge, 2: miimoge, 3: pikasan,
//   4: siran,  5: anoko,    6: imouto,  7: anemoge, 8: otyanti

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

describe("evaluateSpecialYaku", () => {
  it("人気者（あいもげ+ぶるもげ+知らん女）各3枚以上で5翻", () => {
    const tiles = [
      c(0), c(0, 1), c(0, 2),
      c(1), c(1, 1), c(1, 2),
      c(4), c(4, 1), c(4, 2),
    ];
    const results = evaluateSpecialYaku(tiles);
    const ninki = results.find((r) => r.name === "人気者");
    expect(ninki).toBeDefined();
    expect(ninki!.yaku).toBe(5);
  });

  it("人気者：1キャラが3枚未満なら非成立", () => {
    const tiles = [
      c(0), c(0, 1), c(0, 2),
      c(1), c(1, 1),
      c(4), c(4, 1), c(4, 2),
    ];
    const results = evaluateSpecialYaku(tiles);
    expect(results.find((r) => r.name === "人気者")).toBeUndefined();
  });

  it("サーバー管理者（あいもげ+ピカさん）各3枚以上で1翻", () => {
    const tiles = [
      c(0), c(0, 1), c(0, 2),
      c(3), c(3, 1), c(3, 2),
    ];
    const results = evaluateSpecialYaku(tiles);
    expect(results.find((r) => r.name === "サーバー管理者")).toBeDefined();
  });

  it("あいもげラジオ（あいもげ+おちゃんち）各3枚以上で1翻", () => {
    const tiles = [
      c(0), c(0, 1), c(0, 2),
      c(8), c(8, 1), c(8, 2),
    ];
    const results = evaluateSpecialYaku(tiles);
    expect(results.find((r) => r.name === "あいもげラジオ")).toBeDefined();
  });

  it("複数の特殊役が同時成立する", () => {
    const tiles = [
      c(0), c(0, 1), c(0, 2),
      c(3), c(3, 1), c(3, 2),
      c(8), c(8, 1), c(8, 2),
    ];
    const results = evaluateSpecialYaku(tiles);
    expect(results.find((r) => r.name === "サーバー管理者")).toBeDefined();
    expect(results.find((r) => r.name === "あいもげラジオ")).toBeDefined();
  });

  it("該当コンボなしで空配列", () => {
    const tiles = [c(0), c(1), c(2)];
    const results = evaluateSpecialYaku(tiles);
    expect(results).toEqual([]);
  });
});
