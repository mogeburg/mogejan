import {
  getBasicTileId,
  getTileCharacterId,
  getTrendTileId,
} from "@/constants/tiles";

export interface SpecialYakuDef {
  id: string;
  name: string;
  tiles: number[];
  characterIds: string[];
  yakuValue: number;
  check: (allTiles: number[]) => number;
}

function checkCharacterCounts(allTiles: number[], required: string[]): number {
  const counts = new Map<string, number>();
  for (const id of allTiles) {
    const c = getTileCharacterId(id);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return required.every((c) => (counts.get(c) ?? 0) >= 3) ? 1 : 0;
}

export const SPECIAL_YAKU: Record<string, SpecialYakuDef> = {
  ninki: {
    id: "ninki",
    name: "人気者",
    tiles: [getBasicTileId(0), getBasicTileId(1), getBasicTileId(4)],
    characterIds: ["aimoge", "burumoge", "siran"],
    yakuValue: 5,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["aimoge", "burumoge", "siran"]),
  },
  serverAdmin: {
    id: "serverAdmin",
    name: "サーバー管理者",
    tiles: [getBasicTileId(0), getBasicTileId(3)],
    characterIds: ["aimoge", "pikasan"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["aimoge", "pikasan"]),
  },
  aimogeRadio: {
    id: "aimogeRadio",
    name: "あいもげラジオ",
    tiles: [getBasicTileId(0), getBasicTileId(8)],
    characterIds: ["aimoge", "otyanti"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["aimoge", "otyanti"]),
  },
  bariBori: {
    id: "bariBori",
    name: "バリバリボリボリ",
    tiles: [getBasicTileId(0), getTrendTileId(1)],
    characterIds: ["aimoge", "kanimoge"],
    yakuValue: 2,
    check: (allTiles) => checkCharacterCounts(allTiles, ["aimoge", "kanimoge"]),
  },
  aimogeFace: {
    id: "aimogeFace",
    name: "あいもげの顔",
    tiles: [getBasicTileId(1), getTrendTileId(0)],
    characterIds: ["burumoge", "brown-aimoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["burumoge", "brown-aimoge"]),
  },
  anotherMe: {
    id: "anotherMe",
    name: "もう一人の私",
    tiles: [getBasicTileId(1), getTrendTileId(2)],
    characterIds: ["burumoge", "dokumoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["burumoge", "dokumoge"]),
  },
  scary: {
    id: "scary",
    name: "恐ろしいですねぇ…",
    tiles: [getBasicTileId(1), getTrendTileId(3)],
    characterIds: ["burumoge", "osorosiimoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["burumoge", "osorosiimoge"]),
  },
  fatefulEncounter: {
    id: "fatefulEncounter",
    name: "運命の出会い",
    tiles: [getBasicTileId(4), getBasicTileId(5)],
    characterIds: ["siran", "anoko"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["siran", "anoko"]),
  },
  kanayamaGathering: {
    id: "kanayamaGathering",
    name: "金山の集い",
    tiles: [getBasicTileId(4), getTrendTileId(4)],
    characterIds: ["siran", "hassan"],
    yakuValue: 2,
    check: (allTiles) => checkCharacterCounts(allTiles, ["siran", "hassan"]),
  },
  serverKick: {
    id: "serverKick",
    name: "サーバーキック",
    tiles: [getBasicTileId(4), getTrendTileId(10)],
    characterIds: ["siran", "saba"],
    yakuValue: 2,
    check: (allTiles) => checkCharacterCounts(allTiles, ["siran", "saba"]),
  },
  siranPet: {
    id: "siranPet",
    name: "知らんペット",
    tiles: [getBasicTileId(4), getTrendTileId(7)],
    characterIds: ["siran", "dokuimo"],
    yakuValue: 2,
    check: (allTiles) => checkCharacterCounts(allTiles, ["siran", "dokuimo"]),
  },
  notSisters: {
    id: "notSisters",
    name: "姉妹（姉妹ではない）",
    tiles: [getBasicTileId(0), getBasicTileId(7)],
    characterIds: ["aimoge", "anemoge"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["aimoge", "anemoge"]),
  },
  nomanomaYei: {
    id: "nomanomaYei",
    name: "のまのまイェイ",
    tiles: [getBasicTileId(3), getBasicTileId(7)],
    characterIds: ["pikasan", "anemoge"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["pikasan", "anemoge"]),
  },
  miimogeTerritory: {
    id: "miimogeTerritory",
    name: "ココをみいもげ領とする！",
    tiles: [getBasicTileId(2), getBasicTileId(1)],
    characterIds: ["miimoge", "burumoge"],
    yakuValue: 1,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["miimoge", "burumoge"]),
  },
  temporaryRetreat: {
    id: "temporaryRetreat",
    name: "生存戦略",
    tiles: [getBasicTileId(2), getTrendTileId(1)],
    characterIds: ["miimoge", "kanimoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["miimoge", "kanimoge"]),
  },
  invadersAndDestroyers: {
    id: "invadersAndDestroyers",
    name: "侵略し、破壊する者",
    tiles: [getBasicTileId(2), getTrendTileId(5)],
    characterIds: ["miimoge", "mekamiimoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["miimoge", "mekamiimoge"]),
  },
  oneeSanAlliance: {
    id: "oneeSanAlliance",
    name: "お姉さん同盟",
    tiles: [getBasicTileId(5), getBasicTileId(7)],
    characterIds: ["anoko", "anemoge"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["anoko", "anemoge"]),
  },
  anoSisters: {
    id: "anoSisters",
    name: "あの姉妹",
    tiles: [getBasicTileId(5), getBasicTileId(6)],
    characterIds: ["anoko", "imouto"],
    yakuValue: 1,
    check: (allTiles) => checkCharacterCounts(allTiles, ["anoko", "imouto"]),
  },
  firstStepToEvil: {
    id: "firstStepToEvil",
    name: "悪への第一歩",
    tiles: [getBasicTileId(6), getTrendTileId(5)],
    characterIds: ["imouto", "mekamiimoge"],
    yakuValue: 2,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["imouto", "mekamiimoge"]),
  },
  raceMatch: {
    id: "raceMatch",
    name: "かけっこ勝負",
    tiles: [getTrendTileId(11), getTrendTileId(7)],
    characterIds: ["datyomoge", "dokuimo"],
    yakuValue: 3,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["datyomoge", "dokuimo"]),
  },
  mascotBattle: {
    id: "mascotBattle",
    name: "マスコット決定戦",
    tiles: [getBasicTileId(8), getTrendTileId(6)],
    characterIds: ["otyanti", "aimon"],
    yakuValue: 2,
    check: (allTiles) => checkCharacterCounts(allTiles, ["otyanti", "aimon"]),
  },
  fightEbinaifu: {
    id: "fightEbinaifu",
    name: "戦え！エビナイフ",
    tiles: [getTrendTileId(8), getTrendTileId(1)],
    characterIds: ["ebinaihu", "kanimoge"],
    yakuValue: 3,
    check: (allTiles) =>
      checkCharacterCounts(allTiles, ["ebinaihu", "kanimoge"]),
  },
  fightSyako: {
    id: "fightSyako",
    name: "戦え！シャコちゃん",
    tiles: [getTrendTileId(9), getTrendTileId(1)],
    characterIds: ["syako", "kanimoge"],
    yakuValue: 3,
    check: (allTiles) => checkCharacterCounts(allTiles, ["syako", "kanimoge"]),
  },
};
