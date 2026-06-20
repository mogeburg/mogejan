import styles from "@/components/LightningEffect.module.css";
import { useEffect, useState } from "react";

export type LightningPoint = {
  x: number;
  y: number;
};

type LightningBranch = {
  id: string;
  d: string;
  startRatio: number;
};

type LightningFrame = {
  mainPath: string;
  mainPoints: LightningPoint[];
  branches: LightningBranch[];
  impactBursts: string[];
  mainOuterWidth: number;
  mainCoreWidth: number;
  mainAccentWidth: number;
  branchOuterWidth: number;
  branchCoreWidth: number;
};

export interface LightningEffectProps {
  start: LightningPoint;
  mid?: LightningPoint;
  end: LightningPoint;
  viewportSize: {
    width: number;
    height: number;
  };
  durationMs: number;
  growDurationMs?: number;
  lightweightMode?: boolean;
  onComplete?: () => void;
}

const DEFAULT_GROW_DURATION_MS = 500;
const FADE_OUT_DURATION_MS = 150;
const BRANCH_DELAY_RATIO = 0.08;
const IMPACT_PULSE_DURATION_MS = 50;
const IMPACT_BURST_POP_DURATION_MS = 50;
const IMPACT_TRIGGER_PROGRESS = 0.96;
const LIGHTNING_WIDTH_SCALE = 1.28;
const LIGHTNING_ROOT_WIDTH_SCALE = 3;

function easeOutImpact(value: number): number {
  return 1 - (1 - value) ** 5;
}

function easeOutBack(value: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pointToPointDistance(a: LightningPoint, b: LightningPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getBentCornerPoint(
  start: LightningPoint,
  end: LightningPoint,
): LightningPoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const horizontalDominant = Math.abs(dx) >= Math.abs(dy);
  const bendRatio = horizontalDominant ? 0.82 : 0.18;
  const cornerX = horizontalDominant ? start.x + dx * bendRatio : start.x;
  const cornerY = horizontalDominant ? start.y : start.y + dy * bendRatio;
  const offset = clamp(Math.min(Math.abs(dx), Math.abs(dy)) * 0.12, 8, 36);
  const offsetDirection = dx * dy >= 0 ? -1 : 1;

  return {
    x: horizontalDominant ? cornerX : cornerX + offset * offsetDirection,
    y: horizontalDominant ? cornerY + offset * offsetDirection : cornerY,
  };
}

function sampleBentRoute(
  start: LightningPoint,
  corner: LightningPoint,
  end: LightningPoint,
  t: number,
): LightningPoint {
  const firstLegLength = pointToPointDistance(start, corner);
  const secondLegLength = pointToPointDistance(corner, end);
  const totalLength = Math.max(1, firstLegLength + secondLegLength);
  const cornerRatio = firstLegLength / totalLength;

  if (t <= cornerRatio) {
    const localT = cornerRatio <= 0 ? 0 : t / cornerRatio;
    return {
      x: start.x + (corner.x - start.x) * localT,
      y: start.y + (corner.y - start.y) * localT,
    };
  }

  const localT = cornerRatio >= 1 ? 1 : (t - cornerRatio) / (1 - cornerRatio);
  return {
    x: corner.x + (end.x - corner.x) * localT,
    y: corner.y + (end.y - corner.y) * localT,
  };
}

function getQuadraticControlPointThroughMid(
  start: LightningPoint,
  mid: LightningPoint,
  end: LightningPoint,
): LightningPoint {
  return {
    x: 2 * mid.x - 0.5 * (start.x + end.x),
    y: 2 * mid.y - 0.5 * (start.y + end.y),
  };
}

function sampleQuadraticRoute(
  start: LightningPoint,
  control: LightningPoint,
  end: LightningPoint,
  t: number,
): LightningPoint {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function buildJaggedPoints(
  start: LightningPoint,
  mid: LightningPoint | undefined,
  end: LightningPoint,
  segmentCount: number,
  sway: number,
): LightningPoint[] {
  const routePoints = mid
    ? [start, getQuadraticControlPointThroughMid(start, mid, end), end]
    : [start, getBentCornerPoint(start, end), end];

  const points: LightningPoint[] = [start];

  for (let i = 1; i < segmentCount; i++) {
    const t = i / segmentCount;
    const basePoint = mid
      ? sampleQuadraticRoute(start, routePoints[1], end, t)
      : sampleBentRoute(start, routePoints[1], end, t);
    const sampleAhead = mid
      ? sampleQuadraticRoute(start, routePoints[1], end, Math.min(1, t + 0.02))
      : sampleBentRoute(start, routePoints[1], end, Math.min(1, t + 0.02));
    const tangentX = sampleAhead.x - basePoint.x;
    const tangentY = sampleAhead.y - basePoint.y;
    const tangentLength = Math.max(1, Math.hypot(tangentX, tangentY));
    const normalX = -tangentY / tangentLength;
    const normalY = tangentX / tangentLength;
    const edgeFalloff = Math.sin(Math.PI * t);
    const offset = randomBetween(-sway, sway) * edgeFalloff;

    points.push({
      x: basePoint.x + normalX * offset,
      y: basePoint.y + normalY * offset,
    });
  }

  points.push(end);
  return points;
}

function pointsToPath(points: LightningPoint[]): string {
  if (points.length === 0) return "";
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
}

function buildBranch(
  anchor: LightningPoint,
  direction: LightningPoint,
  index: number,
  startRatio: number,
): LightningBranch {
  const angle = Math.atan2(direction.y, direction.x);
  const spread = randomBetween(-0.9, 0.9);
  const branchAngle = angle + spread;
  const branchLength = randomBetween(40, 110);
  const end: LightningPoint = {
    x: anchor.x + Math.cos(branchAngle) * branchLength,
    y: anchor.y + Math.sin(branchAngle) * branchLength,
  };

  const points = buildJaggedPoints(
    anchor,
    undefined,
    end,
    3 + Math.floor(Math.random() * 3),
    branchLength * 0.12,
  );

  return {
    id: `branch-${index}-${Math.round(anchor.x)}-${Math.round(anchor.y)}`,
    d: pointsToPath(points),
    startRatio,
  };
}

function buildImpactBurst(center: LightningPoint, index: number): string {
  const spokeCount = 40 + Math.floor(Math.random() * 20);
  const baseRotation = randomBetween(0, Math.PI * 2);
  const points: LightningPoint[] = [];

  for (let i = 0; i < spokeCount; i++) {
    const angle = baseRotation + (Math.PI * 2 * i) / spokeCount;
    const isMajorSpike = i % 3 === 0;
    const innerRadius = isMajorSpike
      ? randomBetween(2, 6)
      : randomBetween(5, 11);
    const outerRadius = isMajorSpike
      ? randomBetween(48, 84)
      : randomBetween(26, 48);
    const innerAngleOffset = randomBetween(-0.05, 0.05);
    const outerAngleOffset = isMajorSpike
      ? randomBetween(-0.02, 0.02)
      : randomBetween(-0.04, 0.04);

    points.push({
      x: center.x + Math.cos(angle + innerAngleOffset) * innerRadius,
      y: center.y + Math.sin(angle + innerAngleOffset) * innerRadius,
    });
    points.push({
      x: center.x + Math.cos(angle + outerAngleOffset) * outerRadius,
      y: center.y + Math.sin(angle + outerAngleOffset) * outerRadius,
    });
  }

  return `${index}:M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} ${points
    .slice(1)
    .map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ")} Z`;
}

function interpolatePoint(
  a: LightningPoint,
  b: LightningPoint,
  t: number,
): LightningPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function buildVisiblePoints(
  points: LightningPoint[],
  progress: number,
): LightningPoint[] {
  if (points.length <= 1 || progress <= 0) {
    return [];
  }

  if (progress >= 1) {
    return points;
  }

  const totalSegments = points.length - 1;
  const scaledProgress = progress * totalSegments;
  const lastFullSegmentIndex = Math.floor(scaledProgress);
  const partialProgress = scaledProgress - lastFullSegmentIndex;
  const visiblePoints = points.slice(
    0,
    Math.min(lastFullSegmentIndex + 1, points.length),
  );

  if (lastFullSegmentIndex < totalSegments) {
    const startPoint = points[lastFullSegmentIndex];
    const endPoint = points[lastFullSegmentIndex + 1];
    visiblePoints.push(interpolatePoint(startPoint, endPoint, partialProgress));
  }

  return visiblePoints;
}

function getPointNormal(
  points: LightningPoint[],
  index: number,
): LightningPoint {
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const length = Math.max(1, Math.hypot(dx, dy));

  return {
    x: -dy / length,
    y: dx / length,
  };
}

function buildRibbonPath(
  points: LightningPoint[],
  startWidth: number,
  endWidth: number,
): string {
  if (points.length < 2) {
    return "";
  }

  const leftSide: LightningPoint[] = [];
  const rightSide: LightningPoint[] = [];
  const lastIndex = Math.max(1, points.length - 1);

  points.forEach((point, index) => {
    const ratio = index / lastIndex;
    const width = startWidth + (endWidth - startWidth) * ratio;
    const normal = getPointNormal(points, index);
    const halfWidth = width / 2;

    leftSide.push({
      x: point.x + normal.x * halfWidth,
      y: point.y + normal.y * halfWidth,
    });
    rightSide.push({
      x: point.x - normal.x * halfWidth,
      y: point.y - normal.y * halfWidth,
    });
  });

  const polygonPoints = [...leftSide, ...rightSide.reverse()];
  return `M ${polygonPoints[0].x.toFixed(1)} ${polygonPoints[0].y.toFixed(1)} ${polygonPoints
    .slice(1)
    .map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ")} Z`;
}

function generateLightningFrame(
  start: LightningPoint,
  mid: LightningPoint | undefined,
  end: LightningPoint,
  lightweightMode: boolean,
): LightningFrame {
  const distance = pointToPointDistance(start, end);
  const segmentCount = lightweightMode
    ? clamp(Math.round(distance / 60), 4, 12)
    : clamp(Math.round(distance / 36), 6, 24);
  const mainPoints = buildJaggedPoints(
    start,
    mid,
    end,
    segmentCount,
    clamp(distance * (lightweightMode ? 0.035 : 0.06), 12, lightweightMode ? 28 : 54),
  );

  const branches: LightningBranch[] = [];
  const impactBursts = lightweightMode
    ? []
    : Array.from(
        { length: 2 + Math.floor(Math.random() * 2) },
        (_, index) => buildImpactBurst(end, index),
      ).map((entry) => entry.slice(entry.indexOf(":") + 1));
  const branchAttempts = clamp(Math.floor(distance / 120), 2, 6);

  if (!lightweightMode) {
    for (let i = 1; i < mainPoints.length - 2; i++) {
      if (branches.length >= branchAttempts) break;
      if (Math.random() > 0.38) continue;

      const anchor = mainPoints[i];
      const next = mainPoints[i + 1];
      branches.push(
        buildBranch(
          anchor,
          { x: next.x - anchor.x, y: next.y - anchor.y },
          i,
          i / (mainPoints.length - 1),
        ),
      );
    }
  }

  return {
    mainPath: pointsToPath(mainPoints),
    mainPoints,
    branches,
    impactBursts,
    mainOuterWidth: randomBetween(8, 13) * LIGHTNING_WIDTH_SCALE,
    mainCoreWidth: randomBetween(3.2, 5.2) * LIGHTNING_WIDTH_SCALE,
    mainAccentWidth: randomBetween(1.4, 2.6) * LIGHTNING_WIDTH_SCALE,
    branchOuterWidth: randomBetween(4.5, 7.5) * LIGHTNING_WIDTH_SCALE,
    branchCoreWidth: randomBetween(1.6, 2.8) * LIGHTNING_WIDTH_SCALE,
  };
}

export function LightningEffect({
  start,
  mid,
  end,
  viewportSize,
  durationMs,
  growDurationMs = DEFAULT_GROW_DURATION_MS,
  lightweightMode = false,
  onComplete,
}: LightningEffectProps) {
  const [frame, setFrame] = useState<LightningFrame>(() =>
    generateLightningFrame(start, mid, end, lightweightMode),
  );
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [impactScale, setImpactScale] = useState(1);
  const [impactGlow, setImpactGlow] = useState(0);
  const [impactBurstOpacity, setImpactBurstOpacity] = useState(0);
  const [impactBurstScale, setImpactBurstScale] = useState(0.5);

  useEffect(() => {
    setFrame(generateLightningFrame(start, mid, end, lightweightMode));
    setProgress(0);
    setOpacity(1);
    setImpactScale(1);
    setImpactGlow(0);
    setImpactBurstOpacity(0);
    setImpactBurstScale(0.5);

    let animationFrameId = 0;
    const startedAt = performance.now();
    const totalDuration = growDurationMs + durationMs + FADE_OUT_DURATION_MS;
    let impactStartedAt: number | null = null;

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const growRatio = Math.min(elapsed / growDurationMs, 1);
      const nextProgress = easeOutImpact(growRatio);
      const hasImpacted = nextProgress >= IMPACT_TRIGGER_PROGRESS;
      if (hasImpacted && impactStartedAt == null) {
        impactStartedAt = elapsed;
      }
      const impactElapsed =
        impactStartedAt == null ? 0 : Math.max(0, elapsed - impactStartedAt);
      setProgress(nextProgress);

      if (hasImpacted && impactElapsed <= IMPACT_PULSE_DURATION_MS) {
        const pulseRatio = impactElapsed / IMPACT_PULSE_DURATION_MS;
        const intensity = 1 - pulseRatio;
        setImpactScale(1 + intensity * 0.7);
        setImpactGlow(intensity);
        setImpactBurstOpacity(1);
      } else {
        setImpactScale(1);
        setImpactGlow(0);
        if (hasImpacted) {
          setImpactBurstOpacity(1);
        } else {
          setImpactBurstOpacity(0);
        }
      }

      if (hasImpacted) {
        const burstElapsed = Math.min(
          impactElapsed,
          IMPACT_BURST_POP_DURATION_MS,
        );
        const burstRatio = burstElapsed / IMPACT_BURST_POP_DURATION_MS;
        const poppedScale = 0.26 + easeOutBack(burstRatio) * 1.24;
        const settledScale = 1.28;
        const settleMix = Math.min(Math.max((burstRatio - 0.45) / 0.55, 0), 1);
        setImpactBurstScale(
          poppedScale + (settledScale - poppedScale) * settleMix,
        );
      } else {
        setImpactBurstScale(0.5);
      }

      if (elapsed <= growDurationMs + durationMs) {
        setOpacity(1);
      } else {
        const fadeElapsed = elapsed - (growDurationMs + durationMs);
        const fadeRatio = Math.min(fadeElapsed / FADE_OUT_DURATION_MS, 1);
        setOpacity(1 - fadeRatio);
      }
      if (elapsed < totalDuration) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    animationFrameId = window.requestAnimationFrame(animate);

    const timeoutId = window.setTimeout(() => {
      onComplete?.();
    }, totalDuration);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [start, mid, end, durationMs, growDurationMs, lightweightMode, onComplete]);

  return (
    <div className={styles.overlay} style={{ opacity }}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {!lightweightMode && (
          <defs>
            <filter
              id="lightning-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3.5" result="blurA" />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="8"
                result="blurB"
              />
              <feMerge>
                <feMergeNode in="blurB" />
                <feMergeNode in="blurA" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="lightning-impact-glow"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="8" result="blurA" />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="18"
                result="blurB"
              />
              <feColorMatrix
                in="blurB"
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 1.3 0"
                result="boosted"
              />
              <feMerge>
                <feMergeNode in="boosted" />
                <feMergeNode in="blurA" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {!lightweightMode && impactBurstOpacity > 0.01 && (
          <g
            filter="url(#lightning-impact-glow)"
            opacity={impactBurstOpacity}
            transform={`translate(${end.x} ${end.y}) scale(${impactBurstScale}) translate(${-end.x} ${-end.y})`}
          >
            {frame.impactBursts.map((burstPath, index) => (
              <g key={`impact-burst-${index}`}>
                <path
                  d={burstPath}
                  fill="rgba(140, 228, 255, 0.14)"
                  stroke="rgba(140, 228, 255, 0.72)"
                  strokeWidth={(0.8 + impactGlow * 1.5) * 1.22}
                  strokeLinejoin="round"
                />
                <path
                  d={burstPath}
                  fill="rgba(255, 255, 255, 0.56)"
                  stroke="#ffffff"
                  strokeWidth={(0.38 + impactGlow * 0.85) * 1.22}
                  strokeLinejoin="round"
                />
              </g>
            ))}
            <circle
              cx={end.x}
              cy={end.y}
              r={9 + impactGlow * 14}
              fill="rgba(255, 255, 255, 0.16)"
            />
            <circle
              cx={end.x}
              cy={end.y}
              r={3.5 + impactGlow * 4.5}
              fill="#ffffff"
            />
          </g>
        )}

        {frame.branches.map((branch) => (
          <g
            key={branch.id}
            filter={
              lightweightMode
                ? undefined
                : impactGlow > 0.02
                  ? "url(#lightning-impact-glow)"
                  : "url(#lightning-glow)"
            }
          >
            {(() => {
              const delayedStartRatio = Math.min(
                branch.startRatio + BRANCH_DELAY_RATIO,
                0.96,
              );
              const branchProgress =
                progress > delayedStartRatio
                  ? Math.max(
                      0,
                      ((progress - delayedStartRatio) /
                        (1 - delayedStartRatio || 1)) *
                        100,
                    )
                  : 0;

              return (
                <>
                  <path
                    d={branch.d}
                    pathLength={100}
                    fill="none"
                    stroke="rgba(128, 225, 255, 0.4)"
                    strokeWidth={frame.branchOuterWidth * impactScale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${branchProgress} 100`}
                    opacity={
                      progress > delayedStartRatio
                        ? Math.min(1, 1 + impactGlow * 0.2)
                        : 0
                    }
                  />
                  <path
                    d={branch.d}
                    pathLength={100}
                    fill="none"
                    stroke="#d9f6ff"
                    strokeWidth={frame.branchCoreWidth * impactScale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${branchProgress} 100`}
                    opacity={
                      progress > delayedStartRatio
                        ? Math.min(1, 1 + impactGlow * 0.2)
                        : 0
                    }
                  />
                </>
              );
            })()}
          </g>
        ))}

        {(() => {
          const visibleMainPoints = buildVisiblePoints(
            frame.mainPoints,
            progress,
          );

          if (visibleMainPoints.length < 2) {
            return null;
          }

          const outerPath = buildRibbonPath(
            visibleMainPoints,
            frame.mainOuterWidth * 1.75 * impactScale,
            frame.mainOuterWidth * 0.12 * impactScale,
          );
          const corePath = buildRibbonPath(
            visibleMainPoints,
            frame.mainCoreWidth * 1.65 * LIGHTNING_ROOT_WIDTH_SCALE * impactScale,
            frame.mainCoreWidth * 0.14 * impactScale,
          );
          const accentPath = buildRibbonPath(
            visibleMainPoints,
            frame.mainAccentWidth * 1.55 * LIGHTNING_ROOT_WIDTH_SCALE * impactScale,
            frame.mainAccentWidth * 0.16 * impactScale,
          );

          return (
            <g
              filter={
                lightweightMode
                  ? undefined
                  : impactGlow > 0.02
                    ? "url(#lightning-impact-glow)"
                    : "url(#lightning-glow)"
              }
            >
              <path d={outerPath} fill={lightweightMode ? "rgba(110, 214, 255, 0.26)" : "rgba(110, 214, 255, 0.42)"} />
              <path d={corePath} fill="#ffffff" />
              {!lightweightMode && <path d={accentPath} fill="#9fe7ff" />}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
