import type { CpuPersonality } from "@/ai/CpuController";
import { generateRandomPersonality } from "@/ai/CpuController";
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
import { SPECIAL_YAKU } from "@/constants/specialYaku";
import { isSameColorLikeTile } from "@/constants/tiles";
import { YAKU } from "@/constants/yaku";
import { canFormWinningHand, getEligiblePonPlayerIndexes } from "@/utils/check";
import { usePlayStatsStore } from "@/utils/playStats";
import { createStorageKey } from "@/utils/storage";
import { createHands, pickTrendTypes, sortTiles } from "@/utils/tiles";
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
  setRiichiBgmSetting: (setting: BgmKey) => void;
  setNormalBgmSetting: (setting: BgmKey) => void;
  setRiichiAvatar: (avatar: "none" | "kanimoge" | "burumoge") => void;
  toggleDebugFlag: (
    key: "showAllTiles" | "manualCpu" | "alwaysTsumogiri" | "showCpuPersonalities",
  ) => void;
  toggleAutoAction: (key: "ronTsumo" | "pon" | "riichi" | "cancel") => void;
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
  | "riichiBgmSetting"
  | "normalBgmSetting"
  | "riichiAvatar"
  | "debugFlags"
  | "autoActions"
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
    riichiBgmSetting: "riichi" as const,
    normalBgmSetting: "game" as const,
    riichiAvatar: "kanimoge" as const,
    debugFlags: createDefaultDebugFlags(),
    autoActions: createDefaultAutoActions(),
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
          set({
            riichiCutinPlayer: null,
            riichiCutinTileId: null,
            ...createDefaultSettingsState(),
          });
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
        riichiBgmSetting: state.riichiBgmSetting,
        normalBgmSetting: state.normalBgmSetting,
        riichiAvatar: state.riichiAvatar,
        debugFlags: state.debugFlags,
        autoActions: state.autoActions,
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
