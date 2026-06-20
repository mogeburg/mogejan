import { Button } from "@/components/Button";
import styles from "@/components/PlayerRow.module.scss";
import { TileImage } from "@/components/TileImage";
import { getTileColor, isDoraLikeTile } from "@/constants/tiles";
import type { Player } from "@/store";
import { useGameStore } from "@/store";
import { motion } from "framer-motion";

export type ActionLabel = "キャンセル" | "リーチ" | "ポン" | "ロン" | "ツモ";

const ACTION_BUTTONS: ActionLabel[] = [
  "キャンセル",
  "リーチ",
  "ポン",
  "ロン",
  "ツモ",
];

const ACTION_COLOR_MAP: Record<
  ActionLabel,
  "normal" | "primary" | "secondary" | "tertiary"
> = {
  ツモ: "primary",
  ロン: "primary",
  リーチ: "primary",
  ポン: "secondary",
  キャンセル: "tertiary",
};

interface PlayerRowProps {
  player: Player;
  index: number;
  isTurn: boolean;
  hand: number[];
  drawnTile: number | null;
  ponMelds: number[][];
  playerDiscards: number[];
  lastDiscardTileId: number | null;
  riichiDiscardPosition: number | null;
  takenDiscards: boolean[];
  canDiscard: boolean;
  canRon: boolean;
  canPon: boolean;
  canRiichi: boolean;
  canTsumo: boolean;
  faceDown: boolean;
  manualCpu: boolean;
  onDiscard: (id: number) => void;
  onAction: (label: ActionLabel, playerIndex: number) => void;
  doraTile: number | null;
  focusedTileColor?: number | null;
  onTileFocus?: (tileId: number) => void;
  onTileBlur?: () => void;
}

function isActionShow({
  label,
  isTurn,
  canRon,
  canPon,
  canRiichi,
  canTsumo,
}: {
  label: ActionLabel;
  isTurn: boolean;
  canRon: boolean;
  canPon: boolean;
  canRiichi: boolean;
  canTsumo: boolean;
}) {
  if (label === "ロン") return canRon;
  if (label === "キャンセル" || label === "ポン") return canPon;
  if (!isTurn) return false;
  if (label === "リーチ") return canRiichi;
  if (label === "ツモ") return canTsumo;
  return false;
}

function isActionDisabled(label: ActionLabel) {
  const aa = useGameStore.getState().autoActions;
  if (label === "ツモ" || label === "ロン") return aa.ronTsumo;
  if (label === "ポン" || label === "キャンセル") return aa.pon || aa.cancel;
  if (label === "リーチ") return aa.riichi;
  return false;
}

export function PlayerRow({
  player,
  index,
  isTurn,
  hand,
  drawnTile,
  ponMelds,
  playerDiscards,
  lastDiscardTileId,
  riichiDiscardPosition,
  takenDiscards,
  canDiscard,
  canRon,
  canPon,
  canRiichi,
  canTsumo,
  faceDown,
  manualCpu,
  onDiscard,
  onAction,
  doraTile,
  focusedTileColor,
  onTileFocus,
  onTileBlur,
}: PlayerRowProps) {
  const YELLOW_GLOW = "0 0 0 2px #ffd700, 0 0 8px 3px rgba(255,215,0,0.35)";
  const tileSize = index === 0 ? "normal" : "small";

  const HIGHLIGHT_SIDE_MAP = ["top", "right", "bottom", "left"] as const;
  const highlightSide = HIGHLIGHT_SIDE_MAP[index];
  const riichiHighlightSide = HIGHLIGHT_SIDE_MAP[(index + 3) % 4];

  const isDoraTile = (id: number) =>
    doraTile != null && isDoraLikeTile(id, doraTile);
  const isFocusedColor = (id: number) =>
    focusedTileColor != null && getTileColor(id) === focusedTileColor;
  return (
    <div className={styles.container}>
      {(player.type === "human" || manualCpu) && (
        <div className={styles.actionRow}>
          {ACTION_BUTTONS.filter((label) =>
            isActionShow({
              label,
              isTurn,
              canRon,
              canPon,
              canRiichi,
              canTsumo,
            }),
          ).map((label) => (
            <Button
              key={label}
              label={label}
              color={ACTION_COLOR_MAP[label]}
              disabled={isActionDisabled(label)}
              onClick={() => onAction(label, index)}
            />
          ))}
        </div>
      )}
      <div className={styles.handArea}>
        <div className={styles.handInner}>
          <div className={styles.handTiles}>
            {hand.map((id, handIndex) => (
              <motion.div
                key={`${id}-${handIndex}`}
                whileHover={canDiscard ? { y: -4 } : undefined}
                transition={{ duration: 0.03 }}
                onMouseEnter={() => onTileFocus?.(id)}
                onMouseLeave={onTileBlur}
              >
                <TileImage
                  id={id}
                  size={tileSize}
                  faceDown={faceDown}
                  highlightSide={highlightSide}
                  onClick={canDiscard ? () => onDiscard(id) : undefined}
                  shine={!faceDown && isDoraTile(id)}
                />
              </motion.div>
            ))}
            {isTurn && drawnTile != null && (
              <div className={styles.drawnTileGap}>
                <motion.div
                  whileHover={canDiscard ? { y: -4 } : undefined}
                  transition={{ duration: 0.03 }}
                  onMouseEnter={() => onTileFocus?.(drawnTile)}
                  onMouseLeave={onTileBlur}
                >
                  <TileImage
                    id={drawnTile}
                    size={tileSize}
                    faceDown={faceDown}
                    highlightSide={highlightSide}
                    onClick={
                      canDiscard ? () => onDiscard(drawnTile) : undefined
                    }
                    shine={!faceDown && isDoraTile(drawnTile)}
                  />
                </motion.div>
              </div>
            )}
          </div>
          {ponMelds.length > 0 && (
            <div className={styles.ponArea}>
              {ponMelds.map((meld, mi) => (
                <div key={mi} className={styles.ponMeld}>
                  {meld.map((id, tileIndex) => (
                    <TileImage
                      key={`${mi}-${id}-${tileIndex}`}
                      id={id}
                      size={tileSize}
                      highlightSide={highlightSide}
                      blueOverlay={isFocusedColor(id)}
                      shine={isDoraTile(id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.discardArea}>
        {playerDiscards.map((id, j) => (
          <TileImage
            key={`${id}-${j}`}
            id={id}
            size="small"
            highlightSide={
              riichiDiscardPosition === j ? riichiHighlightSide : highlightSide
            }
            glow={
              lastDiscardTileId != null &&
              id === lastDiscardTileId &&
              j === playerDiscards.length - 1
                ? YELLOW_GLOW
                : undefined
            }
            blueOverlay={isFocusedColor(id)}
            shine={isDoraTile(id)}
            style={{
              ...(riichiDiscardPosition === j
                ? { transform: "rotate(-90deg)" }
                : undefined),
              ...(takenDiscards[j] ? { opacity: 0.35 } : undefined),
            }}
          />
        ))}
      </div>
    </div>
  );
}
