import styles from "@/components/DanceAvatar.module.scss";
import { isPortraitGameSize } from "@/constants/layout";
import { useGameStore } from "@/store";
import { danceImageUrl } from "@/utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

interface DanceFrame {
  position: string;
  weight: number;
}

interface DanceProfile {
  imageUrl: string;
  frames: DanceFrame[];
}

const DANCE_PROFILES: Record<string, DanceProfile> = {
  kanimoge: {
    imageUrl: danceImageUrl("kanimoge"),
    frames: [
      { position: "100% 0%", weight: 10 },
      { position: "0% 100%", weight: 10 },
      { position: "50% 100%", weight: 10 },
      { position: "100% 100%", weight: 10 },
      { position: "0% 0%", weight: 10 },
      { position: "50% 0%", weight: 10 },
    ],
  },
  burumoge: {
    imageUrl: danceImageUrl("burumoge"),
    frames: [
      { position: "100% 0%", weight: 15 },
      { position: "0% 100%", weight: 20 },
      { position: "50% 100%", weight: 10 },
      { position: "100% 100%", weight: 15 },
      { position: "0% 0%", weight: 20 },
      { position: "50% 0%", weight: 10 },
    ],
  },
};

interface DanceAvatarProps {
  character: string;
  bpm?: number;
}

export function DanceAvatar({ character, bpm = 100 }: DanceAvatarProps) {
  const duration = 60 / bpm;
  const profile = DANCE_PROFILES[character];
  const show = profile != null;
  const gameSize = useGameStore((s) => s.gameSize);
  const isPortrait = isPortraitGameSize(gameSize);

  const keyframeStyle = useMemo(() => {
    if (!profile) return "";
    const frames = profile.frames;
    const totalWeight = frames.reduce((s, f) => s + f.weight, 0);
    let cum = 0;
    const stops = frames.map((f) => {
      cum += f.weight / totalWeight;
      return `${(cum * 100).toFixed(2)}% { background-position: ${f.position}; }`;
    });
    return `@keyframes dance-${character} { 0% { background-position: ${frames[0].position}; } ${stops.join(" ")} }`;
  }, [character, profile]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <style>{keyframeStyle}</style>
          <motion.div
            className={`${styles.container} ${isPortrait ? styles.containerPortrait : ""}`}
            style={
              {
                backgroundImage: `url(${profile.imageUrl})`,
                "--dance-duration": `${duration}s`,
                animationName: `dance-${character}`,
              } as React.CSSProperties
            }
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ duration: 0.25, ease: "backOut" }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
