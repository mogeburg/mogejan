import type { CpuPersonality } from "@/ai/CpuController";
import { AvatarIcon } from "@/components/AvatarIcon";
import styles from "@/components/PlayerInfo.module.scss";
import { SpeechBubble } from "@/components/SpeechBubble";
import type { Player } from "@/store";
import { useGameStore } from "@/store";
import { AnimatePresence } from "framer-motion";

interface PlayerInfoProps {
  player: Player;
  isTurn: boolean;
  isParent: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  isMenzen: boolean;
  isDoubleReach: boolean;
  speechBubbles: { id: number; text: string }[];
  cpuPersonality?: CpuPersonality | null;
}

export function PlayerInfo({
  player,
  isTurn,
  isParent,
  isRiichi,
  isIppatsu,
  isMenzen,
  isDoubleReach,
  speechBubbles,
  cpuPersonality,
}: PlayerInfoProps) {
  const showCpuPersonalities = useGameStore(
    (s) => s.debugFlags.showCpuPersonalities,
  );
  const personalityLabel = cpuPersonality
    ? (() => {
        const a = Math.round(((cpuPersonality.weight - 1) / 9) * 6);
        return "⚔️".repeat(a) + "🛡️".repeat(6 - a);
      })()
    : null;
  const badgeItems = [
    isMenzen ? "メンゼン" : null,
    isDoubleReach ? "Wリーチ" : isRiichi ? "リーチ" : null,
    isIppatsu ? "イッパツ" : null,
  ].filter((badge): badge is string => badge != null);

  return (
    <div
      className={`${styles.container} ${isTurn ? styles.containerTurn : styles.containerNormal}`}
    >
      <div className={styles.avatarColumn}>
        <div className={styles.avatarWrapper}>
          <AvatarIcon
            imageUrl={player.imageUrl}
            colorHex={player.colorHex}
            size={52}
            crown={isParent}
            crownSize={24}
            crownOffset={6}
          />
          <div className={styles.bubbleStack}>
            <AnimatePresence>
              {speechBubbles.map((bubble) => (
                <SpeechBubble key={bubble.id} text={bubble.text} />
              ))}
            </AnimatePresence>
          </div>
          <div className={styles.identityStack}>
            <span className={styles.name}>{player.name}</span>
            <span className={styles.score}>{player.score}</span>
          </div>
        </div>
        {showCpuPersonalities && personalityLabel && (
          <span className={styles.personalityLabel}>{personalityLabel}</span>
        )}
      </div>
      <div className={styles.statusRow}>
        {badgeItems.length > 0 && (
          <div className={styles.badgeColumnRight}>
            {badgeItems.map((badge) => (
              <span key={badge} className={styles.badge}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
