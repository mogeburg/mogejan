import { PLAYER_COUNT } from "@/constants/game";
import type { Player } from "@/store";
import type { YakuResult } from "@/utils/evaluateYaku";

const YAKU_RANKS = [
  { min: 13, name: "役満" },
  { min: 11, name: "三倍満" },
  { min: 8, name: "倍満" },
  { min: 6, name: "跳満" },
  { min: 5, name: "満貫" },
] as const;

export function yakuRankName(totalYaku: number): string | undefined {
  return YAKU_RANKS.find((r) => totalYaku >= r.min)?.name;
}

function scoreFromYaku(yaku: number): number {
  if (yaku <= 0) return 0;
  if (yaku >= 13) return 320;
  const table: Record<number, number> = {
    1: 10,
    2: 20,
    3: 40,
    4: 60,
    5: 80,
    6: 120,
    7: 120,
    8: 160,
    9: 160,
    10: 160,
    11: 240,
    12: 240,
  };
  return table[yaku] ?? 0;
}

interface CalcParams {
  ryuukyoku: boolean;
  winner: number | null;
  yaku: YakuResult[];
  players: Player[];
  parentIndex: number;
  isRon: boolean;
  ronTarget: number | null;
  siranGuardActive?: boolean[];
}

export function calcScoreDeltas({
  ryuukyoku,
  winner,
  yaku,
  players,
  parentIndex,
  isRon,
  ronTarget,
  siranGuardActive,
}: CalcParams): number[] {
  if (ryuukyoku || winner == null) return Array(PLAYER_COUNT).fill(0);

  const totalYaku = yaku.reduce((sum, y) => sum + y.yaku, 0);
  const totalScore = scoreFromYaku(totalYaku);

  if (isRon && ronTarget != null) {
    const score =
      winner === parentIndex ? Math.floor(totalScore * 1.5) : totalScore;
    const deltas = Array(PLAYER_COUNT).fill(0);
    if (siranGuardActive?.[ronTarget]) {
      deltas[winner] = 0;
      deltas[ronTarget] = 0;
    } else {
      deltas[winner] = score;
      deltas[ronTarget] = -score;
    }
    return deltas;
  }

  if (winner === parentIndex) {
    const multiplied = Math.floor(totalScore * 1.5);
    const perPlayer = Math.floor(multiplied / 3);
    const activeShares = players.reduce((sum, _, i) =>
      i === winner ? sum : sum + (siranGuardActive?.[i] ? 0 : 1), 0);
    return players.map((_, i) => {
      if (i === winner) return perPlayer * activeShares;
      if (siranGuardActive?.[i]) return 0;
      return -perPlayer;
    });
  }

  const perPlayer = Math.floor(totalScore / 3);
  const activeShares = players.reduce((sum, _, i) => {
    if (i === winner) return sum;
    if (siranGuardActive?.[i]) return sum;
    return sum + (i === parentIndex ? 2 : 1);
  }, 0);
  return players.map((_, i) => {
    if (i === winner) return perPlayer * activeShares;
    if (siranGuardActive?.[i]) return 0;
    if (i === parentIndex) return -(perPlayer * 2);
    return -perPlayer;
  });
}
