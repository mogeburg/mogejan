import styles from "@/components/InfoPanel.module.scss";
import { TileImage } from "@/components/TileImage";
import {
  getTileColor,
  TREND_COPIES,
  TREND_TILE_START,
} from "@/constants/tiles";

const WIND_LABELS = ["東", "南"];

interface InfoPanelProps {
  round: number;
  kyoku: number;
  honba: number;
  doraTile: number | null;
  uradoraTile: number | null;
  trendTypes: number[];
  showAllTiles: boolean;
  winner: number | null;
  riichi: boolean[];
  ponMelds: number[][][];
  focusedTileColor?: number | null;
}

export function InfoPanel({
  round,
  kyoku,
  honba,
  doraTile,
  uradoraTile,
  trendTypes,
  showAllTiles,
  winner,
  riichi,
  ponMelds,
  focusedTileColor,
}: InfoPanelProps) {
  const showUradora =
    showAllTiles ||
    (winner != null && riichi[winner] && ponMelds[winner].length === 0);

  return (
    <div className={styles.container}>
      <div className={styles.roundRow}>
        <span className={styles.roundLabel}>{WIND_LABELS[round]}</span>
        <span className={styles.kyokuLabel}>{kyoku + 1}局</span>
        {honba > 0 && <span className={styles.honbaLabel}>{honba}本場</span>}
      </div>
      <div className={styles.tileSections}>
        {(doraTile != null || uradoraTile != null) && (
          <div className={styles.section}>
            <span className={styles.label}>ドラ</span>
            <div className={styles.tileRow}>
              {doraTile != null && (
                <TileImage
                  id={doraTile}
                  size="small"
                  shine
                  blueOverlay={
                    focusedTileColor != null &&
                    getTileColor(doraTile) === focusedTileColor
                  }
                />
              )}
              {uradoraTile != null && (
                <TileImage
                  id={uradoraTile}
                  size="small"
                  faceDown={!showUradora}
                />
              )}
            </div>
          </div>
        )}
        {trendTypes.length > 0 && (
          <div className={styles.section}>
            <span className={styles.label}>流行</span>
            <div className={styles.tileRow}>
              {trendTypes.map((trendType) => (
                <TileImage
                  key={trendType}
                  id={TREND_TILE_START + trendType * TREND_COPIES}
                  size="small"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
