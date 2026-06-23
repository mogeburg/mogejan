import {
  CPU_DELAYS_BY_SPEED,
  DEFAULT_CPU_STRENGTH,
  type CpuStrength,
} from "@/constants/game";
import {
  getBasicTileId,
  findTileDataById,
  getTileColor,
  getTrendTileId,
  getTrendIndex,
  isDoraLikeTile,
  isTrendTile,
} from "@/constants/tiles";
import { useGameStore } from "@/store";
import {
  canFormTenpai,
  canFormWinningHand,
  findWaiterId,
  getEligiblePonPlayerIndexes,
} from "@/utils/check";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";
import { evaluateYaku } from "@/utils/evaluateYaku";
import {
  canDeclareRiichi,
  canDeclareRiichiForTiles,
  getProjectedTotalYaku,
} from "@/utils/gameplay";
import {
  countAllTileColors,
  countTileColors,
  getTilesWithDrawnTile,
} from "@/utils/tiles";

interface CpuProfile {
  label: string;
  randomDiscardRate: number;
  riichiRate: number;
  missTenpaiRate: number;
  ponRate: number;
  safeFoldRate: number;
  minRiichiYaku: number;
  targetWinYaku: number;
  threatenedRiichiYaku: number;
  threatenedPushRate: number;
  doraValueWeight: number;
  selfWindValueWeight: number;
  parentPushBonus: {
    riichiRate: number;
    threatenedPushRate: number;
    targetWinYakuDelta: number;
    minRiichiYakuDelta: number;
    safeFoldRateDelta: number;
  };
  discardPriority: number[];
}

// 性格上書き用
export type CpuDiscardOverride = (
  hand: number[],
  ponMelds: number[][],
  drawnTile: number | null,
  isRiichi: boolean,
  profile: CpuProfile,
) => CpuDiscardResult | null;

export interface CpuPersonality {
  label: string;
  weight: number;
  discard?: CpuDiscardOverride;
}

const CPU_PROFILES: Record<string, CpuProfile> = {
  easy: {
    label: "初心者",
    randomDiscardRate: 0.12,
    riichiRate: 0.25,
    missTenpaiRate: 0.22,
    ponRate: 0.4,
    safeFoldRate: 0.6,
    minRiichiYaku: 1,
    targetWinYaku: 1,
    threatenedRiichiYaku: 1,
    threatenedPushRate: 0.8,
    doraValueWeight: 0.72,
    selfWindValueWeight: 0.72,
    parentPushBonus: {
      riichiRate: 0.05,
      threatenedPushRate: 0.05,
      targetWinYakuDelta: 0,
      minRiichiYakuDelta: 0,
      safeFoldRateDelta: -0.05,
    },
    discardPriority: [4, 1, 5, 2],
  },
  normal: {
    label: "中級者",
    randomDiscardRate: 0.02,
    riichiRate: 0.7,
    missTenpaiRate: 0.05,
    ponRate: 0.75,
    safeFoldRate: 0.9,
    minRiichiYaku: 2,
    targetWinYaku: 2,
    threatenedRiichiYaku: 2,
    threatenedPushRate: 0.55,
    doraValueWeight: 1,
    selfWindValueWeight: 1,
    parentPushBonus: {
      riichiRate: 0.08,
      threatenedPushRate: 0.08,
      targetWinYakuDelta: 0,
      minRiichiYakuDelta: 0,
      safeFoldRateDelta: -0.08,
    },
    discardPriority: [4, 1, 5, 2],
  },
  hard: {
    label: "上級者",
    randomDiscardRate: 0.0,
    riichiRate: 0.85,
    missTenpaiRate: 0.0,
    ponRate: 1.0,
    safeFoldRate: 1.0,
    minRiichiYaku: 4,
    targetWinYaku: 4,
    threatenedRiichiYaku: 1,
    threatenedPushRate: 0.25,
    doraValueWeight: 1.08,
    selfWindValueWeight: 1.04,
    parentPushBonus: {
      riichiRate: 0.12,
      threatenedPushRate: 0.18,
      targetWinYakuDelta: -1,
      minRiichiYakuDelta: -1,
      safeFoldRateDelta: -0.18,
    },
    discardPriority: [4, 1, 5, 2],
  },
};

export interface CpuDiscardResult {
  tileId: number;
  declareRiichi?: boolean;
}

export function getCpuProfile(strength?: CpuStrength) {
  return CPU_PROFILES[strength ?? DEFAULT_CPU_STRENGTH] ?? CPU_PROFILES.normal;
}

/**
 * Apply personality weight to a base profile.
 * weight: 1-10 (1=defensive, 10=aggressive, ~5.5=neutral)
 * Returns multipliers for scoring plus the adjusted profile.
 */
function applyWeights(
  profile: CpuProfile,
  personality: CpuPersonality,
): {
  adjusted: CpuProfile;
  multipliers: {
    attackMul: number;
    defenseMul: number;
  };
} {
  const raw = ((personality.weight ?? 5.5) - 5.5) / 4.5;
  const attackMul = 1.0 + raw;
  const defenseMul = 1.0 - raw;
  const targetYakuDelta = raw >= 0.45 ? 1 : raw <= -0.45 ? -1 : 0;
  const threatenedYakuDelta = raw >= 0.55 ? 1 : 0;

  let {
    safeFoldRate,
    randomDiscardRate,
    riichiRate,
    ponRate,
    threatenedPushRate,
    minRiichiYaku,
    targetWinYaku,
    threatenedRiichiYaku,
    doraValueWeight,
    selfWindValueWeight,
    ...rest
  } = profile;

  safeFoldRate =
    defenseMul >= 1 ? Math.min(1, safeFoldRate * defenseMul) : safeFoldRate;
  safeFoldRate =
    attackMul >= 1 ? Math.max(0, safeFoldRate / attackMul) : safeFoldRate;

  riichiRate = clampRate(riichiRate + raw * 0.18);
  ponRate = clampRate(ponRate + raw * 0.14);
  threatenedPushRate = clampRate(threatenedPushRate + raw * 0.2);
  randomDiscardRate = clampRate(randomDiscardRate - Math.max(0, raw) * 0.04);
  minRiichiYaku = Math.max(1, minRiichiYaku + targetYakuDelta);
  targetWinYaku = Math.max(1, targetWinYaku + targetYakuDelta);
  threatenedRiichiYaku = Math.max(1, threatenedRiichiYaku + threatenedYakuDelta);
  doraValueWeight = Math.max(0.45, doraValueWeight + raw * 0.12);
  selfWindValueWeight = Math.max(0.45, selfWindValueWeight + raw * 0.08);

  return {
    adjusted: {
      ...rest,
      safeFoldRate,
      randomDiscardRate,
      riichiRate,
      ponRate,
      threatenedPushRate,
      minRiichiYaku,
      targetWinYaku,
      threatenedRiichiYaku,
      doraValueWeight,
      selfWindValueWeight,
    },
    multipliers: { attackMul, defenseMul },
  };
}

export function randomPick<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export function hasRiichiOpponent(): boolean {
  const state = useGameStore.getState();
  return state.riichi.some(
    (riichi, index) => riichi && index !== state.turnIndex,
  );
}

interface VisibleColorState {
  remainingByColor: number[];
  safeColors: Set<number>;
  visibleCounts: number[];
}

function getVisibleColorState(playerIndex: number): VisibleColorState {
  const state = useGameStore.getState();

  const totalByColor = new Array(21).fill(0);
  for (let i = 0; i < 9; i++) totalByColor[i] = 9;
  for (const t of state.trendTypes) totalByColor[9 + t] = 4;

  const allDiscards = state.discards.flatMap((d, i) =>
    d.filter((_, j) => !state.takenDiscards[i][j]),
  );
  const allPonTiles = state.ponMelds.flat(2);
  const dora = state.doraTile != null ? [state.doraTile] : [];
  const visibleTiles = [...allDiscards, ...allPonTiles, ...dora];

  const visibleCounts = countAllTileColors(visibleTiles);
  const ownHandCounts = countAllTileColors(state.hands[playerIndex]);

  const remainingByColor = totalByColor.map((total, i) =>
    Math.max(0, total - visibleCounts[i] - ownHandCounts[i]),
  );

  const safeColors = new Set<number>();
  for (let i = 0; i < state.riichi.length; i++) {
    if (!state.riichi[i] || i === playerIndex) continue;
    const oppDiscards = state.discards[i];
    const oppTaken = state.takenDiscards[i];
    for (let j = 0; j < oppDiscards.length; j++) {
      if (!oppTaken[j]) safeColors.add(getTileColor(oppDiscards[j]));
    }
  }

  return { remainingByColor, safeColors, visibleCounts };
}

export function chooseSafeDiscard(
  discardableTiles: number[],
  tilePool: number[],
): number | null {
  const playerIndex = useGameStore.getState().turnIndex;
  const { remainingByColor, safeColors } = getVisibleColorState(playerIndex);
  const dangerColors = getAimogePreciseDanger();
  const counts = countAllTileColors(tilePool);

  let best = -Infinity;
  let candidates: number[] = [];
  for (const id of discardableTiles) {
    const color = getTileColor(id);
    const remaining = remainingByColor[color] ?? 0;
    const isSafe = safeColors.has(color);
    const isDanger = dangerColors.has(color);
    const score =
      remaining +
      (isSafe ? 100 : 0) +
      (isDanger ? -10000 : 0) +
      (counts[color] >= 2 ? 10 : 0);
    if (score > best) {
      best = score;
      candidates = [id];
    } else if (score === best) candidates.push(id);
  }
  return randomPick(candidates);
}

// ============================================================
// Scoring-based discard system
// ============================================================

interface EvalContext {
  playerIndex: number;
  tilePool: number[];
  allTiles: number[];
  ponMelds: number[][];
  hasPonMelds: boolean;
  playerName: string;
  doraTile: number | null;
  trendTypes: number[];
  visibleCounts: number[];
  dangerColors: Set<number>;
  defenseMul: number;
  attackMul: number;
  minRiichiYaku: number;
  targetWinYaku: number;
  threatenedRiichiYaku: number;
  doraValueWeight: number;
  selfWindValueWeight: number;
}

function getVisibleCounts(): number[] {
  const state = useGameStore.getState();
  const allDiscards = state.discards.flatMap((d, i) =>
    d.filter((_, j) => !state.takenDiscards[i][j]),
  );
  const allPonTiles = state.ponMelds.flat(2);
  const dora = state.doraTile != null ? [state.doraTile] : [];
  return countAllTileColors([...allDiscards, ...allPonTiles, ...dora]);
}

function removeSingleTile(tiles: number[], tileId: number): number[] {
  const nextTiles = [...tiles];
  const discardIndex = nextTiles.indexOf(tileId);
  if (discardIndex >= 0) {
    nextTiles.splice(discardIndex, 1);
  }
  return nextTiles;
}

function getCandidateWinningTiles(trendTypes: number[]): number[] {
  return [
    ...Array.from({ length: 9 }, (_, index) => getBasicTileId(index)),
    ...trendTypes.map((trendType) => getTrendTileId(trendType)),
  ];
}

function evaluateDiscardFuturePotential(tileId: number, ctx: EvalContext): number {
  const handAfterDiscard = removeSingleTile(ctx.tilePool, tileId);
  const openMeldTiles = ctx.ponMelds.flat();
  const totalByColor = new Array(21).fill(0);
  for (let i = 0; i < 9; i++) totalByColor[i] = 9;
  for (const trendType of ctx.trendTypes) totalByColor[9 + trendType] = 4;
  const ownTileCounts = countAllTileColors(ctx.tilePool);
  const remainingByColor = totalByColor.map((total, index) =>
    Math.max(0, total - (ctx.visibleCounts[index] ?? 0) - (ownTileCounts[index] ?? 0)),
  );
  let potentialScore = 0;
  const underRiichiThreat = hasRiichiOpponent();
  const targetWinYaku = underRiichiThreat
    ? ctx.threatenedRiichiYaku
    : ctx.targetWinYaku;
  const riichiMinYaku = underRiichiThreat
    ? ctx.threatenedRiichiYaku
    : ctx.minRiichiYaku;

  for (const drawTileId of getCandidateWinningTiles(ctx.trendTypes)) {
    const remainingCount = remainingByColor[getTileColor(drawTileId)] ?? 0;
    if (remainingCount <= 0) continue;

    const nextTiles = [...handAfterDiscard, drawTileId];
    const allTiles = [...nextTiles, ...openMeldTiles];

    if (canFormWinningHand(allTiles)) {
      const totalYaku = getProjectedTotalYaku({
        riichi: false,
        doubleReach: false,
        ippatsu: false,
        isRon: false,
        hasPonMelds: ctx.hasPonMelds,
        doraTile: ctx.doraTile,
        uradoraTile: null,
        allTiles,
        winnerDiscardsEmpty: false,
        playerName: ctx.playerName,
        trendTypes: ctx.trendTypes,
      });

      if (totalYaku >= targetWinYaku) {
        potentialScore += remainingCount * (900 + totalYaku * 160);
      } else if (totalYaku >= riichiMinYaku) {
        potentialScore += remainingCount * (220 + totalYaku * 55);
      }
      continue;
    }

    if (!canFormTenpai(nextTiles)) continue;
    const waiter = findWaiterId(nextTiles);
    if (waiter == null) continue;

    if (
      canDeclareRiichiForTiles({
        tiles: nextTiles,
        discardTileId: waiter,
        openMeldTiles,
        hasPonMelds: ctx.hasPonMelds,
        doraTile: ctx.doraTile,
        playerName: ctx.playerName,
        trendTypes: ctx.trendTypes,
        winnerDiscardsEmpty: false,
        doubleReach: false,
        minTotalYaku: riichiMinYaku,
      })
    ) {
      potentialScore += remainingCount * (underRiichiThreat ? 180 : 420);
    }
  }

  return potentialScore;
}

function evaluateTile(tileId: number, ctx: EvalContext): number {
  const colorIdx = findTileDataById(tileId).colorIndex;
  const charName = findTileDataById(tileId).name;
  const isDoraColorTile =
    ctx.doraTile != null && isDoraLikeTile(tileId, ctx.doraTile);
  const isSelfWindTile = charName === ctx.playerName;
  const visibleCount = ctx.visibleCounts[colorIdx] ?? 0;
  const remainingCopies = Math.max(0, (colorIdx < 9 ? 9 : 4) - visibleCount);
  const roleLiveFactor = remainingCopies >= 4
    ? 1
    : remainingCopies === 3
      ? 0.78
      : remainingCopies === 2
        ? 0.52
        : remainingCopies === 1
          ? 0.28
          : 0.1;
  let offScore = 0;
  let defScore = 0;

  // 1. Completed role protection (+300)
  if (isDoraColorTile) {
    const cnt = ctx.allTiles.filter((id) =>
      isDoraLikeTile(id, ctx.doraTile!),
    ).length;
    if (cnt >= 3) offScore += 300 * ctx.doraValueWeight * roleLiveFactor;
  }
  if (isSelfWindTile) {
    const cnt = ctx.allTiles.filter(
      (id) => findTileDataById(id).name === ctx.playerName,
    ).length;
    if (cnt >= 3) offScore += 300 * ctx.selfWindValueWeight * roleLiveFactor;
  }
  if (isTrendTile(tileId)) {
    const trendIdx = getTrendIndex(tileId);
    if (ctx.trendTypes.includes(trendIdx)) {
      const cnt = ctx.allTiles.filter(
        (id) => isTrendTile(id) && getTrendIndex(id) === trendIdx,
      ).length;
      if (cnt >= 3) offScore += 300 * roleLiveFactor;
    }
  }

  // 2. Distance to completion
  if (isDoraColorTile) {
    const cnt = ctx.allTiles.filter((id) =>
      isDoraLikeTile(id, ctx.doraTile!),
    ).length;
    const remain = Math.max(0, 3 - cnt);
    if (remain <= 2) {
      offScore += (400 - remain * 100) * ctx.doraValueWeight * roleLiveFactor;
    }
    offScore += 50 * ctx.doraValueWeight * roleLiveFactor;
  }
  if (isSelfWindTile) {
    const cnt = ctx.allTiles.filter(
      (id) => findTileDataById(id).name === ctx.playerName,
    ).length;
    const remain = Math.max(0, 3 - cnt);
    if (remain <= 2) {
      offScore +=
        (400 - remain * 100) * ctx.selfWindValueWeight * roleLiveFactor;
    }
    offScore += 50 * ctx.selfWindValueWeight * roleLiveFactor;
  }
  if (isTrendTile(tileId)) {
    const trendIdx = getTrendIndex(tileId);
    if (ctx.trendTypes.includes(trendIdx)) {
      const cnt = ctx.allTiles.filter(
        (id) => isTrendTile(id) && getTrendIndex(id) === trendIdx,
      ).length;
      const remain = Math.max(0, 3 - cnt);
      if (remain <= 2) offScore += (400 - remain * 100) * roleLiveFactor;
      offScore += 50 * roleLiveFactor;
    }
  }

  // 3. Color diversity / pattern yaku
  if (colorIdx < 9) {
    const basicCounts = countTileColors(ctx.tilePool);
    const distinctCount = basicCounts.filter((c) => c > 0).length;

    if (distinctCount <= 2) {
      offScore += basicCounts[colorIdx] * 40;
    } else if (distinctCount >= 8) {
      if (basicCounts[colorIdx] === 1) offScore += 200;
    }
    const cnt = basicCounts[colorIdx];
    if (cnt >= 3) offScore += cnt * 30;
    else if (cnt === 2) offScore += 50;
  }

  // 4. Multi-role contribution
  let roleCount = 0;
  if (isDoraColorTile) roleCount += ctx.doraValueWeight * roleLiveFactor;
  if (isSelfWindTile) roleCount += ctx.selfWindValueWeight * roleLiveFactor;
  if (isTrendTile(tileId) && ctx.trendTypes.includes(getTrendIndex(tileId))) {
    roleCount += roleLiveFactor;
  }
  offScore += roleCount * 50;

  // 5. Dead tile penalty
  defScore += (ctx.visibleCounts[colorIdx] ?? 0) * 20;
  if (
    (isDoraColorTile || isSelfWindTile || (isTrendTile(tileId) && ctx.trendTypes.includes(getTrendIndex(tileId)))) &&
    remainingCopies <= 1
  ) {
    defScore += 120;
  }

  // 6. Danger avoidance (riichi opponent)
  if (ctx.dangerColors.has(colorIdx)) {
    defScore += 200 * ctx.defenseMul;
  }

  return Math.round(offScore * ctx.attackMul - defScore);
}

function getAimogePreciseDanger(): Set<number> {
  const state = useGameStore.getState();
  if (!state.specialAbilitiesEnabled) return new Set<number>();
  const colors = state.aimogeDangerColors[state.turnIndex];
  return colors != null && colors.length > 0 ? new Set(colors) : new Set<number>();
}

function getDangerColors(): Set<number> {
  const precise = getAimogePreciseDanger();
  if (precise.size > 0) return precise;

  const state = useGameStore.getState();
  const colors = new Set<number>();
  for (let i = 0; i < state.riichi.length; i++) {
    if (!state.riichi[i]) continue;
    for (const id of state.discards[i]) {
      colors.add(getTileColor(id));
    }
  }
  return colors;
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function applyParentPushBonus(
  profile: CpuProfile,
  isParentTurn: boolean,
): CpuProfile {
  if (!isParentTurn) return profile;
  return {
    ...profile,
    riichiRate: clampRate(profile.riichiRate + profile.parentPushBonus.riichiRate),
    threatenedPushRate: clampRate(
      profile.threatenedPushRate + profile.parentPushBonus.threatenedPushRate,
    ),
    safeFoldRate: clampRate(
      profile.safeFoldRate + profile.parentPushBonus.safeFoldRateDelta,
    ),
    minRiichiYaku: Math.max(
      1,
      profile.minRiichiYaku + profile.parentPushBonus.minRiichiYakuDelta,
    ),
    targetWinYaku: Math.max(
      1,
      profile.targetWinYaku + profile.parentPushBonus.targetWinYakuDelta,
    ),
  };
}

function getTotalDiscardCount(): number {
  const state = useGameStore.getState();
  return state.discards.reduce((sum, row) => sum + row.length, 0);
}

function applyRoundProgressYakuTarget(
  profile: CpuProfile,
  strength: CpuStrength,
): CpuProfile {
  if (strength !== "hard") return profile;

  const totalDiscards = getTotalDiscardCount();
  const stagedTarget =
    totalDiscards >= 50 ? 1 :
    totalDiscards >= 40 ? 2 :
    totalDiscards >= 30 ? 3 :
    totalDiscards >= 20 ? 4 :
    5;

  return {
    ...profile,
    minRiichiYaku: stagedTarget,
    targetWinYaku: stagedTarget,
  };
}

function chooseByScore(
  discardableTiles: number[],
  ctx: EvalContext,
): number | null {
  if (discardableTiles.length === 0) return null;
  const aimogeDanger = getAimogePreciseDanger();
  const scored = discardableTiles.map((id) => ({
    id,
    score: evaluateTile(id, ctx) - evaluateDiscardFuturePotential(id, ctx)
      + (aimogeDanger.has(getTileColor(id)) ? 10000 : 0),
  }));
  const minScore = Math.min(...scored.map((s) => s.score));
  const candidates = scored
    .filter((s) => s.score === minScore)
    .map((s) => s.id);
  return randomPick(candidates);
}

function evaluateHandScore(
  tilePool: number[],
  allTiles: number[],
  ponMelds: number[][],
  base: Pick<
    EvalContext,
    | "playerIndex"
    | "playerName"
    | "ponMelds"
    | "doraTile"
    | "trendTypes"
    | "visibleCounts"
    | "dangerColors"
    | "defenseMul"
    | "attackMul"
    | "minRiichiYaku"
    | "targetWinYaku"
    | "threatenedRiichiYaku"
    | "doraValueWeight"
    | "selfWindValueWeight"
  >,
): number {
  if (tilePool.length === 0) return 0;
  const ctx: EvalContext = {
    tilePool,
    allTiles,
    hasPonMelds: ponMelds.length > 0,
    ...base,
  };
  const total = tilePool.reduce((sum, id) => sum + evaluateTile(id, ctx), 0);
  return total / tilePool.length;
}

function simulatePon(
  hand: number[],
  ponMelds: number[][],
  tileId: number,
): { newHand: number[]; newPonMelds: number[][] } | null {
  const matching = hand.filter(
    (id) => getTileColor(id) === getTileColor(tileId),
  );
  if (matching.length < 2) return null;
  const newHand = [...hand];
  for (let i = 0; i < 2; i++) {
    const idx = newHand.findIndex(
      (id) => getTileColor(id) === getTileColor(tileId),
    );
    if (idx >= 0) newHand.splice(idx, 1);
  }
  return { newHand, newPonMelds: [...ponMelds, [tileId, tileId, tileId]] };
}

function getBestWinningYakuAfterDiscard(
  handAfterDiscard: number[],
  openMeldTiles: number[],
  meta: {
    hasPonMelds: boolean;
    doraTile: number | null;
    playerName: string;
    trendTypes: number[];
    winnerDiscardsEmpty: boolean;
    doubleReach: boolean;
    allowRiichi: boolean;
  },
): number {
  let best = 0;

  for (const winningTileId of getCandidateWinningTiles(meta.trendTypes)) {
    const allTiles = [...handAfterDiscard, winningTileId, ...openMeldTiles];
    if (!canFormWinningHand(allTiles)) continue;

    best = Math.max(
      best,
      getProjectedTotalYaku({
        riichi: false,
        doubleReach: false,
        ippatsu: false,
        isRon: true,
        hasPonMelds: meta.hasPonMelds,
        doraTile: meta.doraTile,
        uradoraTile: null,
        allTiles,
        winnerDiscardsEmpty: meta.winnerDiscardsEmpty,
        playerName: meta.playerName,
        trendTypes: meta.trendTypes,
      }),
    );
  }

  if (!meta.allowRiichi) return best;

  for (const discardTileId of handAfterDiscard) {
    const tilesBeforeWin = [...handAfterDiscard, discardTileId];
    if (
      !canDeclareRiichiForTiles({
        tiles: tilesBeforeWin,
        discardTileId,
        openMeldTiles,
        hasPonMelds: meta.hasPonMelds,
        doraTile: meta.doraTile,
        playerName: meta.playerName,
        trendTypes: meta.trendTypes,
        winnerDiscardsEmpty: meta.winnerDiscardsEmpty,
        doubleReach: meta.doubleReach,
        minTotalYaku: 1,
      })
    ) {
      continue;
    }

    for (const winningTileId of getCandidateWinningTiles(meta.trendTypes)) {
      const allTiles = [...handAfterDiscard, winningTileId, ...openMeldTiles];
      if (!canFormWinningHand(allTiles)) continue;

      best = Math.max(
        best,
        getProjectedTotalYaku({
          riichi: true,
          doubleReach: meta.doubleReach,
          ippatsu: false,
          isRon: true,
          hasPonMelds: meta.hasPonMelds,
          doraTile: meta.doraTile,
          uradoraTile: null,
          allTiles,
          winnerDiscardsEmpty: meta.winnerDiscardsEmpty,
          playerName: meta.playerName,
          trendTypes: meta.trendTypes,
        }),
      );
    }
  }

  return best;
}

function estimateExpectedYakuAfterCall(
  hand: number[],
  ponMelds: number[][],
  playerName: string,
  doraTile: number | null,
  trendTypes: number[],
  visibleCounts: number[],
  winnerDiscardsEmpty: boolean,
  doubleReach: boolean,
): number {
  const openMeldTiles = ponMelds.flat();
  const hasPonMelds = ponMelds.length > 0;
  const totalByColor = new Array(21).fill(0);
  for (let i = 0; i < 9; i++) totalByColor[i] = 9;
  for (const trendType of trendTypes) totalByColor[9 + trendType] = 4;

  const ownTileCounts = countAllTileColors(hand);
  const remainingByColor = totalByColor.map((total, index) =>
    Math.max(0, total - (visibleCounts[index] ?? 0) - (ownTileCounts[index] ?? 0)),
  );

  let totalWeight = 0;
  let totalExpectedYaku = 0;

  for (const drawTileId of getCandidateWinningTiles(trendTypes)) {
    const remainingCount = remainingByColor[getTileColor(drawTileId)] ?? 0;
    if (remainingCount <= 0) continue;
    totalWeight += remainingCount;

    const nextTiles = [...hand, drawTileId];
    let bestYakuForDraw = 0;

    for (const discardTileId of nextTiles) {
      const handAfterDiscard = removeSingleTile(nextTiles, discardTileId);
      const readyAllTiles = [...handAfterDiscard, ...openMeldTiles];
      if (!canFormTenpai(readyAllTiles)) continue;
      if (findWaiterId(readyAllTiles) == null) continue;

      bestYakuForDraw = Math.max(
        bestYakuForDraw,
        getBestWinningYakuAfterDiscard(handAfterDiscard, openMeldTiles, {
          hasPonMelds,
          doraTile,
          playerName,
          trendTypes,
          winnerDiscardsEmpty,
          doubleReach,
          allowRiichi: !hasPonMelds,
        }),
      );
    }

    totalExpectedYaku += bestYakuForDraw * remainingCount;
  }

  return totalWeight > 0 ? totalExpectedYaku / totalWeight : 0;
}

export function getTotalYakuValue(
  allTiles: number[],
  hasPonMelds: boolean,
  playerNameOverride?: string,
): number {
  const state = useGameStore.getState();
  const playerName =
    playerNameOverride ?? state.players[state.turnIndex]?.name ?? "";
  const yakuResults = evaluateYaku({
    riichi: false,
    doubleReach: false,
    ippatsu: false,
    isRon: false,
    hasPonMelds,
    doraTile: state.doraTile,
    uradoraTile: null,
    allTiles,
    winnerDiscardsEmpty: false,
    playerName,
    trendTypes: state.trendTypes,
  });
  const special = evaluateSpecialYaku(allTiles);
  return [...yakuResults, ...special].reduce((s, y) => s + y.yaku, 0);
}

function shouldDeclareRiichi(
  profile: CpuProfile,
  playerIndex: number,
  tilePool: number[],
  allTiles: number[],
  hasPonMelds: boolean,
  discardTileId: number,
): boolean {
  if (Math.random() < profile.missTenpaiRate) return false;
  const state = useGameStore.getState();
  const totalYaku = getTotalYakuValue(allTiles, hasPonMelds);
  const minTotalYaku = profile.minRiichiYaku;

  if (
    !canDeclareRiichiForTiles({
      tiles: tilePool,
      discardTileId,
      openMeldTiles: state.ponMelds[playerIndex].flat(),
      hasPonMelds,
      doraTile: state.doraTile,
      playerName: state.players[playerIndex].name,
      trendTypes: state.trendTypes,
      winnerDiscardsEmpty: state.discards[playerIndex].length === 0,
      doubleReach: state.discards[playerIndex].length === 0,
      minTotalYaku,
    })
  ) {
    return false;
  }

  if (profile.randomDiscardRate > 0 && totalYaku <= minTotalYaku) {
    return Math.random() < 0.5;
  }
  return Math.random() < profile.riichiRate;
}

export function cpuDiscard(
  hand: number[],
  ponMelds: number[][],
  drawnTile: number | null,
  isRiichi: boolean,
  strength: CpuStrength = DEFAULT_CPU_STRENGTH,
  personality?: CpuPersonality | null,
): CpuDiscardResult | null {
  if (personality?.discard) {
    return personality.discard(
      hand,
      ponMelds,
      drawnTile,
      isRiichi,
      getCpuProfile(strength),
    );
  }
  const baseProfile = getCpuProfile(strength);
  const personalityResult = personality
    ? applyWeights(applyRoundProgressYakuTarget(baseProfile, strength), personality)
    : null;
  const state = useGameStore.getState();
  const profile = applyParentPushBonus(
    personalityResult?.adjusted ??
      applyRoundProgressYakuTarget(baseProfile, strength),
    state.turnIndex === state.parentIndex,
  );
  const multipliers = personalityResult?.multipliers ?? {
    attackMul: 1,
    defenseMul: 1,
  };
  const playerName = state.players[state.turnIndex]?.name ?? "";
  const tilePool = getTilesWithDrawnTile(hand, drawnTile);
  const allTiles = [...tilePool, ...ponMelds.flat()];

  if (isRiichi) {
    if (drawnTile != null) return { tileId: drawnTile };
    return { tileId: tilePool[0] };
  }

  if (tilePool.length === 0) {
    return { tileId: tilePool[0] };
  }

  if (canFormTenpai(allTiles)) {
    const waiter = findWaiterId(allTiles);
    const underRiichiThreat = hasRiichiOpponent();

    if (waiter != null && underRiichiThreat) {
      const canThreatenedRiichi = canDeclareRiichiForTiles({
        tiles: tilePool,
        discardTileId: waiter,
        openMeldTiles: ponMelds.flat(),
        hasPonMelds: ponMelds.length > 0,
        doraTile: state.doraTile,
        playerName,
        trendTypes: state.trendTypes,
        winnerDiscardsEmpty: false,
        doubleReach: false,
        minTotalYaku: profile.threatenedRiichiYaku,
      });

      if (
        canThreatenedRiichi &&
        Math.random() < profile.threatenedPushRate
      ) {
        return { tileId: waiter, declareRiichi: true };
      }

      const safeTileId = chooseSafeDiscard(tilePool, tilePool);
      if (safeTileId != null && Math.random() < profile.safeFoldRate) {
        return { tileId: safeTileId };
      }
    }

    const shouldRiichi =
      waiter != null &&
      shouldDeclareRiichi(
        profile,
        state.turnIndex,
        tilePool,
        allTiles,
        ponMelds.length > 0,
        waiter,
      );
    if (shouldRiichi && waiter != null && canDeclareRiichi(state.turnIndex, waiter)) {
      return { tileId: waiter, declareRiichi: true };
    }
    // Damaten: keep tenpai, discard the wait tile to avoid breaking the hand
    if (drawnTile != null) {
      return { tileId: drawnTile };
    }
    if (waiter != null) {
      return { tileId: waiter };
    }
  }

  if (
    hasRiichiOpponent() &&
    !canFormTenpai(allTiles) &&
    Math.random() < profile.safeFoldRate
  ) {
    const tileId = chooseSafeDiscard(tilePool, tilePool);
    if (tileId != null) return { tileId };
  }

  if (Math.random() < profile.randomDiscardRate) {
    const tileId = randomPick(tilePool);
    if (tileId != null) return { tileId };
  }

  const ctx: EvalContext = {
    playerIndex: state.turnIndex,
    tilePool,
    allTiles,
    ponMelds,
    hasPonMelds: ponMelds.length > 0,
    playerName,
    doraTile: state.doraTile,
    trendTypes: state.trendTypes,
    visibleCounts: getVisibleCounts(),
    dangerColors: getDangerColors(),
    defenseMul: multipliers.defenseMul,
    attackMul: multipliers.attackMul,
    minRiichiYaku: profile.minRiichiYaku,
    targetWinYaku: profile.targetWinYaku,
    threatenedRiichiYaku: profile.threatenedRiichiYaku,
    doraValueWeight: profile.doraValueWeight,
    selfWindValueWeight: profile.selfWindValueWeight,
  };
  const tileId = chooseByScore(tilePool, ctx);
  if (tileId != null) return { tileId };

  return { tileId: tilePool[0] };
}

export function getCpuDelay(speed: number): number {
  return CPU_DELAYS_BY_SPEED[speed] ?? CPU_DELAYS_BY_SPEED[1];
}

export function cpuHandlePon(
  strength: CpuStrength = DEFAULT_CPU_STRENGTH,
  personality?: CpuPersonality | null,
  hand?: number[],
  ponMelds?: number[][],
  tileId?: number,
  playerName?: string,
): "pon" | "cancel" {
  if (
    hand != null &&
    ponMelds != null &&
    tileId != null &&
    playerName != null
  ) {
    const matchingCount = hand.filter(
      (id) => getTileColor(id) === getTileColor(tileId),
    ).length;
    if (matchingCount === 3 || matchingCount === 6) return "cancel";

      const state = useGameStore.getState();
      const baseProfile = applyParentPushBonus(
        applyRoundProgressYakuTarget(getCpuProfile(strength), strength),
        state.turnIndex === state.parentIndex,
      );
    const personalityResult = personality
      ? applyWeights(baseProfile, personality)
      : null;
    const mul = personalityResult?.multipliers ?? {
      attackMul: 1,
      defenseMul: 1,
    };
    const base = {
      playerIndex: state.turnIndex,
      playerName,
      ponMelds,
      doraTile: state.doraTile,
      trendTypes: state.trendTypes,
      visibleCounts: getVisibleCounts(),
      dangerColors: getDangerColors(),
      defenseMul: mul.defenseMul,
      attackMul: mul.attackMul,
      minRiichiYaku: baseProfile.minRiichiYaku,
      targetWinYaku: baseProfile.targetWinYaku,
      threatenedRiichiYaku: baseProfile.threatenedRiichiYaku,
      doraValueWeight: baseProfile.doraValueWeight,
      selfWindValueWeight: baseProfile.selfWindValueWeight,
      };
      const beforeAllTiles = [...hand, ...ponMelds.flat()];
      const beforeScore = evaluateHandScore(hand, beforeAllTiles, ponMelds, base);
      const beforeExpectedYaku = estimateExpectedYakuAfterCall(
        hand,
        ponMelds,
        playerName,
        state.doraTile,
        state.trendTypes,
        base.visibleCounts,
        state.discards[state.turnIndex].length === 0,
        state.discards[state.turnIndex].length === 0,
      );

      const sim = simulatePon(hand, ponMelds, tileId);
      if (sim == null) return "cancel";

      const afterAllTiles = [...sim.newHand, ...sim.newPonMelds.flat()];
    const afterScore = evaluateHandScore(
        sim.newHand,
        afterAllTiles,
        sim.newPonMelds,
        base,
      );
      const afterExpectedYaku = estimateExpectedYakuAfterCall(
        sim.newHand,
        sim.newPonMelds,
        playerName,
        state.doraTile,
        state.trendTypes,
        base.visibleCounts,
        state.discards[state.turnIndex].length === 0,
        false,
      );

      if (
        ponMelds.length < 2 &&
        sim.newPonMelds.length === 2 &&
        afterExpectedYaku + 0.25 < baseProfile.minRiichiYaku
      ) {
        return "cancel";
      }

      if (afterExpectedYaku + 0.25 < beforeExpectedYaku) return "cancel";
      if (afterExpectedYaku > beforeExpectedYaku + 0.25) return "pon";

      return afterScore > beforeScore ? "pon" : "cancel";
    }

  const baseProfile = getCpuProfile(strength);
  const result = personality ? applyWeights(baseProfile, personality) : null;
  const profile = result?.adjusted ?? baseProfile;
  return Math.random() < profile.ponRate ? "pon" : "cancel";
}

export function getEligiblePonPlayers(
  tileId: number,
  exceptPlayer?: number,
): number[] {
  const state = useGameStore.getState();
  return getEligiblePonPlayerIndexes({
    hands: state.hands,
    riichi: state.riichi,
    tileId,
    exceptPlayer,
  });
}

export function generateRandomPersonality(): CpuPersonality {
  return {
    label: "ランダム",
    weight: Math.floor(Math.random() * 10) + 1,
  };
}
