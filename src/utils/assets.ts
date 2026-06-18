export function assetUrl(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalized}`;
}

export function imageAssetUrl(path: string): string {
  return assetUrl(`images/${path}`);
}

export function audioAssetUrl(path: string): string {
  return assetUrl(`audio/${path}`);
}

export function tileImageUrl(id: string): string {
  return imageAssetUrl(`tiles/${id}.webp`);
}

export type CutinImageVariant = "normal" | "baiman";

export function cutinImageUrl(
  id: string,
  variant: CutinImageVariant = "normal",
): string {
  return imageAssetUrl(
    variant === "baiman" ? `cutin/${id}002.webp` : `cutin/${id}001.webp`,
  );
}

export function danceImageUrl(id: string): string {
  return imageAssetUrl(`dance/${id}.webp`);
}

export function bgmAudioUrl(fileName: string): string {
  return audioAssetUrl(`bgm/${fileName}`);
}

export function seAudioUrl(fileName: string): string {
  return audioAssetUrl(`se/${fileName}`);
}

export function voiceAudioUrl(fileName: string): string {
  return audioAssetUrl(`voice/${fileName}`);
}
