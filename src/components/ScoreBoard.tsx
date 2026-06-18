import type { Player } from "@/store";
import { AvatarIcon } from "@/components/AvatarIcon";
import { Button } from "@/components/Button";
import { ModalCard } from "@/components/ModalCard";
import styles from "@/components/ScoreBoard.module.scss";

const WIND_LABELS = ["東", "南"];

export function ScoreBoard({
  players,
  parentIndex,
  round,
  kyoku,
  honba,
  scoreDeltas,
  onConfirm,
  buttonLabel = "次へ",
}: {
  players: Player[];
  parentIndex: number;
  round: number;
  kyoku: number;
  honba: number;
  scoreDeltas: number[];
  onConfirm: () => void;
  buttonLabel?: string;
}) {
  return (
    <ModalCard style={{ minWidth: 400 }}>
      <div className={styles.roundTitle}>
        {WIND_LABELS[round]}{kyoku + 1}局{honba > 0 ? ` ${honba}本場` : ""}
      </div>
      <div className={styles.playerList}>
        {players.map((p, i) => (
          <div key={i} className={styles.playerRow}>
            <div className={styles.playerLeft}>
              <AvatarIcon
                imageUrl={p.imageUrl}
                colorHex={p.colorHex}
                size={32}
                border="2px solid #000"
                crown={parentIndex === i}
                crownSize={24}
              />
              <span className={styles.playerName}>
                {p.name}
              </span>
            </div>
            <div className={styles.playerRight}>
              <span className={styles.playerScore}>
                {p.score}
              </span>
              {scoreDeltas[i] !== 0 && (
                <span
                  className={`${styles.scoreDelta} ${scoreDeltas[i] > 0 ? styles.scoreDeltaPositive : styles.scoreDeltaNegative}`}
                >
                  {scoreDeltas[i] > 0 ? "+" : ""}
                  {scoreDeltas[i]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.buttonRow}>
        <Button
          label={buttonLabel}
          color="primary"
          size="large"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        />
      </div>
    </ModalCard>
  );
}
