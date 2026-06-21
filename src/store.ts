import type { CpuPersonality } from "@/ai/CpuController";
import { generateRandomPersonality } from "@/ai/CpuController";
import type { BgmKey } from "@/constants/game";
import type { GameSize, ScreenMode } from "@/constants/layout";
import { DEFAULT_GAME_SIZE } from "@/constants/layout";
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
import { SPECIAL_YAKU } from "@/constants/specialYaku";
import { isSameColorLikeTile } from "@/constants/tiles";
import { YAKU } from "@/constants/yaku";
import { canFormWinningHand, findWaiterId, getEligiblePonPlayerIndexes } from "@/utils/check";
import { usePlayStatsStore } from "@/utils/playStats";
import { createStorageKey } from "@/utils/storage";
import { createHands, pickTrendTypes, shuffleArray, sortTiles } from "@/utils/tiles";
import { scheduleNextDraw } from "@/utils/turnScheduler";
import type { CutinImageVariant } from "@/utils/assets";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen =
  | "loading"
  | "title"
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

interface GameStore {
  currentScreen: Screen;
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
  setRiichiBgmSetting: (setting: BgmKey) => void;
  setNormalBgmSetting: (setting: BgmKey) => void;
  setRiichiAvatar: (avatar: "none" | "kanimoge" | "burumoge") => void;
  toggleDebugFlag: (
    key: "showAllTiles" | "manualCpu" | "alwaysTsumogiri" | "showCpuPersonalities",
  ) => void;
  toggleAutoAction: (key: "ronTsumo" | "pon" | "riichi" | "cancel") => void;
  setAutoActionTrayOpen: (open: boolean) => void;
  addYakuCounts: (yakus: { name: string }[]) => void;
  goTo: (screen: Screen) => void;
  updateScore: (index: number, score: number) => void;
  deal: () => void;
  draw: () => void;
  discard: (tileId: number, isRiichi?: boolean) => void;
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
  setRiichiCutin: (playerIndex: number | null, tileId?: number | null) => void;
  showSpeechBubble: (text: string, playerIndex: number) => void;
  hideSpeechBubble: (id: number) => void;
  declareWin: (playerIndex: number) => void;
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
  resetData: () => void;
  initGame: (players: Player[]) => void;
  startDebugMidgame: (players?: Player[]) => void;
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
    if (canFormWinningHand(allTiles)) {
      result.push(i);
    }
  }
  return result;
}

const defaultPlayers: Player[] = PLAYER_CONFIGS.map((config, index) => ({
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
    draw: () => useGameStore.getState().draw(),
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
  state.takenDiscards[playerIndex] = [...state.takenDiscards[playerIndex], false];
  state.lastDiscard = { tileId, fromPlayer: playerIndex };
  if (isRiichi) {
    state.riichi[playerIndex] = true;
    state.ippatsu[playerIndex] = true;
    state.doubleReach[playerIndex] = state.discards[playerIndex].length === 1;
    state.riichiDiscardPositions[playerIndex] = state.discards[playerIndex].length - 1;
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
  state.takenDiscards[fromPlayer][state.takenDiscards[fromPlayer].length - 1] = true;
  state.ponMelds[callerIndex] = [...state.ponMelds[callerIndex], [...matchingTiles, tileId]];
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
    Array.from({ length: PLAYER_COUNT }, (_, i) => i).filter((i) => i !== playerIndex),
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
    cpuCandidates.find((candidate) => candidate.playerIndex !== doubleRiichiPlayer)?.playerIndex ?? 2;

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
    const waiterId = findWaiterId([...state.hands[activePlayer], state.drawnTile]);
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
    const ponOpportunity = !ponDone ? findPonOpportunity(state, activePlayer) : null;
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
      applyDebugPon(state, ponOpportunity.callerIndex, activePlayer, discardTile)
    ) {
      ponDone = true;

      if (state.hands[ponOpportunity.callerIndex].length > 0) {
        const ponDiscardOptions = [...state.hands[ponOpportunity.callerIndex]];
        const ponDiscardTile =
          ponDiscardOptions[Math.floor(Math.random() * ponDiscardOptions.length)];
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
      players: defaultPlayers,
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
      setRiichiBgmSetting: (setting) => set({ riichiBgmSetting: setting }),
      setNormalBgmSetting: (setting) => set({ normalBgmSetting: setting }),
      setRiichiAvatar: (avatar) => set({ riichiAvatar: avatar }),
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
              autoActions: { ...state.autoActions, cancel: true, pon: false },
            };
          }
          return { autoActions: { ...state.autoActions, [key]: newVal } };
        }),
      setAutoActionTrayOpen: (autoActionTrayOpen) => set({ autoActionTrayOpen }),
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
      setRiichiCutin: (playerIndex, tileId) =>
        set({
          riichiCutinPlayer: playerIndex,
          riichiCutinTileId: tileId ?? null,
        }),
      hideCutin: () =>
        set((state) => {
          if (state.cutinPreview != null) {
            return {
              cutin: null,
              cutinPlayer: null,
              cutinType: "normal",
              cutinImageVariant: "normal",
              cutinPreview: null,
            };
          }
          if (state.winner != null) {
            return {
              cutin: null,
              cutinPlayer: null,
              cutinType: "normal",
              cutinImageVariant: "normal",
              cutinPreview: null,
              currentScreen: "result",
            };
          }
          if (state.ryuukyoku) {
            return {
              cutin: null,
              cutinPlayer: null,
              cutinType: "normal",
              cutinImageVariant: "normal",
              cutinPreview: null,
              currentScreen: "scoreConfirm",
            };
          }
          return {
            cutin: null,
            cutinPlayer: null,
            cutinType: "normal",
            cutinImageVariant: "normal",
            cutinPreview: null,
          };
        }),
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
          return { riichi, ippatsu, doubleReach };
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
        }));
      },
      draw: () =>
        set((state) => {
          if (state.wall.length === 0) return state;
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
      resetData: () =>
        {
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
          parentIndex: 0,
          cpuPersonalities: players.map((p) =>
            p.type === "cpu" ? generateRandomPersonality() : null,
          ),
        }),
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
