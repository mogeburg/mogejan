import styles from "@/components/AbilityCutin.module.scss";
import { useGameStore } from "@/store";
import { cutinImageUrl, seAudioUrl } from "@/utils/assets";
import { playSe } from "@/utils/audio";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const ABILITY_CUTIN_DISPLAY_MS = 500;
const ABILITY_CUTIN_FADE_MS = 250;

export function AbilityCutin() {
  const abilityCutinActive = useGameStore((s) => s.abilityCutinActive);
  const abilityCutinPlayer = useGameStore((s) => s.abilityCutinPlayer);
  const abilityCutinText = useGameStore((s) => s.abilityCutinText);
  const abilityCutinQueue = useGameStore((s) => s.abilityCutinQueue);
  const clearAbilityCutin = useGameStore((s) => s.clearAbilityCutin);
  const players = useGameStore((s) => s.players);

  const hasNext = abilityCutinQueue.length > 0;

  useEffect(() => {
    if (!abilityCutinActive) return;
    playSe(seAudioUrl("atari.opus"));
    const timer = setTimeout(clearAbilityCutin, ABILITY_CUTIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [abilityCutinActive, abilityCutinPlayer, clearAbilityCutin]);

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {abilityCutinActive && abilityCutinPlayer != null && (
          <motion.div
            key={abilityCutinPlayer}
            className={styles.imageArea}
            initial={{ opacity: 0, scale: 100 }}
            animate={{ opacity: 1, scale: [100, 1.05, 1] }}
            exit={{
              opacity: 0,
              transition: {
                duration: hasNext ? 0 : ABILITY_CUTIN_FADE_MS / 1000,
              },
            }}
            transition={{
              scale: {
                duration: ABILITY_CUTIN_DISPLAY_MS / 1000,
                times: [0, 0.05, 1],
                ease: "easeOut",
              },
              opacity: {
                duration: 0.001,
              },
            }}
          >
            <img
              src={cutinImageUrl(players[abilityCutinPlayer].charId)}
              alt=""
              className={styles.image}
            />
            <span className={styles.text}>{abilityCutinText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
