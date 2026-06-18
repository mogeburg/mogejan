import { Howler } from "howler";
import { useRef, useState } from "react";
import { BGM } from "@/constants/game";
import { useGameStore } from "@/store";
import {
  cutinImageUrl,
  danceImageUrl,
  seAudioUrl,
  tileImageUrl,
  voiceAudioUrl,
} from "@/utils/assets";
import { preloadAudioFiles } from "@/utils/audio";
import styles from "@/screens/LoadingScreen.module.scss";

const audioFiles = [
  ...(Object.values(BGM).filter((b) => b.path).map((b) => b.path)),
  seAudioUrl("atari.opus"),
  seAudioUrl("drop.opus"),
  seAudioUrl("end.opus"),
  seAudioUrl("start.opus"),
  seAudioUrl("tsumo.opus"),
  seAudioUrl("ryuukyoku.opus"),
  voiceAudioUrl("tsumo.opus"),
  voiceAudioUrl("tsumo-echo.opus"),
  voiceAudioUrl("ron.opus"),
  voiceAudioUrl("ron-echo.opus"),
  voiceAudioUrl("riichi.opus"),
  voiceAudioUrl("pon.opus"),
];

const charIds = [
  "aimoge",
  "anemoge",
  "anoko",
  "burumoge",
  "imouto",
  "miimoge",
  "otyanti",
  "pikasan",
  "siran",
];

const trendTileIds = [
  "brown-aimoge",
  "kanimoge",
  "dokumoge",
  "osorosiimoge",
  "hassan",
  "mekamiimoge",
  "aimon",
  "dokuimo",
  "ebinaihu",
  "syako",
  "saba",
  "datyomoge",
];

const tileIds = [
  ...charIds,
  ...trendTileIds,
];

const totalImages = tileIds.length + charIds.length * 2 + 2;
const totalItems = totalImages + audioFiles.length;

const preloadedImages: HTMLImageElement[] = [];

function preloadImages(onProgress: () => void): Promise<void> {
  const tileUrls = tileIds.map(
    (id) => tileImageUrl(id),
  );
  const cutinUrls = charIds.flatMap((id) => [
    cutinImageUrl(id),
    cutinImageUrl(id, "baiman"),
  ]);
  return Promise.all(
    [
      ...tileUrls,
      ...cutinUrls,
      danceImageUrl("kanimoge"),
      danceImageUrl("burumoge"),
    ].map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          preloadedImages.push(img);
          img.onload = () => { onProgress(); resolve(); };
          img.onerror = () => { onProgress(); resolve(); };
          img.src = url;
        }),
    ),
  ).then(() => {});
}

function preloadAudio(onProgress: () => void): Promise<void> {
  return preloadAudioFiles(audioFiles, onProgress);
}

export function LoadingScreen() {
  const goTo = useGameStore((s) => s.goTo);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const started = useRef(false);
  const loadedRef = useRef(0);

  function handleClick() {
    if (loading) return;
    if (started.current) return;
    started.current = true;
    const ctx = Howler.ctx;
    if (ctx?.state === "suspended") ctx.resume();
    setLoading(true);

    const inc = () => {
      loadedRef.current++;
      setProgress(Math.round((loadedRef.current / totalItems) * 100));
    };

    Promise.all([preloadImages(inc), preloadAudio(inc)]).then(() => {
      goTo("title");
    });
  }

  return (
    <div
      onClick={handleClick}
      className={`${styles.overlay} ${loading ? styles.overlayLoading : ""}`}
    >
      <div className={styles.center}>
        {loading ? (
          <>
            <span className={styles.loadingText}>
              {progress}%
            </span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <span className={styles.promptText}>
              画面タッチで画像・音声ファイルをロードします。
            </span>
            <span className={styles.hintText}>
              ロード完了後は音声が流れますので、電波状況と音量にお気をつけください。
            </span>
          </>
        )}
      </div>
    </div>
  );
}
