export function assetUrl(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalized}`;
}

function stripKnownExtension(
  fileName: string,
  extensions: readonly string[],
): string {
  const lower = fileName.toLowerCase();
  const matched = extensions.find((extension) => lower.endsWith(`.${extension}`));
  if (!matched) return fileName;
  return fileName.slice(0, -(matched.length + 1));
}

let cachedWebpSupport: boolean | null = null;
let cachedOpusSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (cachedWebpSupport != null) return cachedWebpSupport;
  if (typeof document === "undefined") {
    cachedWebpSupport = true;
    return cachedWebpSupport;
  }

  const canvas = document.createElement("canvas");
  cachedWebpSupport =
    canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return cachedWebpSupport;
}

function supportsOpus(): boolean {
  if (cachedOpusSupport != null) return cachedOpusSupport;
  if (typeof Audio === "undefined") {
    cachedOpusSupport = true;
    return cachedOpusSupport;
  }

  const audio = new Audio();
  cachedOpusSupport = Boolean(
    audio.canPlayType('audio/ogg; codecs="opus"') ||
      audio.canPlayType('audio/webm; codecs="opus"'),
  );
  return cachedOpusSupport;
}

function preferredImageExtension(): "webp" | "png" {
  return supportsWebp() ? "webp" : "png";
}

function preferredAudioExtension(): "opus" | "mp3" {
  return supportsOpus() ? "opus" : "mp3";
}

export function imageAssetUrl(path: string): string {
  return assetUrl(`images/${path}`);
}

export function audioAssetUrl(path: string): string {
  return assetUrl(`audio/${path}`);
}

export function tileImageUrl(id: string): string {
  return imageAssetUrl(`tiles/${id}.${preferredImageExtension()}`);
}

export type CutinImageVariant = "normal" | "baiman";

export function cutinImageUrl(
  id: string,
  variant: CutinImageVariant = "normal",
): string {
  const suffix = variant === "baiman" ? "002" : "001";
  return imageAssetUrl(
    `cutin/${id}${suffix}.${preferredImageExtension()}`,
  );
}

export function danceImageUrl(id: string): string {
  return imageAssetUrl(`dance/${id}.${preferredImageExtension()}`);
}

export function bgmAudioUrl(fileName: string): string {
  const baseName = stripKnownExtension(fileName, ["opus", "mp3"]);
  return audioAssetUrl(`bgm/${baseName}.${preferredAudioExtension()}`);
}

export function seAudioUrl(fileName: string): string {
  const baseName = stripKnownExtension(fileName, ["opus", "mp3"]);
  return audioAssetUrl(`se/${baseName}.${preferredAudioExtension()}`);
}

export function voiceAudioUrl(fileName: string): string {
  const baseName = stripKnownExtension(fileName, ["opus", "mp3"]);
  return audioAssetUrl(`voice/${baseName}.${preferredAudioExtension()}`);
}
