export const YAKU = {
  // ボーナス役
  RIICHI: { name: "リーチ", yaku: 1, desc: "テンパイ時にリーチ" },
  W_RIICHI: {
    name: "Wリーチ",
    yaku: 2,
    desc: "捨て牌が無い状態でリーチ。リーチとは重複しない",
  },
  MENZEN: { name: "メンゼン", yaku: 1, desc: "ポンをせずにリーチ" },
  IPPATSU: {
    name: "イッパツ",
    yaku: 1,
    desc: "リーチ後、他のプレイヤーにポンをされずに次のツモ牌を捨てるまでに上がる",
  },
  TSUMO: { name: "ツモ", yaku: 1, desc: "リーチ後、自分のツモ牌で上がる" },
  DORA: {
    name: "ドラ",
    yaku: 1,
    desc: "ドラ表示牌と同じ牌を3枚以上持っている",
  },
  URADORA: {
    name: "裏ドラ",
    yaku: 1,
    desc: "メンゼン時、裏ドラ表示牌と同じ牌を3枚以上持っている",
  },
  JIFUU: {
    name: "自風",
    yaku: 1,
    desc: "自分のキャラと同じ牌を3枚以上持っている",
  },
  TAFUU: {
    name: "他風",
    yaku: 1,
    desc: "流行表示牌と同じ牌を3枚以上持っている",
  },
  // 基本役
  TENCHIJIN: { name: "天地人", yaku: 13, desc: "捨て牌が無い状態でツモ・ロン" },
  RYUKOU_NO_YOKAN: {
    name: "流行の予感",
    yaku: 13,
    desc: "手牌が流行牌のみでツモ・ロン",
  },

  ALL_STAR: {
    name: "全員集合",
    yaku: 3,
    desc: "手牌に基本牌全9種類の牌が1枚ずつある",
  },
  KATALOG_REIPU: {
    name: "カタログレイプ",
    yaku: 8,
    desc: "メンゼンで、手牌が流行牌を含まない基本牌1種のみ",
  },
  KATALOG_REIPU_KUI: {
    name: "カタログレイプ（喰い）",
    yaku: 6,
    desc: "メンゼン以外で、手牌が流行牌を含まない基本牌1種のみ",
  },
  KATALOG_REIPU_BINJO: {
    name: "カタログレイプ（便乗）",
    yaku: 4,
    desc: "手牌が流行牌を含む基本牌1種のみ",
  },
  NIKODESUMAN: {
    name: "ニコデスマン",
    yaku: 3,
    desc: "メンゼンで、手牌が流行牌を含まない基本牌2種のみ",
  },
  NIKODESUMAN_KUI: {
    name: "ニコデスマン（喰い）",
    yaku: 2,
    desc: "メンゼン以外で、手牌が流行牌を含まない基本牌2種のみ",
  },
  NIKODESUMAN_BINJO: {
    name: "ニコデスマン（便乗）",
    yaku: 2,
    desc: "手牌が流行牌を含む基本牌2種のみ",
  },
};

export const BONUS_YAKU_LIST = [
  YAKU.RIICHI,
  YAKU.W_RIICHI,
  YAKU.MENZEN,
  YAKU.IPPATSU,
  YAKU.TSUMO,
  YAKU.DORA,
  YAKU.URADORA,
  YAKU.JIFUU,
  YAKU.TAFUU,
];

export const BASIC_YAKU_LIST = [
  YAKU.TENCHIJIN,
  YAKU.RYUKOU_NO_YOKAN,
  YAKU.ALL_STAR,
  YAKU.KATALOG_REIPU,
  YAKU.KATALOG_REIPU_KUI,
  YAKU.KATALOG_REIPU_BINJO,
  YAKU.NIKODESUMAN,
  YAKU.NIKODESUMAN_KUI,
  YAKU.NIKODESUMAN_BINJO,
];
