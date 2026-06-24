import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store";
import {
  canDeclareRiichi,
  evaluateWin,
  shouldAutoDiscardRiichiHand,
  getAimogeDangerColors,
  canTsumoWithMiimoge,
} from "@/utils/gameplay";

function c(colorIndex: number, instance = 0): number {
  return colorIndex * 9 + 1 + instance;
}

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    winner: null,
    ryuukyoku: false,
    hands: [[], [], [], []],
    wall: [],
    discards: [[], [], [], []],
    drawnTile: null,
    turnIndex: 0,
    lastDiscard: null,
    pendingPon: null,
    pendingRon: null,
    isRon: false,
    ronTarget: null,
    ippatsu: [false, false, false, false],
    riichi: [false, false, false, false],
    doubleReach: [false, false, false, false],
    riichiDiscardPositions: [null, null, null, null],
    ponMelds: [[], [], [], []],
    takenDiscards: [[], [], [], []],
    specialAbilitiesEnabled: false,
    abilityGauge: [0, 0, 0, 0],
    abilityReady: [false, false, false, false],
    abilityChargeLocked: [false, false, false, false],
    abilityCutinActive: false,
    abilityCutinPlayer: null,
    abilityCutinText: "",
    abilityCutinQueue: [],
    pendingRiichiCutin: null,
    doraTile: null,
    uradoraTile: null,
    trendTypes: [] as number[],
    currentDealWallLength: 0,
    scoreDeltas: [0, 0, 0, 0],
    parentIndex: 0,
    speed: 3,
    aimogeDangerColors: [[], [], [], []],
    pikasanBonusPending: [false, false, false, false],
    miimogeActive: false,
    cpuStrength: "normal",
    players: [
      { name: "P0", score: 500, type: "human", imageUrl: "", colorHex: "#000", charId: "aimoge" },
      { name: "P1", score: 500, type: "cpu", imageUrl: "", colorHex: "#111", charId: "burumoge" },
      { name: "P2", score: 500, type: "cpu", imageUrl: "", colorHex: "#222", charId: "miimoge" },
      { name: "P3", score: 500, type: "cpu", imageUrl: "", colorHex: "#333", charId: "siran" },
    ],
    abilityAssignments: [
      { abilityId: null, factor: 1 },
      { abilityId: null, factor: 1 },
      { abilityId: null, factor: 1 },
      { abilityId: null, factor: 1 },
    ],
  });
});

describe("canDeclareRiichi（リーチ宣言可否）", () => {
  it("テンパイしていて最低翻数を満たせばtrue", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: c(3),
      doraTile: null,
      trendTypes: [],
    });
    expect(canDeclareRiichi(0)).toBe(true);
  });

  it("テンパイしていなければfalse", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0), c(0), c(1), c(2), c(3), c(4), c(5)], [], [], []],
      drawnTile: c(6),
      doraTile: null,
      trendTypes: [],
    });
    expect(canDeclareRiichi(0)).toBe(false);
  });

  it("面前でテンパイしていればリーチ可能", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: c(2, 1),
      doraTile: null,
      trendTypes: [],
    });
    expect(canDeclareRiichi(0)).toBe(true);
  });
});

describe("evaluateWin（和了役評価）", () => {
  it("ツモ和了で役一覧を返す", () => {
    useGameStore.setState({
      winner: 0,
      hands: [[c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], [], []],
      drawnTile: c(2, 2),
    });
    const { results } = evaluateWin(0);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name === "ツモ")).toBe(true);
  });

  it("ロン和了ではツモ役が付与されない", () => {
    useGameStore.setState({
      winner: 0,
      isRon: true,
      ronTarget: 1,
      hands: [[c(0), c(0, 1), c(0, 2), c(1), c(1, 1), c(1, 2), c(2), c(2, 1)], [], [], []],
      discards: [[], [c(0)], [], []],
      pendingRon: { tileId: c(0), fromPlayer: 1, eligiblePlayers: [0] },
    });
    const { results } = evaluateWin(0, { isRon: true, claimedTile: c(0) });
    expect(results.some((r) => r.name === "ツモ")).toBe(false);
  });
});

describe("shouldAutoDiscardRiichiHand（リーチ後の自動ツモ切り判定）", () => {
  it("引いた牌でアガれなければtrue", () => {
    useGameStore.setState({
      turnIndex: 0,
      riichi: [true, false, false, false],
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: c(4),
    });
    expect(shouldAutoDiscardRiichiHand(0)).toBe(true);
  });

  it("引いた牌でアガれるならfalse", () => {
    useGameStore.setState({
      turnIndex: 0,
      riichi: [true, false, false, false],
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: c(2, 1),
    });
    expect(shouldAutoDiscardRiichiHand(0)).toBe(false);
  });

  it("リーチしていなければfalse", () => {
    useGameStore.setState({
      turnIndex: 0,
      riichi: [false, false, false, false],
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: c(4),
    });
    expect(shouldAutoDiscardRiichiHand(0)).toBe(false);
  });

  it("drawnTileがnullならfalse", () => {
    useGameStore.setState({
      turnIndex: 0,
      riichi: [true, false, false, false],
      hands: [[c(0), c(0), c(0), c(1), c(1), c(1), c(2), c(2)], [], [], []],
      drawnTile: null,
    });
    expect(shouldAutoDiscardRiichiHand(0)).toBe(false);
  });
});

describe("getAimogeDangerColors（あいもげ危険色取得）", () => {
  it("能力無効なら空のSet", () => {
    useGameStore.setState({ specialAbilitiesEnabled: false });
    const colors = getAimogeDangerColors(0);
    expect(colors.size).toBe(0);
  });

  it("設定済みの危険色を返す", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: true,
      aimogeDangerColors: [[1, 2, 3], [], [], []],
    });
    const colors = getAimogeDangerColors(0);
    expect(colors.has(1)).toBe(true);
    expect(colors.has(2)).toBe(true);
    expect(colors.has(3)).toBe(true);
  });
});

describe("あの娘 ニコデスマン検証", () => {
  it("siran→anoko で2色になりニコデスマンが付く（リーチ後=捨て牌あり）", () => {
    useGameStore.setState({
      winner: 0,
      riichi: [true, false, false, false],
      discards: [[c(3)], [], [], []],
      hands: [[c(0), c(0,1), c(0,2), c(4), c(4,1), c(4,2), c(5), c(5,1)], [], [], []],
      drawnTile: c(5, 2),
      anokoSubstitutionPending: [true, false, false, false],
      doraTile: null,
      uradoraTile: null,
      trendTypes: [],
    });
    const { results } = evaluateWin(0);
    const names = results.map(r => r.name);
    console.log("results:", names);
    expect(names).toContain("ニコデスマン");
  });
});

describe("canTsumoWithMiimoge（みいもげ有効時のツモ条件）", () => {
  it("みいもげActiveかつみいもげ能力者自身は常にツモ可能（0翻でも）", () => {
    const result = canTsumoWithMiimoge(
      0, [c(0)], false, null, [], true, "P0",
      true, ["miimoge" as any, null, null, null],
      false,
    );
    expect(result).toBe(true);
  });

  it("みいもげActiveかつ他プレイヤーは最低5翻必要（ニコデスマン+ツモ+リーチ=5翻でちょうど）", () => {
    const result = canTsumoWithMiimoge(
      1, [c(0), c(1)], false, null, [], false, "P0",
      true, [null, null, null, null],
      true,
    );
    expect(result).toBe(true);
  });

  it("みいもげActiveかつ他プレイヤーは最低5翻必要（ニコデスマン+ツモ=4翻で不足）", () => {
    const result = canTsumoWithMiimoge(
      1, [c(0), c(1)], false, null, [], false, "P0",
      true, [null, null, null, null],
      false,
      false,
      5,
    );
    expect(result).toBe(false);
  });

  it("みいもげ非Activeなら通常条件（0翻でも可）", () => {
    const result = canTsumoWithMiimoge(
      0, [c(0)], false, null, [], false, "P0",
      false, [null, null, null, null],
      false,
    );
    expect(result).toBe(true);
  });
});
