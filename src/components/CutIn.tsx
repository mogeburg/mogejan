import styles from "@/components/CutIn.module.scss";
import {
  LightningEffect,
  type LightningPoint,
} from "@/components/LightningEffect";
import {
  getAnchorPoint,
  getGameCenter,
  isPortraitGameSize,
  type GameSize,
  type LayoutAnchor,
  type LayoutBox,
} from "@/constants/layout";
import { useGameStore, type CutinPreview } from "@/store";
import { cutinImageUrl as getCutinImageUrl, seAudioUrl } from "@/utils/assets";
import { playSe, stopBgm } from "@/utils/audio";
import { useEffect, useState } from "react";

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

type OffsetAxisValue = number | `${number}%`;

type EdgeOffsetValue =
  | OffsetAxisValue
  | {
      portrait?: OffsetAxisValue;
      landscape?: OffsetAxisValue;
    };

type EdgeOffset = {
  x: EdgeOffsetValue;
  y: EdgeOffsetValue;
};

const PLAYER_EDGE_ANCHOR_MAP: Record<number, LayoutAnchor> = {
  0: "bottom-center",
  1: "middle-left",
  2: "top-center",
  3: "middle-right",
};

const PLAYER_EDGE_OFFSET_MAP: Record<number, EdgeOffset> = {
  0: {
    x: "25%",
    y: 10,
  },
  1: {
    x: -10,
    y: "25%",
  },
  2: {
    x: "-25%",
    y: -10,
  },
  3: {
    x: 10,
    y: "-25%",
  },
};

function resolveAxisOffset(
  value: EdgeOffsetValue,
  axisSize: number,
  isPortrait: boolean,
): number {
  const resolvedValue =
    typeof value === "object"
      ? ((isPortrait ? value.portrait : value.landscape) ??
        value.landscape ??
        value.portrait ??
        0)
      : value;

  if (typeof resolvedValue === "string" && resolvedValue.endsWith("%")) {
    return (Number.parseFloat(resolvedValue) / 100) * axisSize;
  }

  if (typeof resolvedValue === "string") {
    return Number.parseFloat(resolvedValue) || 0;
  }

  return resolvedValue;
}

function getPlayerEdgeAnchor(
  playerIndex: number,
  layoutBox: LayoutBox,
  referenceGameSize: GameSize,
): LightningPoint {
  const anchorPoint = getAnchorPoint(
    PLAYER_EDGE_ANCHOR_MAP[playerIndex] ?? "bottom-center",
    layoutBox,
  );
  const offset = PLAYER_EDGE_OFFSET_MAP[playerIndex] ?? { x: 0, y: 0 };
  const isPortrait = isPortraitGameSize(referenceGameSize);
  return {
    x:
      anchorPoint.x +
      resolveAxisOffset(offset.x, referenceGameSize.width, isPortrait),
    y:
      anchorPoint.y +
      resolveAxisOffset(offset.y, referenceGameSize.height, isPortrait),
  };
}

function buildRonMidpoint(
  fromPlayer: number,
  toPlayer: number,
  layoutBox: LayoutBox,
  referenceGameSize: GameSize,
): LightningPoint {
  const center = getGameCenter(layoutBox);
  const pairSeed = fromPlayer * 10 + toPlayer;
  const jitterXBase = pairSeed % 2 === 0 ? -32 : 32;
  const jitterYBase = pairSeed % 3 === 0 ? -24 : 24;
  return {
    x: center.x + (jitterXBase / referenceGameSize.width) * layoutBox.width,
    y: center.y + (jitterYBase / referenceGameSize.height) * layoutBox.height,
  };
}

function buildTsumoMidpoint(
  start: LightningPoint,
  end: LightningPoint,
  layoutBox: LayoutBox,
  referenceGameSize: GameSize,
  fromPlayer: number,
  toPlayer: number,
): LightningPoint {
  const center = getGameCenter(layoutBox);
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
      (jitterXBase / referenceGameSize.width) * layoutBox.width,
    y:
      midpoint.y * (1 - centerPull) +
      center.y * centerPull +
      (jitterYBase / referenceGameSize.height) * layoutBox.height,
  };
}

function buildLightningSegments(
  winner: number | null,
  isRon: boolean,
  ronTarget: number | null,
  layoutBox: LayoutBox,
  cutinPreview: CutinPreview | null,
  referenceGameSize: GameSize,
): LightningSegment[] {
  if (cutinPreview != null) {
    const start = getPlayerEdgeAnchor(
      cutinPreview.sourcePlayer,
      layoutBox,
      referenceGameSize,
    );
    const targetPlayers = cutinPreview.isRon
      ? [cutinPreview.targetPlayer]
      : [0, 1, 2, 3].filter(
          (playerIndex) => playerIndex !== cutinPreview.sourcePlayer,
        );

    return targetPlayers.map((targetPlayer) => {
      const end = getPlayerEdgeAnchor(
        targetPlayer,
        layoutBox,
        referenceGameSize,
      );
      return {
        start,
        mid: cutinPreview.isRon
          ? buildRonMidpoint(
              cutinPreview.sourcePlayer,
              targetPlayer,
              layoutBox,
              referenceGameSize,
            )
          : buildTsumoMidpoint(
              start,
              end,
              layoutBox,
              referenceGameSize,
              cutinPreview.sourcePlayer,
              targetPlayer,
            ),
        end,
      };
    });
  }

  if (winner == null) return [];

  const start = getPlayerEdgeAnchor(winner, layoutBox, referenceGameSize);
  const targetPlayers = isRon
    ? ronTarget != null
      ? [ronTarget]
      : []
    : [0, 1, 2, 3].filter((playerIndex) => playerIndex !== winner);

  return targetPlayers.map((targetPlayer) => {
    const end = getPlayerEdgeAnchor(targetPlayer, layoutBox, referenceGameSize);
    return {
      start,
      mid: isRon
        ? buildRonMidpoint(winner, targetPlayer, layoutBox, referenceGameSize)
        : buildTsumoMidpoint(
            start,
            end,
            layoutBox,
            referenceGameSize,
            winner,
            targetPlayer,
          ),
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
  const referenceGameSize = useGameStore((s) => s.gameSize);
  const lightweightMode = useGameStore((s) => s.lightweightMode);
  const [show, setShow] = useState(false);
  const [imageFallback, setImageFallback] = useState(false);
  const isPortrait = isPortraitGameSize(referenceGameSize);
  const layoutBox: LayoutBox = {
    left: 0,
    top: 0,
    width: referenceGameSize.width,
    height: referenceGameSize.height,
  };

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
          referenceGameSize,
        )
      : [];

  return (
    <div
      onClick={hideCutin}
      className={`${styles.overlay} ${cutinType === "ryuukyoku" ? styles.overlayDark : ""}`}
    >
      {lightningSegments.map((segment, index) => (
        <LightningEffect
          key={`${winner ?? "none"}-${isRon ? "ron" : "tsumo"}-${index}`}
          start={segment.start}
          mid={segment.mid}
          end={segment.end}
          viewportSize={referenceGameSize}
          durationMs={LIGHTNING_DISPLAY_DURATION_MS}
          growDurationMs={LIGHTNING_GROW_DURATION_MS}
          lightweightMode={lightweightMode}
        />
      ))}
      {show && cutinType !== "ryuukyoku" && imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className={`${styles.image} ${isPortrait ? styles.imagePortrait : ""}`}
          onError={() => {
            if (!imageFallback && cutinImageVariant !== "normal") {
              setImageFallback(true);
            }
          }}
        />
      )}
      {show && (
        <div
          className={`${styles.text} ${isPortrait && cutinType !== "ryuukyoku" ? styles.textPortrait : ""} ${cutinType === "ryuukyoku" ? styles.textCenter : ""} ${TEXT_STYLE_MAP[cutinType]} ${lightweightMode && cutinType === "epic" ? styles.textEpicLite : ""}`}
        >
          {cutin}
        </div>
      )}
    </div>
  );
}
