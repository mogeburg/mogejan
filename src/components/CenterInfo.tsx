import type { CpuPersonality } from "@/ai/CpuController";
import styles from "@/components/CenterInfo.module.scss";
import { isPortraitGameSize } from "@/constants/layout";
import { PlayerInfo } from "@/components/PlayerInfo";
import { TileImage } from "@/components/TileImage";
import {
  getTileColor,
  TREND_COPIES,
  TREND_TILE_START,
} from "@/constants/tiles";
import type { Player } from "@/store";
import { useGameStore } from "@/store";

const WIND_LABELS = ["東", "南"];

interface CenterInfoProps {
  players: Player[];
  turnIndex: number;
  parentIndex: number;
  round: number;
  kyoku: number;
  honba: number;
  riichi: boolean[];
  ippatsu: boolean[];
  doubleReach: boolean[];
  ponMelds: number[][][];
  wallLength: number;
  doraTile: number | null;
  uradoraTile: number | null;
  trendTypes: number[];
  showAllTiles: boolean;
  winner: number | null;
  speechBubbles: { id: number; text: string; playerIndex: number }[];
  focusedTileColor?: number | null;
  cpuPersonalities?: (CpuPersonality | null)[];
}

export function CenterInfo({
  players,
  turnIndex,
  parentIndex,
  round,
  kyoku,
  honba,
  riichi,
  ippatsu,
  doubleReach,
  ponMelds,
  wallLength,
  doraTile,
  uradoraTile,
  trendTypes,
  showAllTiles,
  winner,
  speechBubbles,
  focusedTileColor,
  cpuPersonalities = [],
}: CenterInfoProps) {
  const gameSize = useGameStore((s) => s.gameSize);
  const isPortrait = isPortraitGameSize(gameSize);
  const getPlayerBubbles = (playerIndex: number) =>
    speechBubbles.filter((b) => b.playerIndex === playerIndex);
  return (
    <div className={`${styles.container} ${isPortrait ? styles.containerPortrait : ""}`}>
      <div className={`${styles.cpuTop} ${isPortrait ? styles.cpuTopPortrait : ""}`}>
        <PlayerInfo
          player={players[2]}
          isTurn={turnIndex === 2}
          isParent={parentIndex === 2}
          isRiichi={riichi[2]}
          isIppatsu={ippatsu[2]}
          isMenzen={riichi[2] && ponMelds[2].length === 0}
          isDoubleReach={doubleReach[2]}
          speechBubbles={getPlayerBubbles(2)}
          cpuPersonality={cpuPersonalities[2]}
        />
      </div>
      <div className={`${styles.cpuLeft} ${isPortrait ? styles.cpuLeftPortrait : ""}`}>
        <PlayerInfo
          player={players[1]}
          isTurn={turnIndex === 1}
          isParent={parentIndex === 1}
          isRiichi={riichi[1]}
          isIppatsu={ippatsu[1]}
          isMenzen={riichi[1] && ponMelds[1].length === 0}
          isDoubleReach={doubleReach[1]}
          speechBubbles={getPlayerBubbles(1)}
          cpuPersonality={cpuPersonalities[1]}
          badgeSide="left"
        />
      </div>
      <div className={`${styles.cpuRight} ${isPortrait ? styles.cpuRightPortrait : ""}`}>
        <PlayerInfo
          player={players[3]}
          isTurn={turnIndex === 3}
          isParent={parentIndex === 3}
          isRiichi={riichi[3]}
          isIppatsu={ippatsu[3]}
          isMenzen={riichi[3] && ponMelds[3].length === 0}
          isDoubleReach={doubleReach[3]}
          speechBubbles={getPlayerBubbles(3)}
          cpuPersonality={cpuPersonalities[3]}
        />
      </div>
      <div
        className={`${styles.playerBottom} ${isPortrait ? styles.playerBottomPortrait : ""}`}
      >
        <PlayerInfo
          player={players[0]}
          isTurn={turnIndex === 0}
          isParent={parentIndex === 0}
          isRiichi={riichi[0]}
          isIppatsu={ippatsu[0]}
          isMenzen={riichi[0] && ponMelds[0].length === 0}
          isDoubleReach={doubleReach[0]}
          speechBubbles={getPlayerBubbles(0)}
          cpuPersonality={cpuPersonalities[0]}
        />
      </div>
      <div className={styles.centerBox}>
        <div className={`${styles.infoCard} ${isPortrait ? styles.infoCardPortrait : ""}`}>
          <div className={`${styles.infoMain} ${isPortrait ? styles.infoMainPortrait : ""}`}>
            <div className={styles.infoText}>
              <span className={styles.roundLabel}>
                {WIND_LABELS[round]}
                {kyoku + 1}局
                {honba > 0 && (
                  <span className={styles.honbaLabel}>{honba}本場</span>
                )}
              </span>
              <span className={styles.wallLabel}>
                <span className={styles.wallCount}>{wallLength}</span>
              </span>
            </div>
            <div className={styles.tileColumn}>
              {(doraTile != null || uradoraTile != null) && (
                <div className={styles.tileSection}>
                  <span className={styles.tileLabel}>ドラ</span>
                  <div className={styles.doraRow}>
                    {doraTile != null && (
                      <TileImage
                        id={doraTile}
                        size="mini"
                        shine
                        blueOverlay={
                          focusedTileColor != null &&
                          getTileColor(doraTile) === focusedTileColor
                        }
                      />
                    )}
                    {uradoraTile != null && (
                      <div className={styles.doraItem}>
                        <TileImage
                          id={uradoraTile}
                          size="mini"
                          faceDown={
                            !(
                              showAllTiles ||
                              (winner != null &&
                                riichi[winner] &&
                                ponMelds[winner].length === 0)
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {trendTypes.length > 0 && (
                <div className={styles.tileSection}>
                  <span className={styles.tileLabel}>流行</span>
                  <div className={styles.trendRow}>
                    {trendTypes.map((t) => (
                      <TileImage
                        key={t}
                        id={TREND_TILE_START + t * TREND_COPIES}
                        size="mini"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
