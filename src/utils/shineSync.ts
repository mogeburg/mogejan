const DURATION = 2000;
let rafId: number | null = null;

function tick() {
  const t = (performance.now() % DURATION) / DURATION;
  const p = t <= 0.9 ? t / 0.9 : 1;
  const eased = p * p * p * (p * (6 * p - 15) + 10);
  const pos = eased * 400 - 200;
  document.documentElement.style.setProperty("--shine-pos", `${pos}%`);
  rafId = requestAnimationFrame(tick);
}

export function startShineSync() {
  if (rafId != null) return;
  rafId = requestAnimationFrame(tick);
}

export function stopShineSync() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
