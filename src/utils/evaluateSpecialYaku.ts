import { SPECIAL_YAKU } from "@/constants/specialYaku";
import type { YakuResult } from "@/utils/evaluateYaku";

export function evaluateSpecialYaku(allTiles: number[]): YakuResult[] {
  const results: YakuResult[] = [];

  for (const def of Object.values(SPECIAL_YAKU)) {
    const count = def.check(allTiles);
    for (let i = 0; i < count; i++) {
      results.push({ name: def.name, yaku: def.yakuValue });
    }
  }

  return results;
}
