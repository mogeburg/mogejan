import type { Player } from "@/store";
import type { YakuResult } from "@/utils/evaluateYaku";
import { evaluateYaku } from "@/utils/evaluateYaku";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";
import { getTileCharacterId } from "@/constants/tiles";

export interface WinEvaluationContext {
  players: Player[];
  winner: number | null;
  riichi: boolean[];
  doubleReach: boolean[];
  ippatsu: boolean[];
  isRon: boolean;
  ronTarget: number | null;
  discards: number[][];
  drawnTile: number | null;
  doraTile: number | null;
  uradoraTile: number | null;
  trendTypes: number[];
  hands: number[][];
  ponMelds: number[][][];
  pikasanBonusPending: boolean[];
  siranGuardActive: boolean[];
  anokoSubstitutionPending: boolean[];
}

export function buildWinnerTiles(context: WinEvaluationContext): number[] {
  if (context.winner == null) return [];

  const tiles = [
    ...context.hands[context.winner],
    ...context.ponMelds[context.winner].flat(),
  ];

  if (context.isRon && context.ronTarget != null) {
    const winningTile = context.discards[context.ronTarget].at(-1);
    if (winningTile != null) tiles.push(winningTile);
  } else if (context.drawnTile != null) {
    tiles.push(context.drawnTile);
  }

  return tiles;
}

export function canShowUradora(context: WinEvaluationContext): boolean {
  if (context.winner == null) return false;
  return context.uradoraTile != null && context.riichi[context.winner] && context.ponMelds[context.winner].length === 0;
}

function mergeYakuResults(scenarios: YakuResult[][]): YakuResult[] {
  const seen = new Map<string, number>();
  for (const results of scenarios) {
    for (const r of results) {
      if (!seen.has(r.name)) {
        seen.set(r.name, r.yaku);
      }
    }
  }
  return Array.from(seen.entries()).map(([name, yaku]) => ({ name, yaku }));
}

function evaluateSingle(allTiles: number[], context: WinEvaluationContext): YakuResult[] {
  const winnerDiscardsEmpty = context.discards[context.winner!].length === 0;
  const base = evaluateYaku({
    riichi: context.riichi[context.winner!],
    doubleReach: context.doubleReach[context.winner!],
    ippatsu: context.ippatsu[context.winner!],
    isRon: context.isRon,
    hasPonMelds: context.ponMelds[context.winner!].length > 0,
    doraTile: context.doraTile,
    uradoraTile: context.uradoraTile,
    allTiles,
    winnerDiscardsEmpty,
    playerName: context.players[context.winner!].name,
    trendTypes: context.trendTypes,
  });
  const special = evaluateSpecialYaku(allTiles);
  if (context.pikasanBonusPending[context.winner!]) {
    special.push({ name: "そうだね", yaku: 3 });
  }
  return [...base, ...special];
}

function mapSiranToAnoko(tiles: number[]): number[] {
  return tiles.map((t) =>
    getTileCharacterId(t) === "siran" ? t + 9 : t,
  );
}

function mapAnokoToSiran(tiles: number[]): number[] {
  return tiles.map((t) =>
    getTileCharacterId(t) === "anoko" ? t - 9 : t,
  );
}

export function evaluateWinner(context: WinEvaluationContext): YakuResult[] {
  if (context.winner == null) return [];

  const allTiles = buildWinnerTiles(context);
  const scenarios: YakuResult[][] = [];
  scenarios.push(evaluateSingle(allTiles, context));

  if (context.anokoSubstitutionPending[context.winner]) {
    scenarios.push(evaluateSingle(mapSiranToAnoko(allTiles), context));
    scenarios.push(evaluateSingle(mapAnokoToSiran(allTiles), context));
  }

  return mergeYakuResults(scenarios);
}
