import styles from "@/components/CutIn.module.scss";
import {
  LightningEffect,
  type LightningPoint,
} from "@/components/LightningEffect";
import {
  DEFAULT_GAME_SIZE,
  DEFAULT_LAYOUT_BOX,
  getGameCenter,
  getLayoutBox,
  getSeatAnchor,
  type LayoutBox,
} from "@/constants/layout";
import { useGameStore, type CutinPreview } from "@/store";
import { cutinImageUrl as getCutinImageUrl, seAudioUrl } from "@/utils/assets";
import { playSe, stopBgm } from "@/utils/audio";
import { useEffect, useRef, useState } from "react";

const TEXT_STYLE_MAP: Record<string, string> = {
  normal: styles.textNormal,
  rare: styles.textRare,
  epic: styles.textEpic,
  ryuukyoku: styles.textRyuukyoku,
};

const LIGHTNING_DISPLAY_DURATION_MS = 1500;
const LIGHTNING_GROW_DURATION_MS = 150;

type LightningSegment = {
  start: LightningPoint;
  mid?: LightningPoint;
  end: LightningPoint;
};

function buildRonMidpoint(
  fromPlayer: number,
  toPlayer: number,
  layoutBox: LayoutBox,
): LightningPoint {
  const center = getGameCenter(layoutBox, layoutBox);
  const pairSeed = fromPlayer * 10 + toPlayer;
  const jitterXBase = pairSeed % 2 === 0 ? -32 : 32;
  const jitterYBase = pairSeed % 3 === 0 ? -24 : 24;
  return {
    x: center.x + (jitterXBase / DEFAULT_GAME_SIZE.width) * layoutBox.width,
    y: center.y + (jitterYBase / DEFAULT_GAME_SIZE.height) * layoutBox.height,
  };
}

function buildTsumoMidpoint(
  start: LightningPoint,
  end: LightningPoint,
  layoutBox: LayoutBox,
  fromPlayer: number,
  toPlayer: number,
): LightningPoint {
  const center = getGameCenter(layoutBox, layoutBox);
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const pairSeed = fromPlayer * 10 + toPlayer;
  const centerPull = 0.3;
  const jitterXBase = pairSeed % 2 === 0 ? -18 : 18;
  const jitterYBase = pairSeed % 3 === 0 ? -12 : 12;

  return {
    x:
      midpoint.x * (1 - centerPull) +
      center.x * centerPull +
      (jitterXBase / DEFAULT_GAME_SIZE.width) * layoutBox.width,
    y:
      midpoint.y * (1 - centerPull) +
      center.y * centerPull +
      (jitterYBase / DEFAULT_GAME_SIZE.height) * layoutBox.height,
  };
}

function buildLightningSegments(
  winner: number | null,
  isRon: boolean,
  ronTarget: number | null,
  layoutBox: LayoutBox,
  cutinPreview: CutinPreview | null,
): LightningSegment[] {
  if (cutinPreview != null) {
    const start = getSeatAnchor(
      cutinPreview.sourcePlayer,
      layoutBox,
      layoutBox,
    );
    const targetPlayers = cutinPreview.isRon
      ? [cutinPreview.targetPlayer]
      : [0, 1, 2, 3].filter(
          (playerIndex) => playerIndex !== cutinPreview.sourcePlayer,
        );

    return targetPlayers.map((targetPlayer) => {
      const end = getSeatAnchor(targetPlayer, layoutBox, layoutBox);
      return {
        start,
        mid: cutinPreview.isRon
          ? buildRonMidpoint(cutinPreview.sourcePlayer, targetPlayer, layoutBox)
          : buildTsumoMidpoint(
              start,
              end,
              layoutBox,
              cutinPreview.sourcePlayer,
              targetPlayer,
            ),
        end,
      };
    });
  }

  if (winner == null) return [];

  const start = getSeatAnchor(winner, layoutBox, layoutBox);
  const targetPlayers = isRon
    ? ronTarget != null
      ? [ronTarget]
      : []
    : [0, 1, 2, 3].filter((playerIndex) => playerIndex !== winner);

  return targetPlayers.map((targetPlayer) => {
    const end = getSeatAnchor(targetPlayer, layoutBox, layoutBox);
    return {
      start,
      mid: isRon
        ? buildRonMidpoint(winner, targetPlayer, layoutBox)
        : buildTsumoMidpoint(start, end, layoutBox, winner, targetPlayer),
      end,
    };
  });
}

export function CutIn() {
  const hideCutin = useGameStore((s) => s.hideCutin);
  const cutin = useGameStore((s) => s.cutin);
  const cutinPlayer = useGameStore((s) => s.cutinPlayer);
  const cutinType = useGameStore((s) => s.cutinType);
  const cutinImageVariant = useGameStore((s) => s.cutinImageVariant);
  const players = useGameStore((s) => s.players);
  const simulationMode = useGameStore((s) => s.simulationMode);
  const speed = useGameStore((s) => s.speed);
  const winner = useGameStore((s) => s.winner);
  const isRon = useGameStore((s) => s.isRon);
  const ronTarget = useGameStore((s) => s.ronTarget);
  const cutinPreview = useGameStore((s) => s.cutinPreview);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);
  const [imageFallback, setImageFallback] = useState(false);
  const [layoutBox, setLayoutBox] = useState<LayoutBox>(DEFAULT_LAYOUT_BOX);

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
    const timer = setTimeout(hideCutin, delays[speed] ?? 500);
    return () => clearTimeout(timer);
  }, [cutin, simulationMode, speed, hideCutin]);

  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;

    const updateLayoutBox = () => {
      setLayoutBox(getLayoutBox(element));
    };

    updateLayoutBox();

    const observer = new ResizeObserver(() => {
      updateLayoutBox();
    });
    observer.observe(element);

    window.addEventListener("resize", updateLayoutBox);
    window.addEventListener("scroll", updateLayoutBox, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayoutBox);
      window.removeEventListener("scroll", updateLayoutBox, true);
    };
  }, []);

  if (cutin == null) return null;

  const imageUrl =
    cutinPlayer != null
      ? getCutinImageUrl(
          players[cutinPlayer].charId,
          imageFallback ? "normal" : cutinImageVariant,
        )
      : null;
  const lightningSegments =
    show && cutinType !== "ryuukyoku"
      ? buildLightningSegments(
          winner,
          isRon,
          ronTarget,
          layoutBox,
          cutinPreview,
        )
      : [];

  return (
    <div
      ref={overlayRef}
      onClick={hideCutin}
      className={`${styles.overlay} ${cutinType === "ryuukyoku" ? styles.overlayDark : ""}`}
    >
      {lightningSegments.map((segment, index) => (
        <LightningEffect
          key={`${winner ?? "none"}-${isRon ? "ron" : "tsumo"}-${index}`}
          start={segment.start}
          mid={segment.mid}
          end={segment.end}
          durationMs={LIGHTNING_DISPLAY_DURATION_MS}
          growDurationMs={LIGHTNING_GROW_DURATION_MS}
        />
      ))}
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
        <div
          className={`${styles.text} ${cutinType === "ryuukyoku" ? styles.textCenter : ""} ${TEXT_STYLE_MAP[cutinType]}`}
        >
          {cutin}
        </div>
      )}
    </div>
  );
}
