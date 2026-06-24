import { getBasicTileId, getTrendTileId } from "@/constants/tiles";
import { canFormWinningHand } from "@/utils/check";
import { evaluateYaku } from "@/utils/evaluateYaku";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";

export function getCutinRarity(totalYaku: number) {
  return totalYaku >= 13 ? "epic" : totalYaku >= 6 ? "rare" : "normal";
}

export function getCutinImageVariant(totalYaku: number) {
  return totalYaku >= 8 ? "baiman" : "normal";
}

export function shouldUseEchoVoice(totalYaku: number) {
  return getCutinRarity(totalYaku) !== "normal";
}

function getHandAfterDiscard(tiles: number[], discardTileId: number): number[] {
  const nextTiles = [...tiles];
  const discardIndex = nextTiles.indexOf(discardTileId);
  if (discardIndex >= 0) {
    nextTiles.splice(discardIndex, 1);
  }
  return nextTiles;
}

export function getRiichiWinningCandidates(trendTypes: number[]): number[] {
  return [
    ...Array.from({ length: 9 }, (_, index) => getBasicTileId(index)),
    ...trendTypes.map((trendType) => getTrendTileId(trendType)),
  ];
}

export interface ProjectedYakuParams {
  riichi: boolean;
  doubleReach: boolean;
  ippatsu: boolean;
  isRon: boolean;
  hasPonMelds: boolean;
  doraTile: number | null;
  uradoraTile: number | null;
  allTiles: number[];
  winnerDiscardsEmpty: boolean;
  playerName: string;
  trendTypes: number[];
}

export function getProjectedTotalYaku(params: ProjectedYakuParams): number {
  return evaluateYaku(params)
    .concat(evaluateSpecialYaku(params.allTiles))
    .reduce((sum, result) => sum + result.yaku, 0);
}

export interface CanDeclareRiichiForTilesParams {
  tiles: number[];
  discardTileId: number;
  openMeldTiles: number[];
  hasPonMelds: boolean;
  doraTile: number | null;
  playerName: string;
  trendTypes: number[];
  winnerDiscardsEmpty: boolean;
  doubleReach: boolean;
  minTotalYaku?: number;
}

export function canDeclareRiichiForTiles({
  tiles,
  discardTileId,
  openMeldTiles,
  hasPonMelds,
  doraTile,
  playerName,
  trendTypes,
  winnerDiscardsEmpty,
  doubleReach,
  minTotalYaku = 2,
}: CanDeclareRiichiForTilesParams): boolean {
  const handAfterDiscard = getHandAfterDiscard(tiles, discardTileId);
  const winningCandidates = getRiichiWinningCandidates(trendTypes);

  return winningCandidates.some((winningTileId) => {
    const allTiles = [...handAfterDiscard, winningTileId, ...openMeldTiles];
    if (!canFormWinningHand(allTiles)) return false;

    const totalYaku = getProjectedTotalYaku({
      riichi: true,
      doubleReach,
      ippatsu: false,
      isRon: true,
      hasPonMelds,
      doraTile,
      uradoraTile: null,
      allTiles,
      winnerDiscardsEmpty,
      playerName,
      trendTypes,
    });

    return totalYaku >= minTotalYaku;
  });
}
