export const ABILITY_MAX_GAUGE = 100;

export type AbilityId =
  | "aimoge"
  | "burumoge"
  | "miimoge"
  | "pikasan"
  | "siran"
  | "anoko"
  | "imouto"
  | "anemoge"
  | "otyanti"
  | "koitofukumaru";

export type AbilityChargeEvent = "pon" | "riichi" | "tsumo" | "ron" | "damaged";

export interface AbilityAssignment {
  abilityId: AbilityId | null;
  factor: number;
}

export const ABILITY_CHARGE_BASE: Record<AbilityChargeEvent, number> = {
  pon: 3,
  riichi: 12,
  tsumo: 42,
  ron: 30,
  damaged: 28,
};

export const ABILITY_LABELS: Record<AbilityId, string> = {
  aimoge: "AI is Watching You",
  burumoge: "もうあった！ｗｗ",
  miimoge: "み！",
  pikasan: "そうだね",
  siran: "知らん",
  anoko: "一緒にうまれたのに",
  imouto: "ちっちゃい悪いこと",
  anemoge: "dice1d8",
  otyanti: "召喚札",
  koitofukumaru: "あくらつなライフハック",
};

export function resolveAbilityIdFromCharId(charId: string): AbilityId | null {
  switch (charId) {
    case "aimoge":
    case "burumoge":
    case "miimoge":
    case "pikasan":
    case "siran":
    case "anoko":
    case "imouto":
    case "anemoge":
    case "otyanti":
      return charId;
    default:
      return null;
  }
}

export function createDefaultAbilityAssignment(
  charId: string,
): AbilityAssignment {
  return {
    abilityId: resolveAbilityIdFromCharId(charId),
    factor: 1,
  };
}

export function getAbilityChargeAmount(
  event: AbilityChargeEvent,
  factor: number,
  scoreAmount = 0,
): number {
  const scoreBonus =
    event === "tsumo" || event === "ron" || event === "damaged"
      ? Math.floor(Math.max(0, scoreAmount) / 20)
      : 0;
  return Math.floor((ABILITY_CHARGE_BASE[event] + scoreBonus) * factor);
}
