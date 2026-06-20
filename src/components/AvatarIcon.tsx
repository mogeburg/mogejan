import styles from "@/components/AvatarIcon.module.scss";
import { CrownIcon } from "@/components/CrownIcon";

interface AvatarIconProps {
  imageUrl: string;
  colorHex: string;
  size?: number;
  crown?: boolean;
  crownSize?: number;
  crownOffset?: number;
}

export function AvatarIcon({
  imageUrl,
  colorHex,
  size = 40,
  crown = false,
  crownSize = 18,
  crownOffset = 0,
}: AvatarIconProps) {
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
