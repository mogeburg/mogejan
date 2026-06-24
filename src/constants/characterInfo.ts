import type { AbilityId } from "@/constants/abilities";
import { ABILITY_LABELS } from "@/constants/abilities";

export interface CharacterAbilityInfo {
  charId: string;
  name: string;
  abilityId: AbilityId;
  abilityName: string;
  timing: string;
  conditions?: string[];
  effect: string;
}

export const CHARACTER_ABILITY_INFO: Record<string, CharacterAbilityInfo> = {
  aimoge: {
    charId: "aimoge",
    name: "あいもげ",
    abilityId: "aimoge",
    abilityName: ABILITY_LABELS.aimoge,
    timing: "自ターン開始時",
    conditions: [
      "自分がリーチしていない",
      "リーチしている相手の待ち色を手牌に持っている",
    ],
    effect: "手牌の中にある危険牌が分かるようになる",
  },
  miimoge: {
    charId: "miimoge",
    name: "みいもげ",
    abilityId: "miimoge",
    abilityName: ABILITY_LABELS.miimoge,
    timing: "局開始時に自動発動",
    effect: "他プレイヤーはリーチ宣言時に5役以上が必要になる",
  },
  pikasan: {
    charId: "pikasan",
    name: "ピカさん",
    abilityId: "pikasan",
    abilityName: ABILITY_LABELS.pikasan,
    timing: "リーチ時",
    effect: "能力発動局に自分がアガった場合、役「そうだね（3役）」が追加される",
  },
  siran: {
    charId: "siran",
    name: "知らん女",
    abilityId: "siran",
    abilityName: ABILITY_LABELS.siran,
    timing: "他プレイヤーからツモ・ロンされた時",
    effect: "自分が支払う点数を0にする",
  },
  imouto: {
    charId: "imouto",
    name: "妹",
    abilityId: "imouto",
    abilityName: ABILITY_LABELS.imouto,
    timing: "他プレイヤーがリーチした時",
    conditions: ["自分がリーチしていない"],
    effect:
      "他プレイヤーのリーチ時に自分の手牌と入れ替え、リーチ可能ならリーチ状態になる",
  },
  burumoge: {
    charId: "burumoge",
    name: "ぶるもげ",
    abilityId: "burumoge",
    abilityName: ABILITY_LABELS.burumoge,
    timing: "リーチ時に自動発動",
    conditions: ["自分、または他プレイヤーの捨牌に待ち牌がある"],
    effect: "リーチ後、最初のツモ時に当たり牌の捨て牌とツモを入れ替えて引く",
  },
  anoko: {
    charId: "anoko",
    name: "あの娘",
    abilityId: "anoko",
    abilityName: ABILITY_LABELS.anoko,
    timing: "ツモ・ロン時に自動発動",
    conditions: ["知らん女、またはあの娘を含む手牌"],
    effect:
      "あの娘を知らん女、知らん女をあの娘として役計算を行い、重複しない役をすべて付与する",
  },
  anemoge: {
    charId: "anemoge",
    name: "あねもげ",
    abilityId: "anemoge",
    abilityName: ABILITY_LABELS.anemoge,
    timing: "局開始時に自動発動",
    effect: "dice1d8=の出た目だけ手牌があねもげに入れ替わる",
  },
  otyanti: {
    charId: "otyanti",
    name: "おちゃんち",
    abilityId: "otyanti",
    abilityName: ABILITY_LABELS.otyanti,
    timing: "局開始時に自動発動",
    effect:
      "ぶるもげ、みいもげ、知らん女、あの娘、妹、おちゃんちをツモしやすくなる",
  },
};
