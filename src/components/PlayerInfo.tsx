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
  return (
    <div
      className={`${styles.container} ${isTurn ? styles.containerTurn : styles.containerNormal}`}
    >
      <div className={styles.avatarWrapper}>
        <AvatarIcon
          imageUrl={player.imageUrl}
          colorHex={player.colorHex}
          size={40}
          border="2px solid #fff"
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
      </div>
      <div className={styles.info}>
        {showCpuPersonalities && personalityLabel && (
          <span className={styles.personalityLabel}>{personalityLabel}</span>
        )}
        <span className={styles.name}>{player.name}</span>
        <span className={styles.score}>{player.score}</span>
      </div>
      {isRiichi && (
        <div className={styles.badgeRowBottom}>
          {isMenzen && <span className={styles.badgeMenzen}>メンゼン</span>}
          <span className={styles.badgeRiichi}>
            {isDoubleReach ? "Wリーチ" : "リーチ"}
          </span>
          {isIppatsu && <span className={styles.badgeIppatsu}>イッパツ</span>}
        </div>
      )}
    </div>
  );
}
