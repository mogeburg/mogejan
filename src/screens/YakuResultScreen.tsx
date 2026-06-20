import { useEffect, useMemo } from "react";
import { Button } from "@/components/Button";
import { ModalCard } from "@/components/ModalCard";
import { TileImage } from "@/components/TileImage";
import { BGM } from "@/constants/game";
import { useGameStore } from "@/store";
import { useYakuResultStore } from "@/storeSelectors";
import { useBgm } from "@/utils/audio";
import { TREND_TILE_START, TREND_COPIES } from "@/constants/tiles";
import { buildWinnerTiles, canShowUradora, evaluateWinner, type WinEvaluationContext } from "@/utils/winResult";
import { yakuRankName } from "@/utils/score";
import { getSimulationResultDelay } from "@/utils/simulation";
import styles from "@/screens/YakuResultScreen.module.scss";

export function YakuResultScreen() {
  const speed = useGameStore((s) => s.speed);
  const {
    players,
    winner,
    riichi,
    doubleReach,
    ippatsu,
    isRon,
    ronTarget,
    discards,
    drawnTile,
    doraTile,
    uradoraTile,
    trendTypes,
    hands,
    ponMelds,
    goTo,
    addYakuCounts,
    simulationMode,
  } = useYakuResultStore();

  useBgm(BGM.win.path);

  const winContext: WinEvaluationContext = {
    players,
    winner,
    riichi,
    doubleReach,
    ippatsu,
    isRon,
    ronTarget,
    discards,
    drawnTile,
    doraTile,
    uradoraTile,
    trendTypes,
    hands,
    ponMelds,
  };

  const allTiles = buildWinnerTiles(winContext);
  const yaku = evaluateWinner(winContext);

  const totalYaku = useMemo(() => yaku.reduce((s, y) => s + y.yaku, 0), [yaku]);

  const rankName = useMemo(() => yakuRankName(totalYaku), [totalYaku]);

  function handleConfirm() {
    addYakuCounts(yaku);
    goTo("scoreConfirm");
  }

  useEffect(() => {
    if (!simulationMode) return;
    const timer = setTimeout(handleConfirm, getSimulationResultDelay(speed));
    return () => clearTimeout(timer);
  }, [simulationMode, handleConfirm, speed]);

  return (
    <ModalCard className={styles.modalCard} style={{ minWidth: 360, maxWidth: 500 }}>
      {winner != null && (
        <div className={styles.winnerRow}>
          <div
            className={styles.winnerAvatar}
            style={{
              backgroundImage: `url(${players[winner].imageUrl})`,
              backgroundColor: players[winner].colorHex,
            }}
          />
          <span className={styles.winnerName}>{players[winner].name}</span>
        </div>
      )}
      <div className={styles.tileRow}>
        {allTiles.map((id, i) => (
          <TileImage
            key={`${id}-${i}`}
            id={id}
            size="small"
            style={i === allTiles.length - 1 ? { marginLeft: 8 } : undefined}
          />
        ))}
      </div>
      <div className={styles.infoRow}>
        {doraTile != null && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>ドラ</span>
            <div className={styles.infoTiles}>
              <TileImage id={doraTile} size="mini" />
            </div>
          </div>
        )}
        {winContext.uradoraTile != null && canShowUradora(winContext) && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>裏ドラ</span>
            <div className={styles.infoTiles}>
              <TileImage id={winContext.uradoraTile} size="mini" />
            </div>
          </div>
        )}
        {trendTypes.length > 0 && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>流行牌</span>
            <div className={styles.infoTiles}>
              {trendTypes.map((t) => (
                <TileImage key={t} id={TREND_TILE_START + t * TREND_COPIES} size="mini" />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={styles.yakuList}>
        <div className={styles.yakuRows}>
          {yaku.map((y, i) => (
            <div
              key={i}
              className={`${styles.yakuRow} ${i % 2 === 0 ? styles.yakuRowAlt : ""}`}
            >
              <span className={styles.yakuName}>{y.name}</span>
              <span className={styles.yakuValue}>{y.yaku}役</span>
            </div>
          ))}
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{rankName ?? ""}</span>
          <span className={styles.totalValue}>{totalYaku}役</span>
        </div>
      </div>
      <Button
        label="次へ"
        color="primary"
        size="large"
        onClick={(e) => {
          e.stopPropagation();
          handleConfirm();
        }}
      />
    </ModalCard>
  );
}
