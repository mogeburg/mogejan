const WIND_LABELS = ["東", "南"];

export function formatRoundLabel(
  round: number,
  kyoku: number,
  specialAbilitiesEnabled: boolean,
) {
  const wind = WIND_LABELS[round] ?? WIND_LABELS[0];
  const prefix = specialAbilitiesEnabled ? "超" : "";
  return `${prefix}${wind}${kyoku + 1}局`;
}
