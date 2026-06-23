import styles from "@/components/AvatarIcon.module.scss";
import { CrownIcon } from "@/components/CrownIcon";

interface AvatarIconProps {
  imageUrl: string;
  colorHex: string;
  size?: number;
  crown?: boolean;
  crownSize?: number;
  crownOffset?: number;
  progress?: number;
  progressReady?: boolean;
  progressActivated?: boolean;
  showProgress?: boolean;
}

export function AvatarIcon({
  imageUrl,
  colorHex,
  size = 40,
  crown = false,
  crownSize = 18,
  crownOffset = 0,
  progress = 0,
  progressReady = false,
  progressActivated = false,
  showProgress = true,
}: AvatarIconProps) {
  const ringSize = size + 10;
  const ringStroke = 4;
  const radius = ringSize / 2 - ringStroke / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const displayProgress = progressActivated ? 100 : clampedProgress;
  const dashOffset =
    circumference - (circumference * displayProgress) / 100;

  return (
    <div className={styles.wrapper}>
      {crown && (
        <div
          className={styles.crown}
          style={{ top: `calc(-30% + ${crownOffset}px)` }}
        >
          <CrownIcon size={crownSize} />
        </div>
      )}
      {showProgress && (
        <svg
          className={styles.progressRing}
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          aria-hidden="true"
        >
          <circle
            className={styles.progressTrack}
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            strokeWidth={ringStroke}
          />
          <circle
            className={`${styles.progressValue} ${progressReady ? styles.progressValueReady : ""} ${progressActivated ? styles.progressValueActivated : ""}`}
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            strokeWidth={ringStroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
      )}
      <div
        className={styles.avatar}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${imageUrl})`,
          backgroundColor: colorHex,
          border: `2px solid #000`,
        }}
      />
    </div>
  );
}
