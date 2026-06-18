import { tileImageUrl } from "@/utils/assets";

// Local copies to avoid circular deps with game.ts
export const BASIC_TILE_KIND_COUNT = 9;
export const TILE_COPIES_PER_KIND = 9;
const TREND_COLOR_OFFSET = BASIC_TILE_KIND_COUNT;

// Trend tile constants
export const TREND_KINDS = 12;
export const TREND_KINDS_PER_ROUND = 4;
export const TREND_COPIES = 4;
export const TREND_TILE_START =
  BASIC_TILE_KIND_COUNT * TILE_COPIES_PER_KIND + 1;

export function getBasicTileId(colorIndex: number): number {
  return colorIndex * TILE_COPIES_PER_KIND + 1;
}

export function getTrendTileId(trendIndex: number): number {
  return TREND_TILE_START + trendIndex * TREND_COPIES;
}

export function isSameColorLikeTile(
  tileId: number,
  referenceTileId: number,
): boolean {
  return getTileColor(tileId) === getTileColor(referenceTileId);
}

export function isDoraLikeTile(tileId: number, doraTileId: number): boolean {
  return getTileColor(tileId) === getTileColor(doraTileId);
}

export const TileData = [
  { name: "あいもげ", colorHex: "#c68be3", id: "aimoge" },
  { name: "ぶるもげ", colorHex: "#4dd0e1", id: "burumoge" },
  { name: "みいもげ", colorHex: "#66bb6a", id: "miimoge" },
  { name: "ピカさん", colorHex: "#fff59d", id: "pikasan" },
  { name: "知らん女", colorHex: "#a1887f", id: "siran" },
  { name: "あの娘", colorHex: "#f6c6d6", id: "anoko" },
  { name: "妹", colorHex: "#ffb74d", id: "imouto" },
  { name: "あねもげ", colorHex: "#e86361", id: "anemoge" },
  { name: "おちゃんち", colorHex: "#f0e0d6", id: "otyanti" },
];

export const TrendTileData = Array.from({ length: TREND_KINDS }, (_, i) => ({
  name: [
    "褐色あいもげ",
    "かにもげ",
    "どくもげ",
    "おそろしいもげ",
    "ハッサン",
    "メカみいもげ",
    "あいもん",
    "どくいも",
    "エビナイフ",
    "シャコ",
    "鯖",
    "だちょもげ",
  ][i],
  colorHex: "#bdbdbd",
  id: [
    "brown-aimoge",
    "kanimoge",
    "dokumoge",
    "osorosiimoge",
    "hassan",
    "mekamiimoge",
    "aimon",
    "dokuimo",
    "ebinaihu",
    "syako",
    "saba",
    "datyomoge",
  ][i],
}));

export function getImageUrl(id: string) {
  return tileImageUrl(id);
}

export function getTileColor(tileId: number): number {
  if (tileId <= BASIC_TILE_KIND_COUNT * TILE_COPIES_PER_KIND) {
    return Math.floor((tileId - 1) / TILE_COPIES_PER_KIND);
  }
  const trendIndex = Math.floor((tileId - TREND_TILE_START) / TREND_COPIES);
  return TREND_COLOR_OFFSET + trendIndex;
}

export function getTrendIndex(tileId: number): number {
  return Math.floor((tileId - TREND_TILE_START) / TREND_COPIES);
}

export function isTrendTile(tileId: number): boolean {
  return tileId > BASIC_TILE_KIND_COUNT * TILE_COPIES_PER_KIND;
}

export function getTileCharacterId(tileId: number): string {
  if (tileId <= BASIC_TILE_KIND_COUNT * TILE_COPIES_PER_KIND) {
    return TileData[Math.floor((tileId - 1) / TILE_COPIES_PER_KIND)].id;
  }
  return TrendTileData[getTrendIndex(tileId)].id;
}

export function findTileDataById(tileId: number) {
  if (tileId <= BASIC_TILE_KIND_COUNT * TILE_COPIES_PER_KIND) {
    const colorIndex = Math.floor((tileId - 1) / TILE_COPIES_PER_KIND);
    const data = TileData[colorIndex];
    return { tileId, colorIndex, imageUrl: getImageUrl(data.id), ...data };
  }
  const trendIndex = getTrendIndex(tileId);
  const colorIndex = TREND_COLOR_OFFSET + trendIndex;
  const data = TrendTileData[trendIndex];
  return { tileId, colorIndex, imageUrl: getImageUrl(data.id), ...data };
}
