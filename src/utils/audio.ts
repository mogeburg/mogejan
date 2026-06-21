import { Howl } from "howler";
import { useEffect } from "react";
import { useGameStore } from "@/store";
import { seAudioUrl } from "@/utils/assets";

let currentBgm: Howl | null = null;
let currentBgmSrc = "";
let audioStoreSubscribed = false;
const audioCache = new Map<string, Howl>();

function getOrCreateHowl(src: string, loop = false): Howl {
  const cached = audioCache.get(src);
  if (cached) {
    return cached;
  }

  const howl = new Howl({
    src,
    loop,
    preload: false,
  });
  audioCache.set(src, howl);
  return howl;
}

function calcVolume(type: "bgm" | "se" | "voice"): number {
  const { masterVolume, bgmVolume, seVolume, voiceVolume } =
    useGameStore.getState();
  const typeVol =
    type === "bgm" ? bgmVolume : type === "se" ? seVolume : voiceVolume;
  return (masterVolume / 100) * (typeVol / 100);
}

function updateBgmVolume() {
  currentBgm?.volume(calcVolume("bgm"));
}

function ensureAudioStoreSubscription() {
  if (audioStoreSubscribed) return;
  audioStoreSubscribed = true;

  useGameStore.subscribe((state) => {
    updateBgmVolume();

    if (state.drawnTile != null && state.drawnTile !== prevDrawnTile) {
      queueMicrotask(() => playSe(seAudioUrl("tsumo.opus")));
    }
    prevDrawnTile = state.drawnTile;

    if (
      state.lastDiscard != null &&
      (prevLastDiscard == null ||
        state.lastDiscard.tileId !== prevLastDiscard.tileId ||
        state.lastDiscard.fromPlayer !== prevLastDiscard.fromPlayer)
    ) {
      queueMicrotask(() => playSe(seAudioUrl("drop.opus")));
    }
    prevLastDiscard = state.lastDiscard;

    const ponCount = state.ponMelds.reduce((s, m) => s + m.length, 0);
    if (ponCount > prevPonCount) {
      queueMicrotask(() => playSe(seAudioUrl("tsumo.opus")));
    }
    prevPonCount = ponCount;
  });
}

export function playBgm(src: string, loop = true) {
  ensureAudioStoreSubscription();
  stopBgm();
  currentBgm = getOrCreateHowl(src, loop);
  currentBgmSrc = src;
  currentBgm.stop();
  currentBgm.loop(loop);
  currentBgm.volume(calcVolume("bgm"));
  currentBgm.play();
}

export function stopBgm() {
  currentBgm?.stop();
  currentBgm = null;
  currentBgmSrc = "";
}

export function getCurrentBgmSrc() {
  return currentBgmSrc;
}

export function playSe(src: string) {
  ensureAudioStoreSubscription();
  const se = getOrCreateHowl(src);
  se.volume(calcVolume("se"));
  se.play();
}

let currentVoice: Howl | null = null;

function stopVoice() {
  currentVoice?.stop();
  currentVoice = null;
}

export function playVoice(src: string) {
  ensureAudioStoreSubscription();
  stopVoice();
  const voice = getOrCreateHowl(src);
  voice.stop();
  voice.volume(calcVolume("voice"));
  currentVoice = voice;
  voice.play();
}

// SE state tracking
let prevDrawnTile: number | null = null;
let prevLastDiscard: { tileId: number; fromPlayer: number } | null = null;
let prevPonCount = 0;

export function preloadAudioFiles(
  sources: string[],
  onProgress?: () => void,
): Promise<void> {
  ensureAudioStoreSubscription();
  return Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          const howl = getOrCreateHowl(src);
          if (howl.state() === "loaded") {
            onProgress?.();
            resolve();
            return;
          }

          const finalize = () => {
            howl.off("load", finalize);
            howl.off("loaderror", finalize);
            onProgress?.();
            resolve();
          };

          howl.once("load", finalize);
          howl.once("loaderror", finalize);
          howl.load();
        }),
    ),
  ).then(() => {});
}

export function useBgm(src: string, loop = true) {
  useEffect(() => {
    if (!src) return;
    ensureAudioStoreSubscription();
    playBgm(src, loop);
  }, [src, loop]);
}
