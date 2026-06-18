import {
  BASIC_TILE_KIND_COUNT,
  INITIAL_HAND_TILE_COUNT,
  PLAYER_COUNT,
} from "@/constants/game";
import { findTileDataById, isTrendTile, TREND_KINDS, TREND_KINDS_PER_ROUND, TREND_COPIES, TREND_TILE_START } from "@/constants/tiles";

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sortTiles(a: number, b: number) {
  return findTileDataById(a).colorIndex - findTileDataById(b).colorIndex;
}

export function countTileColors(tiles: number[]): number[] {
  return countColorsUpTo(tiles, BASIC_TILE_KIND_COUNT);
}

export function countAllTileColors(tiles: number[]): number[] {
  return countColorsUpTo(tiles, BASIC_TILE_KIND_COUNT + TREND_KINDS);
}

function countColorsUpTo(tiles: number[], maxColors: number): number[] {
  const colorCounts = new Array(maxColors).fill(0);
  for (const id of tiles) {
    const ci = findTileDataById(id).colorIndex;
    if (ci >= 0 && ci < maxColors) colorCounts[ci]++;
  }
  return colorCounts;
}

export function countTrendTileColors(
  tiles: number[],
  trendTypes: number[],
): number[] {
  const counts = new Array(TREND_KINDS).fill(0);
  for (const id of tiles) {
    if (!isTrendTile(id)) continue;
    const trendIdx = Math.floor((id - TREND_TILE_START) / TREND_COPIES);
    if (trendTypes.includes(trendIdx)) counts[trendIdx]++;
  }
  return counts;
}

export function pickTrendTypes(): number[] {
  const all = Array.from({ length: TREND_KINDS }, (_, i) => i);
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, TREND_KINDS_PER_ROUND);
}

export function createTrendTiles(trendTypes: number[]): number[] {
  const tiles: number[] = [];
  for (const t of trendTypes) {
    for (let c = 0; c < TREND_COPIES; c++) {
      tiles.push(TREND_TILE_START + t * TREND_COPIES + c);
    }
  }
  return tiles;
}

export function createHands(
  trendTypes?: number[],
): { hands: number[][]; wall: number[] } {
  const basicCount = BASIC_TILE_KIND_COUNT * 9;
  const allTiles = Array.from({ length: basicCount }, (_, i) => i + 1);
  if (trendTypes) {
    allTiles.push(...createTrendTiles(trendTypes));
  }
  const shuffled = shuffleArray(allTiles);
  const hands = Array.from({ length: PLAYER_COUNT }, (_, i) =>
    shuffled
      .slice(i * INITIAL_HAND_TILE_COUNT, (i + 1) * INITIAL_HAND_TILE_COUNT)
      .sort(sortTiles),
  );
  const wall = shuffled.slice(PLAYER_COUNT * INITIAL_HAND_TILE_COUNT);
  return { hands, wall };
}

export function getTilesWithDrawnTile(
  hand: number[],
  drawnTile: number | null,
): number[] {
  return drawnTile != null ? [...hand, drawnTile] : [...hand];
}
