import type { CpuPersonality } from "@/ai/CpuController";
import { ABILITY_MAX_GAUGE } from "@/constants/abilities";
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
  specialAbilitiesEnabled: boolean;
  abilityGauge: number;
  abilityReady: boolean;
  abilityActivated: boolean;
  abilityLabel: string | null;
  cpuPersonality?: CpuPersonality | null;
  badgeSide?: "left" | "right";
  badgeLayout?: "side" | "bottom";
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
  specialAbilitiesEnabled,
  abilityGauge,
  abilityReady,
  abilityActivated,
  abilityLabel,
  cpuPersonality,
  badgeSide = "right",
  badgeLayout = "side",
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
    abilityActivated && abilityLabel ? abilityLabel : null,
  ].filter((badge): badge is string => badge != null);
  const gaugePercent = Math.max(
    0,
    Math.min(100, (abilityGauge / ABILITY_MAX_GAUGE) * 100),
  );

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
            showProgress={specialAbilitiesEnabled}
            progress={gaugePercent}
            progressReady={abilityReady}
            progressActivated={abilityActivated}
          />
          <div className={styles.bubbleStack}>
            <AnimatePresence>
              {speechBubbles.map((bubble) => (
                <SpeechBubble key={bubble.id} text={bubble.text} />
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className={styles.identityStack}>
          <span className={styles.name}>{player.name}</span>
          <span className={styles.score}>{player.score}</span>
        </div>
        {showCpuPersonalities && personalityLabel && (
          <span className={styles.personalityLabel}>{personalityLabel}</span>
        )}
      </div>
      <div
        className={`${styles.statusRow} ${
          badgeLayout === "bottom"
            ? styles.statusRowBottom
            : badgeSide === "left"
              ? styles.statusRowLeft
              : styles.statusRowRight
        }`}
      >
        {badgeItems.length > 0 && (
          <div
            className={
              badgeLayout === "bottom"
                ? styles.badgeColumnBottom
                : badgeSide === "left"
                  ? styles.badgeColumnLeft
                  : styles.badgeColumnRight
            }
          >
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
