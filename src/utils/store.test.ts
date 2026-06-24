import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store";
import { ABILITY_MAX_GAUGE } from "@/constants/abilities";

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
    currentDealWallLength: 0,
    scoreDeltas: [0, 0, 0, 0],
    parentIndex: 0,
  });
});

describe("discard（牌を捨てる）", () => {
  it("通常の捨て牌：手牌から削除され、捨て牌に追加され、次のプレイヤーにターンが移る", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0, 1), c(1), c(1, 1), c(2), c(2, 1), c(3), c(3, 1)], [], [], []],
      drawnTile: c(4),
      wall: [c(5)],
    });
    useGameStore.getState().discard(c(0));
    const state = useGameStore.getState();
    expect(state.hands[0]).not.toContain(c(0));
    expect(state.discards[0]).toContain(c(0));
    expect(state.drawnTile).toBeNull();
    expect(state.turnIndex).toBe(1);
  });

  it("ツモ切り（drawnTileと同じ牌を捨てる）：手牌は変化しない", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0, 1), c(1), c(1, 1), c(2), c(2, 1), c(3), c(3, 1)], [], [], []],
      drawnTile: c(4),
      wall: [c(5)],
    });
    useGameStore.getState().discard(c(4));
    const state = useGameStore.getState();
    expect(state.hands[0]).toHaveLength(8);
    expect(state.discards[0]).toContain(c(4));
  });

  it("ロン可能なプレイヤーがいるとpendingRonがセットされる", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(3)], [c(0), c(0), c(1), c(1), c(1), c(2), c(2), c(2)], [], []],
      drawnTile: c(4),
      wall: [],
      riichi: [false, true, false, false],
    });
    useGameStore.getState().discard(c(0));
    const state = useGameStore.getState();
    expect(state.pendingRon).not.toBeNull();
    expect(state.pendingRon!.eligiblePlayers).toContain(1);
  });

  it("ロン可能がいなければポン可能をチェックする", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(3)], [c(0), c(0), c(1), c(1, 1), c(2), c(2, 1), c(3), c(3, 1)], [], []],
      drawnTile: c(4),
      wall: [c(5)],
    });
    useGameStore.getState().discard(c(0));
    const state = useGameStore.getState();
    expect(state.pendingPon).not.toBeNull();
    expect(state.pendingPon!.tileId).toBe(c(0));
  });
});

describe("executePon（ポンの実行）", () => {
  it("手牌から2枚減り、ポンメンツが追加される", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(0, 1), c(1), c(1, 1), c(2), c(2, 1), c(3), c(3, 1)], [], [], []],
      pendingPon: { tileId: c(0), fromPlayer: 1 },
      takenDiscards: [[false], [false], [false], [false]],
      ponMelds: [[], [], [], []],
    });
    useGameStore.getState().executePon(0);
    const state = useGameStore.getState();
    expect(state.hands[0]).not.toContain(c(0));
    expect(state.hands[0]).not.toContain(c(0, 1));
    expect(state.ponMelds[0]).toHaveLength(1);
    expect(state.ponMelds[0][0]).toContain(c(0));
    expect(state.pendingPon).toBeNull();
    expect(state.turnIndex).toBe(0);
  });
});

describe("executeRon（ロンの実行）", () => {
  it("勝者が設定され、ロン情報が記録される", () => {
    useGameStore.setState({
      pendingRon: {
        tileId: c(0),
        fromPlayer: 1,
        eligiblePlayers: [2],
      },
    });
    useGameStore.getState().executeRon(2);
    const state = useGameStore.getState();
    expect(state.winner).toBe(2);
    expect(state.isRon).toBe(true);
    expect(state.ronTarget).toBe(1);
    expect(state.pendingRon).toBeNull();
  });

  it("対象外のプレイヤーはロンできない", () => {
    useGameStore.setState({
      pendingRon: {
        tileId: c(0),
        fromPlayer: 1,
        eligiblePlayers: [2],
      },
    });
    useGameStore.getState().executeRon(0);
    const state = useGameStore.getState();
    expect(state.winner).toBeNull();
  });
});

describe("cancelRon（ロンキャンセル）", () => {
  it("ポン可能プレイヤーがいればpendingPonにフォールバック", () => {
    useGameStore.setState({
      turnIndex: 0,
      pendingRon: { tileId: c(0), fromPlayer: 1, eligiblePlayers: [2] },
      hands: [[c(0), c(0, 1), c(1), c(1, 1), c(2), c(2, 1), c(3)], [c(4)], [c(5)], [c(6)]],
      riichi: [false, false, false, false],
    });
    useGameStore.getState().cancelRon();
    const state = useGameStore.getState();
    expect(state.pendingRon).toBeNull();
    expect(state.pendingPon).not.toBeNull();
    expect(state.pendingPon!.tileId).toBe(c(0));
  });

  it("ポン可能がいなければターンが進む", () => {
    useGameStore.setState({
      turnIndex: 0,
      pendingRon: { tileId: c(0), fromPlayer: 1, eligiblePlayers: [2] },
      hands: [[c(3)], [c(1)], [c(4)], [c(5)]],
      wall: [c(6)],
    });
    useGameStore.getState().cancelRon();
    const state = useGameStore.getState();
    expect(state.pendingRon).toBeNull();
    expect(state.pendingPon).toBeNull();
    expect(state.turnIndex).toBe(2);
  });
});

describe("cancelPon（ポンキャンセル）", () => {
  it("pendingPonをクリアしてターンが進む", () => {
    useGameStore.setState({
      pendingPon: { tileId: c(0), fromPlayer: 1 },
      wall: [c(6)],
    });
    useGameStore.getState().cancelPon();
    const state = useGameStore.getState();
    expect(state.pendingPon).toBeNull();
    expect(state.turnIndex).toBe(2);
  });
});

describe("declareRiichi（リーチ宣言）", () => {
  it("リーチ状態が設定され、能力ゲージが増加する", () => {
    useGameStore.setState({
      turnIndex: 0,
      riichi: [false, false, false, false],
      ippatsu: [false, false, false, false],
      doubleReach: [false, false, false, false],
      discards: [[c(0)], [], [], []],
      specialAbilitiesEnabled: false,
    });
    useGameStore.getState().declareRiichi(0);
    const state = useGameStore.getState();
    expect(state.riichi[0]).toBe(true);
    expect(state.ippatsu[0]).toBe(true);
    expect(state.doubleReach[0]).toBe(false);
  });

  it("捨て牌0でダブルリーチ", () => {
    useGameStore.setState({
      riichi: [false, false, false, false],
      ippatsu: [false, false, false, false],
      doubleReach: [false, false, false, false],
      discards: [[], [], [], []],
    });
    useGameStore.getState().declareRiichi(0);
    const state = useGameStore.getState();
    expect(state.doubleReach[0]).toBe(true);
  });

  it("能力が有効ならリーチで能力ゲージがチャージされる", () => {
    useGameStore.setState({
      riichi: [false, false, false, false],
      ippatsu: [false, false, false, false],
      doubleReach: [false, false, false, false],
      discards: [[c(0)], [], [], []],
      specialAbilitiesEnabled: true,
      abilityGauge: [0, 0, 0, 0],
      abilityReady: [false, false, false, false],
      abilityChargeLocked: [false, false, false, false],
    });
    useGameStore.getState().declareRiichi(0);
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBeGreaterThan(0);
  });
});

describe("chargeAbility（能力ゲージチャージ）", () => {
  it("チートイイベントでゲージが増加する", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: true,
      abilityGauge: [0, 0, 0, 0],
      abilityReady: [false, false, false, false],
      abilityChargeLocked: [false, false, false, false],
    });
    useGameStore.getState().chargeAbility(0, "riichi");
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBeGreaterThan(0);
  });

  it("能力が無効ならチャージされない", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: false,
      abilityGauge: [0, 0, 0, 0],
    });
    useGameStore.getState().chargeAbility(0, "riichi");
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBe(0);
  });

  it("MAXに達するとabilityReadyがtrueになる", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: true,
      abilityGauge: [0, 0, 0, 0],
      abilityReady: [false, false, false, false],
      abilityChargeLocked: [false, false, false, false],
    });
    useGameStore.getState().chargeAbility(0, "tsumo", 9999);
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBe(ABILITY_MAX_GAUGE);
    expect(state.abilityReady[0]).toBe(true);
  });
});

describe("activateAbility（能力発動）", () => {
  it("能力発動でゲージが0に戻り、チャージロックされる", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: true,
      abilityGauge: [100, 0, 0, 0],
      abilityReady: [true, false, false, false],
      abilityChargeLocked: [false, false, false, false],
      abilityCutinActive: false,
      abilityCutinPlayer: null,
      abilityCutinText: "",
      abilityCutinQueue: [],
    });
    useGameStore.getState().activateAbility(0);
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBe(0);
    expect(state.abilityReady[0]).toBe(false);
    expect(state.abilityChargeLocked[0]).toBe(true);
  });

  it("能力無効時は何もしない", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: false,
      abilityGauge: [100, 0, 0, 0],
    });
    useGameStore.getState().activateAbility(0);
    const state = useGameStore.getState();
    expect(state.abilityGauge[0]).toBe(100);
  });

  it("キューイング：既にカットイン表示中はキューに追加される", () => {
    useGameStore.setState({
      specialAbilitiesEnabled: true,
      abilityGauge: [100, 100, 0, 0],
      abilityReady: [true, true, false, false],
      abilityChargeLocked: [false, false, false, false],
      abilityCutinActive: true,
      abilityCutinPlayer: 0,
      abilityCutinQueue: [],
    });
    useGameStore.getState().activateAbility(1);
    const state = useGameStore.getState();
    expect(state.abilityCutinQueue).toHaveLength(1);
    expect(state.abilityCutinQueue[0].playerIndex).toBe(1);
  });
});

describe("clearAbilityCutin（能力カットインクリア）", () => {
  it("キューが空なら単に非アクティブ化", () => {
    useGameStore.setState({
      abilityCutinActive: true,
      abilityCutinPlayer: 0,
      abilityCutinText: "テスト",
      abilityCutinQueue: [],
    });
    useGameStore.getState().clearAbilityCutin();
    const state = useGameStore.getState();
    expect(state.abilityCutinActive).toBe(false);
    expect(state.abilityCutinPlayer).toBeNull();
  });

  it("キューがあれば次の能力カットインを表示", () => {
    useGameStore.setState({
      abilityCutinActive: true,
      abilityCutinPlayer: 0,
      abilityCutinText: "テスト",
      abilityCutinQueue: [{ playerIndex: 1, text: "次" }],
    });
    useGameStore.getState().clearAbilityCutin();
    const state = useGameStore.getState();
    expect(state.abilityCutinActive).toBe(true);
    expect(state.abilityCutinPlayer).toBe(1);
    expect(state.abilityCutinText).toBe("次");
    expect(state.abilityCutinQueue).toHaveLength(0);
  });
});

describe("advanceTurn（ターン進行）", () => {
  it("drawnTileがあれば手牌に加えてソートし、次のプレイヤーにターンが移る", () => {
    useGameStore.setState({
      turnIndex: 0,
      hands: [[c(0), c(1), c(2), c(3), c(4), c(5), c(6), c(7)], [], [], []],
      drawnTile: c(8),
      wall: [],
    });
    useGameStore.getState().advanceTurn();
    const state = useGameStore.getState();
    expect(state.hands[0]).toContain(c(8));
    expect(state.turnIndex).toBe(1);
    expect(state.drawnTile).toBeNull();
  });
});

describe("declareWin（勝利宣言）", () => {
  it("勝者が設定される", () => {
    useGameStore.getState().declareWin(2);
    expect(useGameStore.getState().winner).toBe(2);
  });
});

describe("moveParent（親移動）", () => {
  it("親が次のプレイヤーに移動する", () => {
    useGameStore.setState({ parentIndex: 1, round: 0, kyoku: 0, honba: 0 });
    useGameStore.getState().moveParent();
    const state = useGameStore.getState();
    expect(state.parentIndex).toBe(2);
    expect(state.kyoku).toBe(1);
  });

  it("4巡目でラウンドが進む", () => {
    useGameStore.setState({ parentIndex: 0, round: 0, kyoku: 3, honba: 0 });
    useGameStore.getState().moveParent();
    const state = useGameStore.getState();
    expect(state.parentIndex).toBe(1);
    expect(state.round).toBe(1);
    expect(state.kyoku).toBe(0);
  });
});

describe("incrementHonba（本場増加）", () => {
  it("本場が1増える", () => {
    useGameStore.setState({ honba: 2 });
    useGameStore.getState().incrementHonba();
    expect(useGameStore.getState().honba).toBe(3);
  });
});

describe("setRyuukyoku（流局設定）", () => {
  it("流局フラグがtrueになる", () => {
    useGameStore.getState().setRyuukyoku();
    expect(useGameStore.getState().ryuukyoku).toBe(true);
  });
});

describe("updateScore（スコア更新）", () => {
  it("指定プレイヤーのスコアを更新する", () => {
    useGameStore.setState({
      players: [
        { name: "P0", score: 500, type: "human", imageUrl: "", colorHex: "#000", charId: "aimoge" },
        { name: "P1", score: 500, type: "cpu", imageUrl: "", colorHex: "#111", charId: "burumoge" },
        { name: "P2", score: 500, type: "cpu", imageUrl: "", colorHex: "#222", charId: "miimoge" },
        { name: "P3", score: 500, type: "cpu", imageUrl: "", colorHex: "#333", charId: "siran" },
      ],
    });
    useGameStore.getState().updateScore(1, 450);
    expect(useGameStore.getState().players[1].score).toBe(450);
  });
});
