import { useEffect, useState } from "react";
import { useGameStore } from "@/store";
import { playSe, stopBgm } from "@/utils/audio";
import { cutinImageUrl as getCutinImageUrl, seAudioUrl } from "@/utils/assets";
import styles from "@/components/CutIn.module.scss";

const TEXT_STYLE_MAP: Record<string, string> = {
  normal: styles.textNormal,
  rare: styles.textRare,
  epic: styles.textEpic,
  ryuukyoku: styles.textRyuukyoku,
};

export function CutIn() {
  const hideCutin = useGameStore((s) => s.hideCutin);
  const cutin = useGameStore((s) => s.cutin);
  const cutinPlayer = useGameStore((s) => s.cutinPlayer);
  const cutinType = useGameStore((s) => s.cutinType);
  const cutinImageVariant = useGameStore((s) => s.cutinImageVariant);
  const players = useGameStore((s) => s.players);
  const simulationMode = useGameStore((s) => s.simulationMode);
  const speed = useGameStore((s) => s.speed);
  const [show, setShow] = useState(false);
  const [imageFallback, setImageFallback] = useState(false);

  useEffect(() => {
    if (cutin != null) {
      setImageFallback(false);
      stopBgm();
      playSe(
        cutinType === "ryuukyoku"
          ? seAudioUrl("ryuukyoku.opus")
          : seAudioUrl("atari.opus"),
      );
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [cutin, cutinType]);

  useEffect(() => {
    if (cutin == null || !simulationMode) return;
    const delays = [3000, 2000, 1000, 500, 100];
    const timer = setTimeout(hideCutin, (delays[speed] ?? 500));
    return () => clearTimeout(timer);
  }, [cutin, simulationMode, speed, hideCutin]);

  if (cutin == null) return null;

  const imageUrl =
    cutinPlayer != null
      ? getCutinImageUrl(
          players[cutinPlayer].charId,
          imageFallback ? "normal" : cutinImageVariant,
        )
      : null;

  return (
    <div
      onClick={hideCutin}
      className={`${styles.overlay} ${cutinType === "ryuukyoku" ? styles.overlayDark : ""}`}
    >
      {show && cutinType !== "ryuukyoku" && imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className={styles.image}
          onError={() => {
            if (!imageFallback && cutinImageVariant !== "normal") {
              setImageFallback(true);
            }
          }}
        />
      )}
      {show && (
        <div className={`${styles.text} ${cutinType === "ryuukyoku" ? styles.textCenter : ""} ${TEXT_STYLE_MAP[cutinType]}`}>
          {cutin}
        </div>
      )}
    </div>
  );
}
