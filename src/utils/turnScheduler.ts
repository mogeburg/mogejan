import { CPU_DELAYS_BY_SPEED } from "@/constants/game";

export function scheduleNextDraw(options: {
  nextTurn: number;
  speed: number;
  canDraw: () => boolean;
  draw: () => void;
}): void {
  const drawDelay = Math.max(1, Math.floor((CPU_DELAYS_BY_SPEED[options.speed] ?? CPU_DELAYS_BY_SPEED[1]) / 3));

  setTimeout(() => {
    if (!options.canDraw()) return;
    options.draw();
  }, drawDelay);
}
