import {
  PLAYER_COUNT,
  READY_HAND_TILE_COUNT,
  TILE_KIND_COUNT,
} from "@/constants/game";
import { isSameColorLikeTile } from "@/constants/tiles";
import { countAllTileColors, countTileColors } from "@/utils/tiles";

function analyzeHand(tiles: number[]): {
  groups: number;
  hasPair: boolean;
} {
  const colorCounts = countAllTileColors(tiles);
  const remainders = colorCounts.map((c) => c % 3);
  const groups = colorCounts.reduce((sum, c) => sum + Math.floor(c / 3), 0);
  const hasPair = remainders.some((c) => c === 2);

  return { groups, hasPair };
}

export function canFormAllStarHand(tiles: number[]): boolean {
  if (tiles.length < TILE_KIND_COUNT) return false;
  return countTileColors(tiles).every((count) => count > 0);
}

export function canFormWinningHand(tiles: number[]): boolean {
  if (canFormAllStarHand(tiles)) return true;
  if (tiles.length % 3 !== 0) return false;
  const { groups } = analyzeHand(tiles);
  return groups >= tiles.length / 3;
}

function canFormTwoMeldsAndPair(tiles: number[]): boolean {
  const { groups, hasPair } = analyzeHand(tiles);
  return groups >= 2 && hasPair;
}

function findStandardDiscard(allTiles: number[]): number | null {
  for (let i = 0; i < allTiles.length; i++) {
    const remaining = allTiles.filter((_, j) => j !== i);
    if (canFormTwoMeldsAndPair(remaining)) return allTiles[i];
  }
  return null;
}

export function canFormAllStarTenpai(tiles: number[]): boolean {
  if (tiles.length !== READY_HAND_TILE_COUNT) return false;
  for (let i = 0; i < tiles.length; i++) {
    const remaining = tiles.filter((_, j) => j !== i);
    const distinctColors = countTileColors(remaining).filter((count) => count > 0).length;
    if (distinctColors === TILE_KIND_COUNT - 1) return true;
  }
  return false;
}

export function findAllStarWaiterId(tiles: number[]): number | null {
  if (tiles.length !== READY_HAND_TILE_COUNT) return null;
  for (let i = 0; i < tiles.length; i++) {
    const remaining = tiles.filter((_, j) => j !== i);
    const distinctColors = countTileColors(remaining).filter((count) => count > 0).length;
    if (distinctColors === TILE_KIND_COUNT - 1) return tiles[i];
  }
  return null;
}

export function canFormTenpai(allTiles: number[]): boolean {
  if (allTiles.length !== READY_HAND_TILE_COUNT) return false;
  return findStandardDiscard(allTiles) != null || canFormAllStarTenpai(allTiles);
}

export function findWaiterId(allTiles: number[]): number | null {
  if (allTiles.length !== READY_HAND_TILE_COUNT) return null;
  return findStandardDiscard(allTiles) ?? findAllStarWaiterId(allTiles);
}

export function getEligiblePonPlayerIndexes({
  hands,
  riichi,
  tileId,
  exceptPlayer,
}: {
  hands: number[][];
  riichi: boolean[];
  tileId: number;
  exceptPlayer?: number;
}): number[] {
  const result: number[] = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    if (i === exceptPlayer || riichi[i]) continue;
    const hand = hands[i] ?? [];
    if (hand.length < 5) continue;
    const count = hand.filter(
      (t) => isSameColorLikeTile(t, tileId),
    ).length;
    if (count >= 2) result.push(i);
  }
  return result;
}
