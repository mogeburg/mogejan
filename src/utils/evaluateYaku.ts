import { TILE_KIND_COUNT } from "@/constants/game";
import {
  findTileDataById,
  isDoraLikeTile,
  isTrendTile,
} from "@/constants/tiles";
import { YAKU } from "@/constants/yaku";
import { countTileColors, countTrendTileColors } from "@/utils/tiles";

export interface YakuResult {
  name: string;
  yaku: number;
}

interface EvaluateParams {
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

function hasDoraColor(tiles: number[], doraTile: number): boolean {
  const sameColorCount = tiles.filter(
    (id) => isDoraLikeTile(id, doraTile),
  ).length;
  return sameColorCount >= 3;
}

// 基本役チェック（優先度順、最初にマッチしたものだけ採用）
const basicYakuChecks: {
  yaku: YakuResult;
  check: (p: EvaluateParams) => boolean;
}[] = [
  { yaku: YAKU.TENCHIJIN, check: (p) => p.winnerDiscardsEmpty },
  {
    yaku: YAKU.RYUKOU_NO_YOKAN,
    check: (p) => p.allTiles.length > 0 && p.allTiles.every((id) => isTrendTile(id)),
  },
  {
    yaku: YAKU.ALL_STAR,
    check: (p) => {
      const basicColors = countTileColors(p.allTiles);
      return p.allTiles.length >= TILE_KIND_COUNT && basicColors.every((c) => c > 0);
    },
  },
  {
    yaku: YAKU.KATALOG_REIPU,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return !p.hasPonMelds && !hasTrend && basicColorCount === 1;
    },
  },
  {
    yaku: YAKU.KATALOG_REIPU_KUI,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return p.hasPonMelds && !hasTrend && basicColorCount === 1;
    },
  },
  {
    yaku: YAKU.KATALOG_REIPU_BINJO,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return hasTrend && basicColorCount === 1;
    },
  },
  {
    yaku: YAKU.NIKODESUMAN,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return !p.hasPonMelds && !hasTrend && basicColorCount === 2;
    },
  },
  {
    yaku: YAKU.NIKODESUMAN_KUI,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return p.hasPonMelds && !hasTrend && basicColorCount === 2;
    },
  },
  {
    yaku: YAKU.NIKODESUMAN_BINJO,
    check: (p) => {
      const hasTrend = p.allTiles.some((id) => isTrendTile(id));
      const basicColorCount = countTileColors(p.allTiles).filter((c) => c > 0).length;
      return hasTrend && basicColorCount === 2;
    },
  },
];

export function evaluateYaku(params: EvaluateParams): YakuResult[] {
  const result: YakuResult[] = [];
  // ボーナス役
  if (params.doubleReach) {
    result.push(YAKU.W_RIICHI);
  } else if (params.riichi) {
    result.push(YAKU.RIICHI);
  }
  if (params.riichi && !params.hasPonMelds) result.push(YAKU.MENZEN);
  if (params.ippatsu) result.push(YAKU.IPPATSU);
  if (!params.isRon) result.push(YAKU.TSUMO);
  if (
    params.doraTile != null &&
    hasDoraColor(params.allTiles, params.doraTile)
  ) {
    result.push(YAKU.DORA);
  }
  if (
    !params.hasPonMelds &&
    params.uradoraTile != null &&
    hasDoraColor(params.allTiles, params.uradoraTile)
  ) {
    result.push(YAKU.URADORA);
  }

  const matchingNameCount = params.allTiles.filter(
    (id) => findTileDataById(id).name === params.playerName,
  ).length;
  if (matchingNameCount >= 3) {
    result.push(YAKU.JIFUU);
  }

  if (params.trendTypes.length > 0) {
    const trendCounts = countTrendTileColors(params.allTiles, params.trendTypes);
    if (trendCounts.some((c) => c >= 3)) {
      result.push(YAKU.TAFUU);
    }
  }

  // 基本役（優先度順に最初にマッチしたものを採用）
  for (const entry of basicYakuChecks) {
    if (entry.check(params)) {
      result.push(entry.yaku);
      break;
    }
  }
  return result;
}
