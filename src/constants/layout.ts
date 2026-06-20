import type { LightningPoint } from "@/components/LightningEffect";
import layoutTokens from "@/styles/layoutTokens.module.scss";

export type GameSize = {
  width: number;
  height: number;
};

export type ScreenMode = "auto" | "portrait" | "landscape";

export type LayoutBox = GameSize & {
  left: number;
  top: number;
};

export type LayoutAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const ANCHOR_RATIO_MAP: Record<LayoutAnchor, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  "top-center": { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  "middle-left": { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  "middle-right": { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-center": { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

function parsePixelValue(value: string): number {
  return Number.parseFloat(value) || 0;
}

export const DEFAULT_GAME_SIZE: GameSize = {
  width: parsePixelValue(layoutTokens.gameWidth),
  height: parsePixelValue(layoutTokens.gameHeight),
};

export const LANDSCAPE_GAME_SIZE: GameSize = {
  width: 1280,
  height: 720,
};

export const PORTRAIT_GAME_SIZE: GameSize = {
  width: 720,
  height: 1280,
};

export function resolveScreenMode(
  mode: ScreenMode,
  viewportWidth: number,
  viewportHeight: number,
): Exclude<ScreenMode, "auto"> {
  if (mode === "portrait" || mode === "landscape") return mode;
  return viewportHeight >= viewportWidth ? "portrait" : "landscape";
}

export function getGameSizeForScreenMode(
  mode: ScreenMode,
  viewportWidth: number,
  viewportHeight: number,
): GameSize {
  const resolvedMode = resolveScreenMode(mode, viewportWidth, viewportHeight);
  return resolvedMode === "portrait" ? PORTRAIT_GAME_SIZE : LANDSCAPE_GAME_SIZE;
}

export function isPortraitGameSize(size: GameSize): boolean {
  return size.height > size.width;
}

export const DEFAULT_LAYOUT_BOX: LayoutBox = {
  left: 0,
  top: 0,
  ...DEFAULT_GAME_SIZE,
};

export function getLayoutBox(element?: Element | null): LayoutBox {
  if (element instanceof HTMLElement) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }
  }

  return DEFAULT_LAYOUT_BOX;
}

export function getGameSize(element?: Element | null): GameSize {
  const { width, height } = getLayoutBox(element);
  return { width, height };
}

export function getAnchorPoint(
  anchor: LayoutAnchor,
  size: GameSize = DEFAULT_GAME_SIZE,
  offset?: Pick<LayoutBox, "left" | "top">,
): LightningPoint {
  const ratio = ANCHOR_RATIO_MAP[anchor];
  return {
    x: (offset?.left ?? 0) + size.width * ratio.x,
    y: (offset?.top ?? 0) + size.height * ratio.y,
  };
}

export function getGameCenter(
  size: GameSize = DEFAULT_GAME_SIZE,
  offset?: Pick<LayoutBox, "left" | "top">,
): LightningPoint {
  return getAnchorPoint("center", size, offset);
}

export function getSeatAnchor(
  playerIndex: number,
  size: GameSize = DEFAULT_GAME_SIZE,
  offset?: Pick<LayoutBox, "left" | "top">,
  referenceSize: GameSize = DEFAULT_GAME_SIZE,
): LightningPoint {
  const center = getGameCenter(size, offset);
  const scaleX = size.width / referenceSize.width;
  const scaleY = size.height / referenceSize.height;
  const xOffset = 540 * 0.5 * scaleX;
  const yOffset = 320 * 0.5 * scaleY;

  switch (playerIndex) {
    case 0:
      return {
        x: center.x,
        y: center.y + yOffset,
      };
    case 1:
      return {
        x: center.x - xOffset,
        y: center.y,
      };
    case 2:
      return {
        x: center.x,
        y: center.y - yOffset,
      };
    case 3:
      return {
        x: center.x + xOffset,
        y: center.y,
      };
    default:
      return {
        x: center.x,
        y: center.y + yOffset,
      };
  }
}
