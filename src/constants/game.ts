import { getImageUrl, TileData } from "@/constants/tiles";
import { bgmAudioUrl } from "@/utils/assets";

export const VERSION = "0.03";
export const MASTER_VOLUME = 80;
export const BGM_VOLUME = 75;
export const SE_VOLUME = 50;
export const VOICE_VOLUME = 75;

const hostname = typeof window !== "undefined" ? window.location.hostname : "";
export const IS_DEBUG =
  hostname === "localhost" || hostname.startsWith("192.168.0.");

export const PLAYER_COUNT = 4;
export const BASIC_TILE_KIND_COUNT = 9;
export const TILE_KIND_COUNT = BASIC_TILE_KIND_COUNT;
export const TILE_COPIES_PER_KIND = 9;
export const TOTAL_TILE_COUNT = TILE_KIND_COUNT * TILE_COPIES_PER_KIND;
export const INITIAL_HAND_TILE_COUNT = 8;
export const READY_HAND_TILE_COUNT = INITIAL_HAND_TILE_COUNT + 1;
export const INITIAL_SCORE = 500;
export const DEFAULT_SPEED = 3;
export const DEFAULT_CPU_STRENGTH = "normal";
export const TEXT_SIZES = ["normal", "large", "max"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const DEFAULT_TEXT_SIZE: TextSize = "normal";
export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: "標準",
  large: "大",
  max: "最大",
};

export const CPU_STRENGTHS = ["easy", "normal", "hard"] as const;
export type CpuStrength = (typeof CPU_STRENGTHS)[number];

export const CPU_STRENGTH_LABELS: Record<CpuStrength, string> = {
  easy: "弱い",
  normal: "普通",
  hard: "強い",
};

export const CPU_DELAYS_BY_SPEED = [0, 600, 400, 200, 100, 1] as const;

export const BGM = {
  none: { label: "なし", path: "" },
  game: { label: "何切る？", path: bgmAudioUrl("game.opus") },
  op: { label: "オープニング", path: bgmAudioUrl("op.opus") },
  win: { label: "勝利", path: bgmAudioUrl("win.opus") },
  riichi: { label: "REACH TONIGHT", path: bgmAudioUrl("riichi.opus") },
  gandhara: { label: "アイモーゲ", path: bgmAudioUrl("gandhara.opus") },
  aimoge: { label: "あいもげのテーマ", path: bgmAudioUrl("aimoge.opus") },
  kanimoge: { label: "かにもげのテーマ", path: bgmAudioUrl("kanimoge.opus") },
  hassan: { label: "ハッサンのテーマ", path: bgmAudioUrl("hassan.opus") },
  sabachang: {
    label: "鯖ちゃんのテーマ",
    path: bgmAudioUrl("sabachang.opus"),
  },
  random: { label: "ランダム", path: "" },
} as const;

export type BgmKey = keyof typeof BGM;

function isBgmKey(value: string): value is BgmKey {
  return value in BGM;
}

// BGM一覧から選択肢に表示するキー（op, win は固定BGMのため除外）
export const BGM_SELECTABLE_KEYS: BgmKey[] = [
  "none",
  "random",
  "game",
  "riichi",
  "gandhara",
  "aimoge",
  "kanimoge",
  "hassan",
  "sabachang",
];
export const BGM_NORMAL_KEYS: BgmKey[] = [
  "random",
  "game",
  "riichi",
  "gandhara",
  "aimoge",
  "kanimoge",
  "hassan",
  "sabachang",
];

// BGM_MUSIC_KEYS: 実際に音楽が存在するキー（none/random/op/win を除く）
export const BGM_MUSIC_KEYS: BgmKey[] = [
  "game",
  "riichi",
  "gandhara",
  "aimoge",
  "kanimoge",
  "hassan",
  "sabachang",
];

export function resolveBgmKey(
  setting: BgmKey,
  exclude: BgmKey,
  excludePath?: string,
): BgmKey {
  if (!isBgmKey(setting)) return "game";
  if (!isBgmKey(exclude)) exclude = "none";
  if (setting !== "random") return setting;
  const pool = BGM_MUSIC_KEYS.filter(
    (k) => k !== exclude && BGM[k].path !== excludePath,
  );
  if (pool.length === 0) {
    const fallbackPool = BGM_MUSIC_KEYS.filter((k) => k !== exclude);
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function resolveBgmPath(
  setting: BgmKey,
  exclude: BgmKey,
  excludePath?: string,
): string {
  const resolved = resolveBgmKey(setting, exclude, excludePath);
  if (resolved === "none") return "";
  return BGM[resolved]?.path ?? BGM.game.path;
}

export function getPreloadBgmPaths(
  lightweightMode: boolean,
  normalBgmSetting: BgmKey,
  riichiBgmSetting: BgmKey,
): string[] {
  if (!lightweightMode) {
    return Object.values(BGM)
      .filter((bgm) => bgm.path)
      .map((bgm) => bgm.path);
  }

  const files = new Set<string>();
  files.add(BGM.op.path);
  files.add(BGM.win.path);

  const addIfPresent = (path: string) => {
    if (path) files.add(path);
  };

  if (normalBgmSetting !== "random") {
    addIfPresent(resolveBgmPath(normalBgmSetting, "riichi"));
  }

  if (riichiBgmSetting !== "random") {
    addIfPresent(resolveBgmPath(riichiBgmSetting, "game"));
  }

  return [...files];
}

export const PLAYER_CONFIGS = TileData.slice(0, PLAYER_COUNT).map(
  ({ id, colorHex, name }) => ({
    imageUrl: getImageUrl(id),
    colorHex,
    name,
    charId: id,
  }),
);
