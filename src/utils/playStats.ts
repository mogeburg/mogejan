import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorageKey } from "@/utils/storage";

export interface PlayStatsState {
  totalRounds: number;
  wins: number;
  tsumoWins: number;
  ronWins: number;
  ryuukyoku: number;
  totalTsumoCount: number;
  totalYaku: number;
  totalScore: number;
  yakuValueCounts: Record<number, number>;
  recordWin: (params: {
    isRon: boolean;
    totalYaku: number;
    totalScore: number;
    tsumoCount: number;
  }) => void;
  recordRyuukyoku: () => void;
  resetPlayStats: () => void;
}

const initialState = {
  totalRounds: 0,
  wins: 0,
  tsumoWins: 0,
  ronWins: 0,
  ryuukyoku: 0,
  totalTsumoCount: 0,
  totalYaku: 0,
  totalScore: 0,
  yakuValueCounts: {},
};

export const usePlayStatsStore = create<PlayStatsState>()(
  persist(
    (set) => ({
      ...initialState,
      recordWin: ({ isRon, totalYaku, totalScore, tsumoCount }) =>
        set((state) => {
          const yakuValueCounts = { ...state.yakuValueCounts };
          yakuValueCounts[totalYaku] = (yakuValueCounts[totalYaku] ?? 0) + 1;

          return {
            totalRounds: state.totalRounds + 1,
            wins: state.wins + 1,
            tsumoWins: state.tsumoWins + (isRon ? 0 : 1),
            ronWins: state.ronWins + (isRon ? 1 : 0),
            totalTsumoCount: state.totalTsumoCount + tsumoCount,
            totalYaku: state.totalYaku + totalYaku,
            totalScore: state.totalScore + totalScore,
            yakuValueCounts,
          };
        }),
      recordRyuukyoku: () =>
        set((state) => ({
          totalRounds: state.totalRounds + 1,
          ryuukyoku: state.ryuukyoku + 1,
        })),
      resetPlayStats: () => set(initialState),
    }),
    {
      name: createStorageKey("play-stats"),
    },
  ),
);
