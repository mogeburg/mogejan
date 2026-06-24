import type { CpuPersonality } from "@/ai/CpuController";
import { generateRandomPersonality } from "@/ai/CpuController";
import {
  ABILITY_LABELS,
  ABILITY_MAX_GAUGE,
  createDefaultAbilityAssignment,
  getAbilityChargeAmount,
  type AbilityAssignment,
  type AbilityChargeEvent,
  type AbilityId,
} from "@/constants/abilities";
import type { BgmKey } from "@/constants/game";
import {
  BGM_VOLUME,
  DEFAULT_CPU_STRENGTH,
  DEFAULT_SPEED,
  DEFAULT_TEXT_SIZE,
  INITIAL_SCORE,
  MASTER_VOLUME,
  PLAYER_CONFIGS,
  PLAYER_COUNT,
  SE_VOLUME,
  VOICE_VOLUME,
  type CpuStrength,
  type TextSize,
} from "@/constants/game";
import type { GameSize, ScreenMode } from "@/constants/layout";
import { DEFAULT_GAME_SIZE } from "@/constants/layout";
import { SPECIAL_YAKU } from "@/constants/specialYaku";
import { getTileCharacterId, isSameColorLikeTile } from "@/constants/tiles";
import { YAKU } from "@/constants/yaku";
import type { CutinImageVariant } from "@/utils/assets";
import {
  canFormWinningHand,
  findWaiterId,
  getEligiblePonPlayerIndexes,
} from "@/utils/check";
import { executeAnemogeSwap, executeOtyantiSwap, triggerAimogeOnTurn } from "@/utils/gameplay";
import { getProjectedTotalYaku } from "@/utils/gameplayLogic";
import { usePlayStatsStore } from "@/utils/playStats";
import { createStorageKey } from "@/utils/storage";
import {
  createHands,
  pickTrendTypes,
  shuffleArray,
  sortTiles,
} from "@/utils/tiles";
import { scheduleNextDraw } from "@/utils/turnScheduler";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen =
  | "loading"
  | "title"
  | "testConfig"
  | "scoreDisplay"
  | "scoreConfirm"
  | "game"
  | "result"
  | "gameResult";

export interface Player {
  name: string;
  score: number;
  type: "human" | "cpu";
  imageUrl: string;
  colorHex: string;
  charId: string;
}

export type CutinPreview = {
  sourcePlayer: number;
  targetPlayer: number;
  isRon: boolean;
  animateJitter?: boolean;
};

export type ActionButtonAlign = "left" | "center" | "right" | "follow";

interface GameStore {
  currentScreen: Screen;
  specialAbilitiesEnabled: boolean;
  titleModeIndex: number;
  players: Player[];
  hands: number[][];
  wall: number[];
  discards: number[][];
  drawnTile: number | null;
  turnIndex: number;
  parentIndex: number;
  round: number;
  kyoku: number;
  honba: number;
  speed: number;
  textSize: TextSize;
  cpuStrength: CpuStrength;
  masterVolume: number;
  bgmVolume: number;
  seVolume: number;
  voiceVolume: number;
  screenMode: ScreenMode;
  gameSize: GameSize;
  lightweightMode: boolean;
  actionButtonAlign: ActionButtonAlign;
  riichiBgmSetting: BgmKey;
  normalBgmSetting: BgmKey;
  riichiAvatar: "none" | "kanimoge" | "burumoge";
  debugFlags: {
    showAllTiles: boolean;
    manualCpu: boolean;
    alwaysTsumogiri: boolean;
    showCpuPersonalities: boolean;
  };
  gameOver: boolean;
  simulationMode: boolean;
  currentDealWallLength: number;
  yakuCounts: Record<string, number>;
  autoActions: {
    ronTsumo: boolean;
    pon: boolean;
    riichi: boolean;
    cancel: boolean;
  };
  autoActionTrayOpen: boolean;
  cutin: string | null;
  cutinPlayer: number | null;
  cutinType: "normal" | "rare" | "epic" | "ryuukyoku";
  cutinImageVariant: CutinImageVariant;
  cutinPreview: CutinPreview | null;
  riichiCutinPlayer: number | null;
  riichiCutinTileId: number | null;
  riichiCutinText: string;
  abilityCutinActive: boolean;
  abilityCutinPlayer: number | null;
  abilityCutinText: string;
  abilityCutinQueue: { playerIndex: number; text: string }[];
  pendingRiichiCutin: { playerIndex: number; waiter: number } | null;
  pendingWinCutin: {
    text: string;
    playerIndex: number;
    type: "normal" | "rare" | "epic" | "ryuukyoku";
    imageVariant: CutinImageVariant;
  } | null;
  speechBubbles: { id: number; text: string; playerIndex: number }[];
  winner: number | null;
  ryuukyoku: boolean;
  riichi: boolean[];
  ippatsu: boolean[];
  doubleReach: boolean[];
  riichiDiscardPositions: (number | null)[];
  pendingPon: { tileId: number; fromPlayer: number } | null;
  lastDiscard: { tileId: number; fromPlayer: number } | null;
  ponMelds: number[][][];
  takenDiscards: boolean[][];
  scoreDeltas: number[];
  pendingRon: {
    tileId: number;
    fromPlayer: number;
    eligiblePlayers: number[];
  } | null;
  isRon: boolean;
  ronTarget: number | null;
  doraTile: number | null;
  uradoraTile: number | null;
  trendTypes: number[];
  abilityAssignments: AbilityAssignment[];
  abilityGauge: number[];
  abilityReady: boolean[];
  abilityChargeLocked: boolean[];
  aimogeDangerColors: number[][];
  pikasanBonusPending: boolean[];
  siranGuardActive: boolean[];
  anokoSubstitutionPending: boolean[];
  miimogeActive: boolean;
  otyantiActive: boolean;
  cpuPersonalities: (CpuPersonality | null)[];
  setSpeed: (speed: number) => void;
  setTextSize: (textSize: TextSize) => void;
  setCpuStrength: (cpuStrength: CpuStrength) => void;
  setMasterVolume: (volume: number) => void;
  setBgmVolume: (volume: number) => void;
  setSeVolume: (volume: number) => void;
  setVoiceVolume: (volume: number) => void;
  setScreenMode: (mode: ScreenMode) => void;
  setGameSize: (gameSize: GameSize) => void;
  setLightweightMode: (lightweightMode: boolean) => void;
  setActionButtonAlign: (align: ActionButtonAlign) => void;
  setRiichiBgmSetting: (setting: BgmKey) => void;
  setNormalBgmSetting: (setting: BgmKey) => void;
  setRiichiAvatar: (avatar: "none" | "kanimoge" | "burumoge") => void;
  setSpecialAbilitiesEnabled: (enabled: boolean) => void;
  setTitleModeIndex: (index: number) => void;
  toggleDebugFlag: (
    key:
      | "showAllTiles"
      | "manualCpu"
      | "alwaysTsumogiri"
      | "showCpuPersonalities",
  ) => void;
  toggleAutoAction: (key: "ronTsumo" | "pon" | "riichi" | "cancel") => void;
  setAutoActionTrayOpen: (open: boolean) => void;
  addYakuCounts: (yakus: { name: string }[]) => void;
  goTo: (screen: Screen) => void;
  updateScore: (index: number, score: number) => void;
  deal: () => void;
  draw: () => void;
  discard: (tileId: number, isRiichi?: boolean) => void;
  directDiscard: (
    playerIndex: number,
    tileId: number,
    isRiichi?: boolean,
  ) => void;
  showCutin: (
    text: string,
    playerIndex?: number,
    type?: "normal" | "rare" | "epic" | "ryuukyoku",
    imageVariant?: CutinImageVariant,
  ) => void;
  showDebugCutin: (
    text: string,
    playerIndex: number,
    preview: CutinPreview,
    type?: "normal" | "rare" | "epic" | "ryuukyoku",
    imageVariant?: CutinImageVariant,
  ) => void;
  hideCutin: () => void;
  setRiichiCutin: (
    playerIndex: number | null,
    tileId?: number | null,
    text?: string,
  ) => void;
  setPendingRiichiCutin: (playerIndex: number, waiter: number) => void;
  setPendingWinCutin: (
    text: string,
    playerIndex: number,
    type: "normal" | "rare" | "epic" | "ryuukyoku",
    imageVariant: CutinImageVariant,
  ) => void;
  showSpeechBubble: (text: string, playerIndex: number) => void;
  clearAbilityCutin: () => void;
  hideSpeechBubble: (id: number) => void;
  declareWin: (playerIndex: number) => void;
  swapHandsAndMelds: (playerA: number, playerB: number) => void;
  mergeDrawnIntoHand: (playerIndex: number) => void;
  advanceTurn: () => void;
  skipTurn: () => void;
  declareRiichi: (playerIndex: number) => void;
  clearWinner: () => void;
  setRyuukyoku: () => void;
  moveParent: () => void;
  incrementHonba: () => void;
  executePon: (playerIndex: number) => void;
  cancelPon: () => void;
  setSimulationMode: (active: boolean) => void;
  executeRon: (playerIndex: number) => void;
  cancelRon: () => void;
  chargeAbility: (
    playerIndex: number,
    event: AbilityChargeEvent,
    scoreAmount?: number,
  ) => void;
  setAimogeDangerColors: (playerIndex: number, colors: number[]) => void;
  setPikasanBonusPending: (playerIndex: number, pending: boolean) => void;
  setSiranGuardActive: (playerIndex: number, active: boolean) => void;
  setAnokoSubstitutionPending: (playerIndex: number, pending: boolean) => void;
  activateAbility: (
    playerIndex: number,
    abilityId?: AbilityId | null,
    text?: string,
  ) => void;
  resetData: () => void;
  initGame: (players: Player[]) => void;
  startDebugMidgame: (players?: Player[]) => void;
  startTestGame: (config: import("./types/testConfig").TestConfig) => void;
}

function getRonEligiblePlayers(
  state: GameStore,
  tileId: number,
  exceptPlayer: number,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    if (i === exceptPlayer) continue;
    if (!state.riichi[i] && state.discards[i].length > 0) continue;
    const allTiles = [...state.hands[i], tileId, ...state.ponMelds[i].flat()];
    if (!canFormWinningHand(allTiles)) continue;
    if (
      state.miimogeActive &&
      state.abilityAssignments[i]?.abilityId !== "miimoge"
    ) {
      const totalYaku = getProjectedTotalYaku({
        riichi: state.riichi[i],
        doubleReach: state.doubleReach[i],
        ippatsu: false,
        isRon: true,
        hasPonMelds: state.ponMelds[i].length > 0,
        doraTile: state.doraTile,
        uradoraTile: null,
        allTiles,
        winnerDiscardsEmpty: state.discards[i].length === 0,
        playerName: state.players[i].name,
        trendTypes: state.trendTypes,
      });
      if (totalYaku < 5) continue;
    }
    result.push(i);
  }
  return result;
}

const defaultPlayers: Player[] = PLAYER_CONFIGS.slice(0, PLAYER_COUNT).map((config, index) => ({
  name: config.name,
  score: INITIAL_SCORE,
  type: index === 0 ? "human" : "cpu",
  imageUrl: config.imageUrl,
  colorHex: config.colorHex,
  charId: config.charId,
}));

const emptyPlayerRows = <T>(factory: () => T): T[] =>
  Array.from({ length: PLAYER_COUNT }, factory);

const initialFlags = () => emptyPlayerRows(() => false);
const initialNullableNumbers = () => emptyPlayerRows<number | null>(() => null);
const initialNumberRows = () => emptyPlayerRows<number[]>(() => []);
const initialBooleanRows = () => emptyPlayerRows<boolean[]>(() => []);
const initialMeldRows = () => emptyPlayerRows<number[][]>(() => []);
const initialScoreDeltas = () => emptyPlayerRows(() => 0);
const initialAbilityAssignments = (players: Player[] = defaultPlayers) =>
  players.map((player) => createDefaultAbilityAssignment(player.charId));
const initialAbilityGauge = () => emptyPlayerRows(() => 0);
const initialAbilityReady = () => emptyPlayerRows(() => false);
const initialAbilityChargeLocked = () => emptyPlayerRows(() => false);
const initialAbilityFlags = () => emptyPlayerRows(() => false);

function createDefaultDebugFlags() {
  return {
    showAllTiles: false,
    manualCpu: false,
    alwaysTsumogiri: false,
    showCpuPersonalities: false,
  };
}

function createDefaultAutoActions() {
  return {
    ronTsumo: false,
    pon: false,
    riichi: false,
    cancel: false,
  };
}

function initialYakuCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of Object.keys(YAKU)) {
    counts[(YAKU as Record<string, { name: string }>)[key].name] = 0;
  }
  for (const def of Object.values(SPECIAL_YAKU)) {
    counts[def.name] = 0;
  }
  return counts;
}

function getChargedAbilityState(
  state: Pick<
    GameStore,
    | "specialAbilitiesEnabled"
    | "abilityAssignments"
    | "abilityGauge"
    | "abilityReady"
    | "abilityChargeLocked"
  >,
  playerIndex: number,
  event: AbilityChargeEvent,
  scoreAmount = 0,
) {
  if (!state.specialAbilitiesEnabled) return null;
  const assignment = state.abilityAssignments[playerIndex];
  if (assignment?.abilityId == null) return null;
  if (state.abilityChargeLocked[playerIndex]) return null;

  const nextGauge = [...state.abilityGauge];
  const nextReady = [...state.abilityReady];
  nextGauge[playerIndex] = Math.min(
    ABILITY_MAX_GAUGE,
    nextGauge[playerIndex] +
      getAbilityChargeAmount(event, assignment.factor, scoreAmount),
  );
  nextReady[playerIndex] = nextGauge[playerIndex] >= ABILITY_MAX_GAUGE;

  return {
    abilityGauge: nextGauge,
    abilityReady: nextReady,
  };
}

let nextBubbleId = 0;

function canDrawForTurn(nextTurn: number) {
  const state = useGameStore.getState();
  return (
    state.winner == null &&
    !state.ryuukyoku &&
    state.drawnTile == null &&
    state.wall.length > 0 &&
    state.turnIndex === nextTurn
  );
}

function scheduleDrawForTurn(nextTurn: number, speed: number) {
  scheduleNextDraw({
    nextTurn,
    speed,
    canDraw: () => canDrawForTurn(nextTurn),
    draw: () => {
      const state = useGameStore.getState();
      if (state.abilityCutinActive) {
        setTimeout(() => scheduleDrawForTurn(nextTurn, speed), 100);
        return;
      }
      state.draw();
      triggerAimogeOnTurn(state.turnIndex);
    },
  });
}

function popWallTile(state: ReturnType<typeof createRoundState>) {
  if (state.wall.length === 0) return null;
  const [top, ...rest] = state.wall;
  state.wall = rest;
  return top;
}

function getDiscardOptions(
  state: ReturnType<typeof createRoundState>,
  playerIndex: number,
) {
  if (state.turnIndex === playerIndex && state.drawnTile != null) {
    return [...state.hands[playerIndex], state.drawnTile];
  }
  return [...state.hands[playerIndex]];
}

function applyDebugDiscard(
  state: ReturnType<typeof createRoundState>,
  playerIndex: number,
  tileId: number,
  isRiichi = false,
) {
  const hand = [...state.hands[playerIndex]];
  const drawnTile = state.turnIndex === playerIndex ? state.drawnTile : null;

  if (drawnTile != null) {
    if (tileId !== drawnTile) {
      const idx = hand.indexOf(tileId);
      if (idx !== -1) hand.splice(idx, 1);
      hand.push(drawnTile);
      hand.sort(sortTiles);
    }
  } else {
    const idx = hand.indexOf(tileId);
    if (idx !== -1) hand.splice(idx, 1);
  }

  state.hands[playerIndex] = hand;
  state.discards[playerIndex] = [...state.discards[playerIndex], tileId];
  state.takenDiscards[playerIndex] = [
    ...state.takenDiscards[playerIndex],
    false,
  ];
  state.lastDiscard = { tileId, fromPlayer: playerIndex };
  if (isRiichi) {
    state.riichi[playerIndex] = true;
    state.ippatsu[playerIndex] = true;
    state.doubleReach[playerIndex] = state.discards[playerIndex].length === 1;
    state.riichiDiscardPositions[playerIndex] =
      state.discards[playerIndex].length - 1;
  }
  state.drawnTile = null;
}

function applyDebugPon(
  state: ReturnType<typeof createRoundState>,
  callerIndex: number,
  fromPlayer: number,
  tileId: number,
) {
  const hand = [...state.hands[callerIndex]];
  const matchingTiles: number[] = [];
  const remaining: number[] = [];

  for (const id of hand) {
    if (isSameColorLikeTile(id, tileId) && matchingTiles.length < 2) {
      matchingTiles.push(id);
    } else {
      remaining.push(id);
    }
  }

  if (matchingTiles.length < 2) return false;

  remaining.sort(sortTiles);
  state.hands[callerIndex] = remaining;
  state.takenDiscards[fromPlayer][state.takenDiscards[fromPlayer].length - 1] =
    true;
  state.ponMelds[callerIndex] = [
    ...state.ponMelds[callerIndex],
    [...matchingTiles, tileId],
  ];
  state.turnIndex = callerIndex;
  state.drawnTile = null;
  state.ippatsu = [false, false, false, false];
  state.pendingPon = null;
  return true;
}

function findPonOpportunity(
  state: ReturnType<typeof createRoundState>,
  playerIndex: number,
) {
  const discardOptions = shuffleArray(getDiscardOptions(state, playerIndex));
  const candidates = shuffleArray(
    Array.from({ length: PLAYER_COUNT }, (_, i) => i).filter(
      (i) => i !== playerIndex,
    ),
  );

  for (const tileId of discardOptions) {
    for (const callerIndex of candidates) {
      const matchCount = state.hands[callerIndex].filter((id) =>
        isSameColorLikeTile(id, tileId),
      ).length;
      if (matchCount >= 2) {
        return { tileId, callerIndex };
      }
    }
  }
  return null;
}

function enforceCpuRiichiMarkers(state: ReturnType<typeof createRoundState>) {
  const cpuCandidates = [1, 2, 3]
    .map((playerIndex) => ({
      playerIndex,
      discardCount: state.discards[playerIndex].length,
    }))
    .sort((a, b) => b.discardCount - a.discardCount);

  const doubleRiichiPlayer = cpuCandidates[0]?.playerIndex ?? 1;
  const riichiPlayer =
    cpuCandidates.find(
      (candidate) => candidate.playerIndex !== doubleRiichiPlayer,
    )?.playerIndex ?? 2;

  state.riichi = [false, false, false, false];
  state.doubleReach = [false, false, false, false];
  state.ippatsu = [false, false, false, false];
  state.riichiDiscardPositions = [null, null, null, null];

  state.riichi[doubleRiichiPlayer] = true;
  state.doubleReach[doubleRiichiPlayer] = true;
  state.ippatsu[doubleRiichiPlayer] = false;
  if (state.discards[doubleRiichiPlayer].length > 0) {
    state.riichiDiscardPositions[doubleRiichiPlayer] = 0;
  }

  state.riichi[riichiPlayer] = true;
  state.doubleReach[riichiPlayer] = false;
  state.ippatsu[riichiPlayer] = false;
  if (state.discards[riichiPlayer].length > 1) {
    state.riichiDiscardPositions[riichiPlayer] = 1;
  } else if (state.discards[riichiPlayer].length > 0) {
    state.riichiDiscardPositions[riichiPlayer] = 0;
  }
}

function buildDebugMidgameState(base: {
  parentIndex: number;
  round: number;
  kyoku: number;
  honba: number;
}) {
  const trendTypes = pickTrendTypes();
  const { hands, wall } = createHands(trendTypes);
  const doraTile = wall.at(-2) ?? null;
  const uradoraTile = wall.at(-1) ?? null;
  const wallWithoutDora = wall.slice(0, -2);
  const [top, ...rest] = wallWithoutDora;
  const state = createRoundState();

  state.hands = hands.map((hand) => [...hand]);
  state.wall = rest;
  state.drawnTile = top ?? null;
  state.turnIndex = base.parentIndex;
  state.round = base.round;
  state.kyoku = base.kyoku;
  state.honba = base.honba;
  state.doraTile = doraTile;
  state.uradoraTile = uradoraTile;
  state.trendTypes = trendTypes;
  const cpuTargets = shuffleArray([1, 2, 3]);
  const doubleRiichiTarget = cpuTargets[0];
  const riichiTarget = cpuTargets[1];

  let totalDiscards = 0;
  let ponDone = false;
  let riichiDone = false;
  let doubleRiichiDone = false;
  const targetDiscards = 10 + Math.floor(Math.random() * 5);

  for (let step = 0; step < 40 && state.wall.length > 0; step++) {
    if (state.drawnTile == null) {
      state.drawnTile = popWallTile(state);
      if (state.drawnTile == null) break;
    }

    const activePlayer = state.turnIndex;
    const waiterId = findWaiterId([
      ...state.hands[activePlayer],
      state.drawnTile,
    ]);
    const shouldDoubleRiichi =
      activePlayer === doubleRiichiTarget &&
      !doubleRiichiDone &&
      state.discards[activePlayer].length === 0 &&
      waiterId != null;
    const shouldRiichi =
      activePlayer === riichiTarget &&
      !riichiDone &&
      state.discards[activePlayer].length > 0 &&
      totalDiscards >= 4 &&
      waiterId != null;
    const riichiTile = shouldDoubleRiichi || shouldRiichi ? waiterId : null;
    const ponOpportunity = !ponDone
      ? findPonOpportunity(state, activePlayer)
      : null;
    const discardOptions = getDiscardOptions(state, activePlayer);
    const discardTile =
      riichiTile ??
      ponOpportunity?.tileId ??
      discardOptions[Math.floor(Math.random() * discardOptions.length)];

    applyDebugDiscard(state, activePlayer, discardTile, riichiTile != null);
    totalDiscards++;
    if (shouldDoubleRiichi) {
      doubleRiichiDone = true;
      riichiDone = activePlayer === riichiTarget;
    } else if (shouldRiichi) {
      riichiDone = true;
    }

    if (
      ponOpportunity != null &&
      applyDebugPon(
        state,
        ponOpportunity.callerIndex,
        activePlayer,
        discardTile,
      )
    ) {
      ponDone = true;

      if (state.hands[ponOpportunity.callerIndex].length > 0) {
        const ponDiscardOptions = [...state.hands[ponOpportunity.callerIndex]];
        const ponDiscardTile =
          ponDiscardOptions[
            Math.floor(Math.random() * ponDiscardOptions.length)
          ];
        applyDebugDiscard(state, ponOpportunity.callerIndex, ponDiscardTile);
        totalDiscards++;
      }

      state.turnIndex = (ponOpportunity.callerIndex + 1) % PLAYER_COUNT;
      state.drawnTile = popWallTile(state);
    } else {
      state.turnIndex = (activePlayer + 1) % PLAYER_COUNT;
      state.drawnTile = popWallTile(state);
    }

    if (
      ponDone &&
      riichiDone &&
      doubleRiichiDone &&
      totalDiscards >= targetDiscards &&
      state.turnIndex === 0
    ) {
      if (state.drawnTile == null) {
        state.drawnTile = popWallTile(state);
      }
      if (state.drawnTile != null) break;
    }
  }

  if (state.drawnTile == null) {
    state.drawnTile = popWallTile(state);
  }

  enforceCpuRiichiMarkers(state);

  return {
    snapshot: {
      ...state,
      currentDealWallLength: wall.length,
    },
    ponDone,
    riichiDone,
    doubleRiichiDone,
    totalDiscards,
  };
}

function createRoundState() {
  return {
    hands: [] as number[][],
    wall: [] as number[],
    discards: initialNumberRows(),
    drawnTile: null as number | null,
    turnIndex: 0,
    round: 0,
    kyoku: 0,
    honba: 0,
    gameOver: false,
    cutin: null as string | null,
    cutinPlayer: null as number | null,
    cutinType: "normal" as const,
    cutinImageVariant: "normal" as const,
    cutinPreview: null as CutinPreview | null,
    riichiCutinPlayer: null as number | null,
    riichiCutinTileId: null as number | null,
    riichiCutinText: "リーチ",
    abilityCutinActive: false,
    abilityCutinPlayer: null as number | null,
    abilityCutinText: "",
    abilityCutinQueue: [] as { playerIndex: number; text: string }[],
    pendingRiichiCutin: null as { playerIndex: number; waiter: number } | null,
    pendingWinCutin: null as {
      text: string;
      playerIndex: number;
      type: "normal" | "rare" | "epic" | "ryuukyoku";
      imageVariant: CutinImageVariant;
    } | null,
    speechBubbles: [] as { id: number; text: string; playerIndex: number }[],
    winner: null as number | null,
    ryuukyoku: false,
    riichi: initialFlags(),
    ippatsu: initialFlags(),
    doubleReach: initialFlags(),
    riichiDiscardPositions: initialNullableNumbers(),
    pendingPon: null as { tileId: number; fromPlayer: number } | null,
    lastDiscard: null as { tileId: number; fromPlayer: number } | null,
    ponMelds: initialMeldRows(),
    takenDiscards: initialBooleanRows(),
    scoreDeltas: initialScoreDeltas(),
    pendingRon: null as {
      tileId: number;
      fromPlayer: number;
      eligiblePlayers: number[];
    } | null,
    isRon: false,
    ronTarget: null as number | null,
    doraTile: null as number | null,
    uradoraTile: null as number | null,
    trendTypes: [] as number[],
    abilityGauge: initialAbilityGauge(),
    abilityReady: initialAbilityReady(),
    abilityChargeLocked: initialAbilityChargeLocked(),
    aimogeDangerColors: initialAbilityFlags().map(() => [] as number[]),
    pikasanBonusPending: initialAbilityFlags(),
    siranGuardActive: initialAbilityFlags(),
    anokoSubstitutionPending: initialAbilityFlags(),
    miimogeActive: false,
    otyantiActive: false,
  };
}

function createDefaultSettingsState(): Pick<
  GameStore,
  | "speed"
  | "textSize"
  | "cpuStrength"
  | "masterVolume"
  | "bgmVolume"
  | "seVolume"
  | "voiceVolume"
  | "screenMode"
  | "gameSize"
  | "lightweightMode"
  | "actionButtonAlign"
  | "riichiBgmSetting"
  | "normalBgmSetting"
  | "riichiAvatar"
  | "debugFlags"
  | "autoActions"
  | "autoActionTrayOpen"
  | "yakuCounts"
  | "simulationMode"
  | "cpuPersonalities"
> {
  return {
    speed: DEFAULT_SPEED,
    textSize: DEFAULT_TEXT_SIZE,
    cpuStrength: DEFAULT_CPU_STRENGTH,
    masterVolume: MASTER_VOLUME,
    bgmVolume: BGM_VOLUME,
    seVolume: SE_VOLUME,
    voiceVolume: VOICE_VOLUME,
    screenMode: "auto",
    gameSize: DEFAULT_GAME_SIZE,
    lightweightMode: false,
    actionButtonAlign: "center",
    riichiBgmSetting: "riichi" as const,
    normalBgmSetting: "game" as const,
    riichiAvatar: "kanimoge" as const,
    debugFlags: createDefaultDebugFlags(),
    autoActions: createDefaultAutoActions(),
    autoActionTrayOpen: false,
    yakuCounts: initialYakuCounts(),
    simulationMode: false,
    cpuPersonalities: [null, null, null, null] as (CpuPersonality | null)[],
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      currentScreen: "loading",
      specialAbilitiesEnabled: false,
      titleModeIndex: 0,
      players: defaultPlayers,
      abilityAssignments: initialAbilityAssignments(),
      ...createRoundState(),
      parentIndex: 0,
      ...createDefaultSettingsState(),
      currentDealWallLength: 0,
      setSpeed: (speed) => set({ speed }),
      setTextSize: (textSize) => set({ textSize }),
      setCpuStrength: (cpuStrength) => set({ cpuStrength }),
      setMasterVolume: (masterVolume) => set({ masterVolume }),
      setBgmVolume: (bgmVolume) => set({ bgmVolume }),
      setSeVolume: (seVolume) => set({ seVolume }),
      setVoiceVolume: (voiceVolume) => set({ voiceVolume }),
      setScreenMode: (screenMode) => set({ screenMode }),
      setGameSize: (gameSize) => set({ gameSize }),
      setLightweightMode: (lightweightMode) => set({ lightweightMode }),
      setActionButtonAlign: (actionButtonAlign) => set({ actionButtonAlign }),
      setRiichiBgmSetting: (setting) => set({ riichiBgmSetting: setting }),
      setNormalBgmSetting: (setting) => set({ normalBgmSetting: setting }),
      setRiichiAvatar: (avatar) => set({ riichiAvatar: avatar }),
      setSpecialAbilitiesEnabled: (specialAbilitiesEnabled) =>
        set({ specialAbilitiesEnabled }),
      setTitleModeIndex: (titleModeIndex) => set({ titleModeIndex }),
      toggleDebugFlag: (key) =>
        set((state) => ({
          debugFlags: { ...state.debugFlags, [key]: !state.debugFlags[key] },
        })),
      toggleAutoAction: (key) =>
        set((state) => {
          const newVal = !state.autoActions[key];
          if (key === "pon" && newVal) {
            return {
              autoActions: { ...state.autoActions, pon: true, cancel: false },
            };
          }
          if (key === "cancel" && newVal) {
            return {
              autoActions: {
                ...state.autoActions,
                cancel: true,
                pon: false,
                ronTsumo: false,
                riichi: false,
              },
            };
          }
          if ((key === "ronTsumo" || key === "riichi") && newVal) {
            return {
              autoActions: { ...state.autoActions, [key]: true, cancel: false },
            };
          }
          return { autoActions: { ...state.autoActions, [key]: newVal } };
        }),
      setAutoActionTrayOpen: (autoActionTrayOpen) =>
        set({ autoActionTrayOpen }),
      setSimulationMode: (active) => set({ simulationMode: active }),
      addYakuCounts: (yakus) =>
        set((state) => {
          const yakuCounts = { ...state.yakuCounts };
          for (const y of yakus) {
            if (yakuCounts[y.name] != null) yakuCounts[y.name]++;
          }
          return { yakuCounts };
        }),
      goTo: (screen) => set({ currentScreen: screen }),
      showCutin: (text, playerIndex, type, imageVariant) =>
        set({
          cutin: text,
          cutinPlayer: playerIndex ?? null,
          cutinType: type ?? "normal",
          cutinImageVariant: imageVariant ?? "normal",
          cutinPreview: null,
        }),
      showDebugCutin: (text, playerIndex, preview, type, imageVariant) =>
        set({
          cutin: text,
          cutinPlayer: playerIndex,
          cutinType: type ?? "normal",
          cutinImageVariant: imageVariant ?? "normal",
          cutinPreview: preview,
        }),
      setRiichiCutin: (playerIndex, tileId, text) =>
        set({
          riichiCutinPlayer: playerIndex,
          riichiCutinTileId: tileId ?? null,
          riichiCutinText: text ?? "リーチ",
        }),
      setPendingRiichiCutin: (playerIndex, waiter) =>
        set({ pendingRiichiCutin: { playerIndex, waiter } }),
      setPendingWinCutin: (text, playerIndex, type, imageVariant) =>
        set({ pendingWinCutin: { text, playerIndex, type, imageVariant } }),
      advanceTurn: () =>
        set((state) => {
          const nextTurn = (state.turnIndex + 1) % PLAYER_COUNT;
          const newHands = [...state.hands];
          if (state.drawnTile != null) {
            const hand = [...newHands[state.turnIndex], state.drawnTile];
            hand.sort(sortTiles);
            newHands[state.turnIndex] = hand;
          }
          scheduleDrawForTurn(nextTurn, state.speed);
          return { turnIndex: nextTurn, drawnTile: null, hands: newHands };
        }),
      skipTurn: () =>
        set((state) => {
          const nextTurn = (state.turnIndex + 1) % PLAYER_COUNT;
          scheduleDrawForTurn(nextTurn, state.speed);
          return { turnIndex: nextTurn, drawnTile: null };
        }),
      hideCutin: () => {
        const s = useGameStore.getState();
        if (s.cutinPreview != null) {
          return set({
            cutin: null as string | null,
            cutinPlayer: null as number | null,
            cutinType: "normal" as const,
            cutinImageVariant: "normal" as const,
            cutinPreview: null as CutinPreview | null,
          });
        }
        if (s.winner != null) {
          const base = {
            cutin: null as string | null,
            cutinPlayer: null as number | null,
            cutinType: "normal" as const,
            cutinImageVariant: "normal" as const,
            cutinPreview: null as CutinPreview | null,
          };

          const damagedPlayers =
            s.ronTarget != null
              ? [s.ronTarget]
              : s.players.map((_, i) => i).filter((i) => i !== s.winner);

          const siranPlayers = damagedPlayers.filter(
            (i) =>
              s.specialAbilitiesEnabled &&
              s.abilityAssignments[i]?.abilityId === "siran" &&
              s.abilityReady[i] &&
              !s.abilityChargeLocked[i],
          );

          if (siranPlayers.length > 0) {
            for (const pi of siranPlayers) {
              s.setSiranGuardActive(pi, true);
              s.activateAbility(pi, "siran");
            }
            return set(base);
          }

          return set({ ...base, currentScreen: "result" as const });
        }
        if (s.ryuukyoku) {
          return set({
            cutin: null as string | null,
            cutinPlayer: null as number | null,
            cutinType: "normal" as const,
            cutinImageVariant: "normal" as const,
            cutinPreview: null as CutinPreview | null,
            currentScreen: "scoreConfirm" as const,
          });
        }
        return set({
          cutin: null as string | null,
          cutinPlayer: null as number | null,
          cutinType: "normal" as const,
          cutinImageVariant: "normal" as const,
          cutinPreview: null as CutinPreview | null,
        });
      },
      showSpeechBubble: (text, playerIndex) => {
        const id = nextBubbleId++;
        set((state) => ({
          speechBubbles: [...state.speechBubbles, { id, text, playerIndex }],
        }));
        setTimeout(() => {
          const current = useGameStore.getState().speechBubbles;
          if (current.some((b) => b.id === id)) {
            useGameStore.getState().hideSpeechBubble(id);
          }
        }, 2000);
      },
      hideSpeechBubble: (id) =>
        set((state) => ({
          speechBubbles: state.speechBubbles.filter((b) => b.id !== id),
        })),
      declareWin: (playerIndex) => set({ winner: playerIndex }),
      declareRiichi: (playerIndex) =>
        set((state) => {
          const riichi = [...state.riichi];
          riichi[playerIndex] = true;
          const ippatsu = [...state.ippatsu];
          ippatsu[playerIndex] = true;
          const doubleReach = [...state.doubleReach];
          doubleReach[playerIndex] = state.discards[playerIndex].length === 0;
          return {
            riichi,
            ippatsu,
            doubleReach,
            ...(getChargedAbilityState(state, playerIndex, "riichi") ?? {}),
          };
        }),
      clearWinner: () => set({ winner: null }),
      setRyuukyoku: () => set({ ryuukyoku: true }),
      moveParent: () =>
        set((state) => {
          const parentIndex = (state.parentIndex + 1) % 4;
          let { round, kyoku } = state;
          kyoku++;
          if (kyoku > 3) {
            if (round >= 1) {
              return {
                parentIndex,
                round: 1,
                kyoku: 3,
                honba: 0,
                gameOver: true,
              };
            }
            kyoku = 0;
            round++;
          }
          return { parentIndex, round, kyoku, honba: 0 };
        }),
      incrementHonba: () => set((state) => ({ honba: state.honba + 1 })),

      updateScore: (index, score) =>
        set((state) => {
          const players = [...state.players];
          players[index] = { ...players[index], score };
          return { players };
        }),
      deal: () => {
        const trendTypes = pickTrendTypes();
        const { hands, wall } = createHands(trendTypes);
        const state = useGameStore.getState();
        const doraTile = wall.at(-2) ?? null;
        const uradoraTile = wall.at(-1) ?? null;
        const wallWithoutDora = wall.slice(0, -2);
        const [top, ...rest] = wallWithoutDora;
        set(() => ({
          ...createRoundState(),
          hands,
          wall: rest,
          currentDealWallLength: wall.length,
          drawnTile: top,
          parentIndex: state.parentIndex,
          round: state.round,
          kyoku: state.kyoku,
          turnIndex: state.parentIndex,
          honba: state.honba,
          doraTile,
          uradoraTile,
          trendTypes,
          abilityGauge: state.abilityGauge,
          abilityReady: state.abilityReady,
          abilityChargeLocked: initialAbilityChargeLocked(),
        }));
        const stateAfterDeal = useGameStore.getState();
        const miimogePlayer = stateAfterDeal.abilityAssignments.findIndex(
          (a) => a?.abilityId === "miimoge",
        );
        if (
          miimogePlayer >= 0 &&
          stateAfterDeal.abilityGauge[miimogePlayer] >= ABILITY_MAX_GAUGE &&
          stateAfterDeal.abilityReady[miimogePlayer]
        ) {
          stateAfterDeal.activateAbility(miimogePlayer, "miimoge");
          set({ miimogeActive: true });
        }

        const anemogePlayer = stateAfterDeal.abilityAssignments.findIndex(
          (a) => a?.abilityId === "anemoge",
        );
        if (
          anemogePlayer >= 0 &&
          stateAfterDeal.abilityGauge[anemogePlayer] >= ABILITY_MAX_GAUGE &&
          stateAfterDeal.abilityReady[anemogePlayer]
        ) {
          const { diceResult, ...anemogeUpdates } = executeAnemogeSwap(
            anemogePlayer,
            stateAfterDeal.hands,
            stateAfterDeal.wall,
            stateAfterDeal.doraTile,
            stateAfterDeal.uradoraTile,
          );
          stateAfterDeal.activateAbility(
            anemogePlayer,
            "anemoge",
            `${ABILITY_LABELS.anemoge}(${diceResult})`,
          );
          set(anemogeUpdates);
        }

        const otyantiPlayer = stateAfterDeal.abilityAssignments.findIndex(
          (a) => a?.abilityId === "otyanti",
        );
        if (
          otyantiPlayer >= 0 &&
          stateAfterDeal.abilityGauge[otyantiPlayer] >= ABILITY_MAX_GAUGE &&
          stateAfterDeal.abilityReady[otyantiPlayer]
        ) {
          const { hands: swappedHands, wall: swappedWall } = executeOtyantiSwap(
            otyantiPlayer,
            stateAfterDeal.hands,
            stateAfterDeal.wall,
          );
          stateAfterDeal.activateAbility(otyantiPlayer, "otyanti");
          set({
            hands: swappedHands,
            wall: swappedWall,
            otyantiActive: true,
          });
        }
      },
      draw: () =>
        set((state) => {
          if (state.wall.length === 0) return state;

          if (
            state.otyantiActive &&
            state.abilityAssignments[state.turnIndex]?.abilityId === "otyanti"
          ) {
            const targetTileIds = [
              "burumoge",
              "miimoge",
              "siran",
              "anoko",
              "imouto",
              "otyanti",
            ];
            for (let i = 0; i < state.wall.length; i++) {
              if (targetTileIds.includes(getTileCharacterId(state.wall[i]))) {
                const newWall = [...state.wall];
                newWall.splice(i, 1);
                return { drawnTile: state.wall[i], wall: newWall };
              }
            }
          }

          const [top, ...rest] = state.wall;
          return { drawnTile: top, wall: rest };
        }),
      discard: (tileId, isRiichi) =>
        set((state) => {
          const turn = state.turnIndex;
          const hand = [...state.hands[turn]];
          const drawn = state.drawnTile;

          if (tileId !== drawn) {
            const idx = hand.indexOf(tileId);
            if (idx !== -1) hand.splice(idx, 1);
            if (drawn != null) {
              hand.push(drawn);
              hand.sort(sortTiles);
            }
          }

          const newHands = [...state.hands];
          newHands[turn] = hand;
          const newDiscards = [...state.discards];
          newDiscards[turn] = [...newDiscards[turn], tileId];
          const newTakenDiscards = state.takenDiscards.map((row) => [...row]);
          newTakenDiscards[turn] = [...newTakenDiscards[turn], false];

          const update: Partial<GameStore> = {
            hands: newHands,
            discards: newDiscards,
            takenDiscards: newTakenDiscards,
            lastDiscard: { tileId, fromPlayer: turn },
          };

          if (state.riichi[turn] && !isRiichi) {
            const newIppatsu = [...state.ippatsu];
            newIppatsu[turn] = false;
            update.ippatsu = newIppatsu;
          }

          if (isRiichi) {
            const newPositions = [
              ...(state.riichiDiscardPositions ?? [null, null, null, null]),
            ];
            newPositions[turn] = newDiscards[turn].length - 1;
            update.riichiDiscardPositions = newPositions;
          }

          const ronEligible = getRonEligiblePlayers(state, tileId, turn);
          if (ronEligible.length > 0) {
            update.pendingRon = {
              tileId,
              fromPlayer: turn,
              eligiblePlayers: ronEligible,
            };
            update.drawnTile = null;
            update.turnIndex = turn;
          } else {
            const eligiblePlayers = getEligiblePonPlayerIndexes({
              hands: state.hands,
              riichi: state.riichi,
              tileId,
              exceptPlayer: turn,
            });
            if (eligiblePlayers.length > 0) {
              update.pendingPon = { tileId, fromPlayer: turn };
              update.drawnTile = null;
              update.turnIndex = turn;
            } else {
              const nextTurn = (turn + 1) % 4;
              update.turnIndex = nextTurn;
              update.drawnTile = null;
              scheduleDrawForTurn(nextTurn, state.speed);
            }
          }

          return update;
        }),
      directDiscard: (playerIndex, tileId, isRiichi) =>
        set((state) => {
          const hand = [...state.hands[playerIndex]];
          const idx = hand.indexOf(tileId);
          if (idx === -1) return state;
          hand.splice(idx, 1);
          const newHands = [...state.hands];
          newHands[playerIndex] = hand;
          const newDiscards = [...state.discards];
          newDiscards[playerIndex] = [...newDiscards[playerIndex], tileId];
          const newTakenDiscards = state.takenDiscards.map((row) => [...row]);
          newTakenDiscards[playerIndex] = [
            ...newTakenDiscards[playerIndex],
            false,
          ];
          const update: Partial<GameStore> = {
            hands: newHands,
            discards: newDiscards,
            takenDiscards: newTakenDiscards,
          };
          if (isRiichi) {
            const newPositions = [
              ...(state.riichiDiscardPositions ?? [null, null, null, null]),
            ];
            newPositions[playerIndex] = newDiscards[playerIndex].length - 1;
            update.riichiDiscardPositions = newPositions;
          }
          return update;
        }),
      executePon: (playerIndex) =>
        set((state) => {
          const pon = state.pendingPon;
          if (!pon) return state;

          const { tileId, fromPlayer } = pon;

          const hand = [...state.hands[playerIndex]];
          const matchingTiles: number[] = [];
          const remaining: number[] = [];
          for (const id of hand) {
            if (isSameColorLikeTile(id, tileId) && matchingTiles.length < 2) {
              matchingTiles.push(id);
            } else {
              remaining.push(id);
            }
          }
          remaining.sort(sortTiles);

          const newTakenDiscards = state.takenDiscards.map((row) => [...row]);
          newTakenDiscards[fromPlayer][
            newTakenDiscards[fromPlayer].length - 1
          ] = true;

          const meld = [matchingTiles[0], matchingTiles[1], tileId];
          const newPonMelds = state.ponMelds.map((row) => [...row]);
          newPonMelds[playerIndex] = [...newPonMelds[playerIndex], meld];

          const newHands = [...state.hands];
          newHands[playerIndex] = remaining;

          return {
            hands: newHands,
            takenDiscards: newTakenDiscards,
            ponMelds: newPonMelds,
            pendingPon: null,
            turnIndex: playerIndex,
            drawnTile: null,
            ippatsu: [false, false, false, false],
            ...(getChargedAbilityState(state, playerIndex, "pon") ?? {}),
          };
        }),
      cancelPon: () =>
        set((state) => {
          if (!state.pendingPon) return state;
          const nextTurn = (state.pendingPon.fromPlayer + 1) % PLAYER_COUNT;
          scheduleDrawForTurn(nextTurn, state.speed);
          return {
            pendingPon: null,
            turnIndex: nextTurn,
            drawnTile: null,
          };
        }),
      executeRon: (playerIndex) =>
        set((state) => {
          if (!state.pendingRon) return state;
          if (!state.pendingRon.eligiblePlayers.includes(playerIndex))
            return state;
          return {
            winner: playerIndex,
            isRon: true,
            ronTarget: state.pendingRon.fromPlayer,
            pendingRon: null,
            pendingPon: null,
          };
        }),
      chargeAbility: (playerIndex, event, scoreAmount) =>
        set(
          (state) =>
            getChargedAbilityState(state, playerIndex, event, scoreAmount) ??
            state,
        ),
      setAimogeDangerColors: (playerIndex, colors) =>
        set((state) => {
          const aimogeDangerColors = [...state.aimogeDangerColors];
          aimogeDangerColors[playerIndex] = colors;
          return { aimogeDangerColors };
        }),
      setPikasanBonusPending: (playerIndex, pending) =>
        set((state) => {
          const pikasanBonusPending = [...state.pikasanBonusPending];
          pikasanBonusPending[playerIndex] = pending;
          return { pikasanBonusPending };
        }),
      setSiranGuardActive: (playerIndex, active) =>
        set((state) => {
          const siranGuardActive = [...state.siranGuardActive];
          siranGuardActive[playerIndex] = active;
          return { siranGuardActive };
        }),
      setAnokoSubstitutionPending: (playerIndex, pending) =>
        set((state) => {
          const anokoSubstitutionPending = [...state.anokoSubstitutionPending];
          anokoSubstitutionPending[playerIndex] = pending;
          return { anokoSubstitutionPending };
        }),
      swapHandsAndMelds: (playerA, playerB) =>
        set((state) => {
          const newHands = [...state.hands];
          const newPonMelds = state.ponMelds.map((m) => [...m]);
          const tempHand = newHands[playerA];
          newHands[playerA] = newHands[playerB];
          newHands[playerB] = tempHand;
          const tempPon = newPonMelds[playerA];
          newPonMelds[playerA] = newPonMelds[playerB];
          newPonMelds[playerB] = tempPon;
          return { hands: newHands, ponMelds: newPonMelds };
        }),
      mergeDrawnIntoHand: (playerIndex) =>
        set((state) => {
          if (state.drawnTile == null) return state;
          const newHands = [...state.hands];
          newHands[playerIndex] = [...newHands[playerIndex], state.drawnTile];
          newHands[playerIndex].sort(sortTiles);
          return { hands: newHands, drawnTile: null };
        }),
      activateAbility: (playerIndex, abilityId, text) =>
        set((state) => {
          if (!state.specialAbilitiesEnabled) return state;
          const resolvedAbilityId =
            abilityId ??
            state.abilityAssignments[playerIndex]?.abilityId ??
            null;
          if (resolvedAbilityId == null) return state;

          const nextGauge = [...state.abilityGauge];
          const nextReady = [...state.abilityReady];
          const nextLocked = [...state.abilityChargeLocked];
          nextGauge[playerIndex] = 0;
          nextReady[playerIndex] = false;
          nextLocked[playerIndex] = true;

          const cutinText = text ?? ABILITY_LABELS[resolvedAbilityId];

          if (state.abilityCutinActive) {
            return {
              abilityGauge: nextGauge,
              abilityReady: nextReady,
              abilityChargeLocked: nextLocked,
              abilityCutinQueue: [
                ...state.abilityCutinQueue,
                { playerIndex, text: cutinText },
              ],
            };
          }

          return {
            abilityGauge: nextGauge,
            abilityReady: nextReady,
            abilityChargeLocked: nextLocked,
            abilityCutinActive: true,
            abilityCutinPlayer: playerIndex,
            abilityCutinText: cutinText,
          };
        }),
      clearAbilityCutin: () =>
        set((state) => {
          if (state.abilityCutinQueue.length > 0) {
            const [next, ...rest] = state.abilityCutinQueue;
            return {
              abilityCutinPlayer: next.playerIndex,
              abilityCutinText: next.text,
              abilityCutinQueue: rest,
            };
          }
          if (state.pendingRiichiCutin != null) {
            const { playerIndex, waiter } = state.pendingRiichiCutin;
            return {
              abilityCutinActive: false,
              abilityCutinPlayer: null,
              abilityCutinText: "",
              abilityCutinQueue: [],
              pendingRiichiCutin: null,
              riichiCutinPlayer: playerIndex,
              riichiCutinTileId: waiter,
              riichiCutinText: "リーチ",
            };
          }
          if (state.pendingWinCutin != null) {
            const { text, playerIndex, type, imageVariant } =
              state.pendingWinCutin;
            return {
              abilityCutinActive: false,
              abilityCutinPlayer: null,
              abilityCutinText: "",
              abilityCutinQueue: [],
              pendingWinCutin: null,
              cutin: text,
              cutinPlayer: playerIndex,
              cutinType: type,
              cutinImageVariant: imageVariant,
            };
          }
          if (state.winner != null) {
            return {
              abilityCutinActive: false,
              abilityCutinPlayer: null,
              abilityCutinText: "",
              abilityCutinQueue: [],
              currentScreen: "result",
            };
          }
          return {
            abilityCutinActive: false,
            abilityCutinPlayer: null,
            abilityCutinText: "",
            abilityCutinQueue: [],
          };
        }),
      cancelRon: () =>
        set((state) => {
          if (!state.pendingRon) return state;
          const { tileId, fromPlayer } = state.pendingRon;
          const eligiblePonPlayers = getEligiblePonPlayerIndexes({
            hands: state.hands,
            riichi: state.riichi,
            tileId,
            exceptPlayer: fromPlayer,
          });

          if (eligiblePonPlayers.length > 0) {
            return {
              pendingRon: null,
              pendingPon: { tileId, fromPlayer },
              turnIndex: fromPlayer,
              drawnTile: null,
            };
          }

          const nextTurn = (fromPlayer + 1) % PLAYER_COUNT;
          scheduleDrawForTurn(nextTurn, state.speed);
          return {
            pendingRon: null,
            turnIndex: nextTurn,
            drawnTile: null,
          };
        }),
      resetData: () => {
        usePlayStatsStore.getState().resetPlayStats();
        set((state) => ({
          riichiCutinPlayer: null,
          riichiCutinTileId: null,
          ...createDefaultSettingsState(),
          screenMode: state.screenMode,
          gameSize: state.gameSize,
          lightweightMode: state.lightweightMode,
        }));
      },
      initGame: (players) =>
        set({
          ...createRoundState(),
          currentScreen: "scoreDisplay",
          players,
          abilityAssignments: initialAbilityAssignments(players),
          parentIndex: 0,
          cpuPersonalities: players.map((p) =>
            p.type === "cpu" ? generateRandomPersonality() : null,
          ),
        }),
      startTestGame: (config) => {
        set((_state) => {
          const players = config.players.map((p) => {
            const c = PLAYER_CONFIGS.find((pc) => pc.charId === p.charId);
            return {
              name: c?.name ?? p.charId,
              score: INITIAL_SCORE,
              type: p.type as "human" | "cpu",
              imageUrl: c?.imageUrl ?? "",
              colorHex: c?.colorHex ?? "#888",
              charId: p.charId,
            };
          });
          const abilityAssignments = players.map((p) =>
            createDefaultAbilityAssignment(p.charId),
          );
          const abilityGauge = config.players.map((p) =>
            Math.min(ABILITY_MAX_GAUGE, Math.max(0, p.abilityGauge)),
          );
          const abilityReady = abilityGauge.map((g) => g >= ABILITY_MAX_GAUGE);
          const cpuPersonalities = players.map((p) =>
            p.type === "cpu" ? generateRandomPersonality() : null,
          );
          const allHandTiles = config.hands.reduce((a, h) => a + h.length, 0);
          const fullWallLength = allHandTiles + config.wall.length;
          const [top, ...rest] = config.wall;
          return {
            ...createRoundState(),
            currentScreen: "game",
            players,
            abilityAssignments,
            abilityGauge,
            abilityReady,
            parentIndex: 0,
            hands: config.hands.map((h) => [...h]),
            wall: rest,
            currentDealWallLength: fullWallLength,
            drawnTile: top ?? null,
            turnIndex: 0,
            doraTile: config.doraTile ?? null,
            uradoraTile: config.uradoraTile ?? null,
            trendTypes: config.trendTypes,
            cpuPersonalities,
          };
        });
        const stateAfter = useGameStore.getState();
        const miimogePlayer = stateAfter.abilityAssignments.findIndex(
          (a) => a?.abilityId === "miimoge",
        );
        if (
          miimogePlayer >= 0 &&
          stateAfter.abilityGauge[miimogePlayer] >= ABILITY_MAX_GAUGE &&
          stateAfter.abilityReady[miimogePlayer]
        ) {
          stateAfter.activateAbility(miimogePlayer, "miimoge");
          set({ miimogeActive: true });
        }

        const anemogePlayer = stateAfter.abilityAssignments.findIndex(
          (a) => a?.abilityId === "anemoge",
        );
        if (
          anemogePlayer >= 0 &&
          stateAfter.abilityGauge[anemogePlayer] >= ABILITY_MAX_GAUGE &&
          stateAfter.abilityReady[anemogePlayer]
        ) {
          const { diceResult, ...anemogeUpdates } = executeAnemogeSwap(
            anemogePlayer,
            stateAfter.hands,
            stateAfter.wall,
            stateAfter.doraTile,
            stateAfter.uradoraTile,
          );
          stateAfter.activateAbility(
            anemogePlayer,
            "anemoge",
            `${ABILITY_LABELS.anemoge}(${diceResult})`,
          );
          set(anemogeUpdates);
        }

        const otyantiPlayer = stateAfter.abilityAssignments.findIndex(
          (a) => a?.abilityId === "otyanti",
        );
        if (
          otyantiPlayer >= 0 &&
          stateAfter.abilityGauge[otyantiPlayer] >= ABILITY_MAX_GAUGE &&
          stateAfter.abilityReady[otyantiPlayer]
        ) {
          const { hands: swappedHands, wall: swappedWall } = executeOtyantiSwap(
            otyantiPlayer,
            stateAfter.hands,
            stateAfter.wall,
          );
          stateAfter.activateAbility(otyantiPlayer, "otyanti");
          set({
            hands: swappedHands,
            wall: swappedWall,
            otyantiActive: true,
          });
        }
      },
      startDebugMidgame: (players) =>
        set((state) => {
          const nextPlayers = players ?? state.players;
          const cpuPersonalities = nextPlayers.map((p) =>
            p.type === "cpu" ? generateRandomPersonality() : null,
          );
          let debugState = buildDebugMidgameState({
            parentIndex: 0,
            round: 0,
            kyoku: 0,
            honba: 0,
          });

          for (
            let i = 0;
            i < 20 &&
            (!debugState.ponDone ||
              !debugState.riichiDone ||
              !debugState.doubleRiichiDone ||
              debugState.totalDiscards < 8);
            i++
          ) {
            debugState = buildDebugMidgameState({
              parentIndex: 0,
              round: 0,
              kyoku: 0,
              honba: 0,
            });
          }

          return {
            ...debugState.snapshot,
            currentScreen: "game",
            players: nextPlayers,
            abilityAssignments: initialAbilityAssignments(nextPlayers),
            parentIndex: 0,
            round: 0,
            kyoku: 0,
            honba: 0,
            cpuPersonalities,
          };
        }),
    }),
    {
      name: createStorageKey("settings"),
      partialize: (state) => ({
        speed: state.speed,
        textSize: state.textSize,
        masterVolume: state.masterVolume,
        bgmVolume: state.bgmVolume,
        seVolume: state.seVolume,
        voiceVolume: state.voiceVolume,
        screenMode: state.screenMode,
        lightweightMode: state.lightweightMode,
        titleModeIndex: state.titleModeIndex,
        actionButtonAlign: state.actionButtonAlign,
        riichiBgmSetting: state.riichiBgmSetting,
        normalBgmSetting: state.normalBgmSetting,
        riichiAvatar: state.riichiAvatar,
        debugFlags: state.debugFlags,
        autoActions: state.autoActions,
        autoActionTrayOpen: state.autoActionTrayOpen,
        yakuCounts: state.yakuCounts,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<GameStore>;
        return {
          ...current,
          ...p,
          autoActions: { ...current.autoActions, ...p.autoActions },
          yakuCounts: { ...current.yakuCounts, ...p.yakuCounts },
        };
      },
    },
  ),
);
