import { findTileDataById } from "@/constants/tiles";
import styles from "@/components/TileImage.module.scss";

const SIZE_MAP = { normal: 49, small: 36, mini: 24 } as const;

export type TileSize = keyof typeof SIZE_MAP;

export function TileImage({
  id,
  size,
  faceDown,
  onClick,
  style,
  className,
  highlightSide,
  glow,
  shine,
  blueOverlay,
}: {
  id: number;
  size: TileSize;
  faceDown?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  highlightSide?: "top" | "bottom" | "left" | "right";
  glow?: string;
  shine?: boolean;
  blueOverlay?: boolean;
}) {
  const px = SIZE_MAP[size];
  const info = findTileDataById(id);
  const ht = Math.round(px * 1.2);

  const faceUpHighlight = {
    top: "inset 0 1px 0 rgba(255,255,255,0.6)",
    bottom: "inset 0 -1px 0 rgba(255,255,255,0.6)",
    left: "inset -1px 0 0 rgba(255,255,255,0.6)",
    right: "inset 1px 0 0 rgba(255,255,255,0.6)",
  };

  const faceDownHighlight = {
    top: "inset 0 1px 0 rgba(255,255,255,0.1)",
    bottom: "inset 0 -1px 0 rgba(255,255,255,0.1)",
    left: "inset -1px 0 0 rgba(255,255,255,0.1)",
    right: "inset 1px 0 0 rgba(255,255,255,0.1)",
  };

  const side = highlightSide ?? "top";

  const baseShadow = faceDown
    ? `0 1px 3px rgba(0,0,0,0.3), ${faceDownHighlight[side]}`
    : `0 2px 4px rgba(0,0,0,0.15), ${faceUpHighlight[side]}`;

  return (
    <div
      className={`${styles.tile} ${className ?? ""}`}
      onClick={onClick}
      style={{
        width: px,
        height: ht,
        border: faceDown ? "2px solid #1a3a5a" : "2px solid #2e3d24",
        backgroundImage: faceDown ? undefined : `url(${info.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: faceDown ? "#2a4a6b" : info.colorHex,
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
        boxShadow: glow ? `${baseShadow}, ${glow}` : baseShadow,
        ...style,
      }}
    >
      {shine && <div className={styles.shineElement} />}
      {blueOverlay && <div className={styles.blueOverlay} />}
    </div>
  );
}
