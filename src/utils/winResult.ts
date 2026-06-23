import type { Player } from "@/store";
import type { YakuResult } from "@/utils/evaluateYaku";
import { evaluateYaku } from "@/utils/evaluateYaku";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";

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

export function evaluateWinner(context: WinEvaluationContext): YakuResult[] {
  if (context.winner == null) return [];

  const allTiles = buildWinnerTiles(context);
  const winnerDiscardsEmpty = context.discards[context.winner].length === 0;

  const base = evaluateYaku({
    riichi: context.riichi[context.winner],
    doubleReach: context.doubleReach[context.winner],
    ippatsu: context.ippatsu[context.winner],
    isRon: context.isRon,
    hasPonMelds: context.ponMelds[context.winner].length > 0,
    doraTile: context.doraTile,
    uradoraTile: context.uradoraTile,
    allTiles,
    winnerDiscardsEmpty,
    playerName: context.players[context.winner].name,
    trendTypes: context.trendTypes,
  });

  const special = evaluateSpecialYaku(allTiles);

  if (context.pikasanBonusPending[context.winner]) {
    special.push({ name: "そうだね", yaku: 3 });
  }

  return [...base, ...special];
}
