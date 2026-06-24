import type { AbilityId } from "@/constants/abilities";
import { ABILITY_LABELS } from "@/constants/abilities";

export interface CharacterAbilityInfo {
  charId: string;
  name: string;
  abilityId: AbilityId;
  abilityName: string;
  timing: string;
  conditions: string[];
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
      "能力ゲージがMAX",
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
    conditions: ["局開始時に自動発動"],
    effect: "他プレイヤーはリーチ宣言時に5翻以上が必要になる",
  },
  pikasan: {
    charId: "pikasan",
    name: "ピカさん",
    abilityId: "pikasan",
    abilityName: ABILITY_LABELS.pikasan,
    timing: "リーチ時",
    conditions: ["能力ゲージがMAX"],
    effect: "能力発動局に自分がアガった場合、役「そうだね（3翻）」が追加される",
  },
  siran: {
    charId: "siran",
    name: "知らん女",
    abilityId: "siran",
    abilityName: ABILITY_LABELS.siran,
    timing: "他プレイヤーからツモ・ロンされた時",
    conditions: ["能力ゲージがMAX"],
    effect: "自分が支払う点数を0にする",
  },
  imouto: {
    charId: "imouto",
    name: "妹",
    abilityId: "imouto",
    abilityName: ABILITY_LABELS.imouto,
    timing: "他プレイヤーがリーチした時",
    conditions: ["能力ゲージがMAX", "自分がリーチしていない"],
    effect:
      "他プレイヤーのリーチ時にツモ・手牌・ポンを全て入れ替え、リーチ可能ならリーチ状態になる",
  },
  burumoge: {
    charId: "burumoge",
    name: "ぶるもげ",
    abilityId: "burumoge",
    abilityName: ABILITY_LABELS.burumoge,
    timing: "?",
    conditions: ["?未実装?"],
    effect: "?未実装?",
  },
  anoko: {
    charId: "anoko",
    name: "あの娘",
    abilityId: "anoko",
    abilityName: ABILITY_LABELS.anoko,
    timing: "?",
    conditions: ["?未実装?"],
    effect: "?未実装?",
  },
  anemoge: {
    charId: "anemoge",
    name: "あねもげ",
    abilityId: "anemoge",
    abilityName: ABILITY_LABELS.anemoge,
    timing: "?",
    conditions: ["?未実装?"],
    effect: "?未実装?",
  },
  otyanti: {
    charId: "otyanti",
    name: "おちゃんち",
    abilityId: "otyanti",
    abilityName: ABILITY_LABELS.otyanti,
    timing: "?",
    conditions: ["?未実装?"],
    effect: "?未実装?",
  },
};
