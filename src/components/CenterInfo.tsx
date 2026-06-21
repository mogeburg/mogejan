import type { CpuPersonality } from "@/ai/CpuController";
import styles from "@/components/CenterInfo.module.scss";
import { PlayerInfo } from "@/components/PlayerInfo";
import type { Player } from "@/store";

interface CenterInfoProps {
  players: Player[];
  turnIndex: number;
  parentIndex: number;
  riichi: boolean[];
  ippatsu: boolean[];
  doubleReach: boolean[];
  ponMelds: number[][][];
  wallLength: number;
  speechBubbles: { id: number; text: string; playerIndex: number }[];
  cpuPersonalities?: (CpuPersonality | null)[];
}

export function CenterInfo({
  players,
  turnIndex,
  parentIndex,
  riichi,
  ippatsu,
  doubleReach,
  ponMelds,
  wallLength,
  speechBubbles,
  cpuPersonalities = [],
}: CenterInfoProps) {
  const getPlayerBubbles = (playerIndex: number) =>
    speechBubbles.filter((b) => b.playerIndex === playerIndex);
  return (
    <div className={styles.container}>
      <div className={styles.cpuTop}>
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
      <div className={styles.cpuLeft}>
        <PlayerInfo
          player={players[1]}
          isTurn={turnIndex === 1}
          isParent={parentIndex === 1}
          isRiichi={riichi[1]}
          isIppatsu={ippatsu[1]}
          isMenzen={riichi[1]}
          isDoubleReach={doubleReach[1]}
          speechBubbles={getPlayerBubbles(1)}
          cpuPersonality={cpuPersonalities[1]}
          badgeSide="left"
          badgeLayout="side"
        />
      </div>
      <div className={styles.cpuRight}>
        <PlayerInfo
          player={players[3]}
          isTurn={turnIndex === 3}
          isParent={parentIndex === 3}
          isRiichi={riichi[3]}
          isIppatsu={ippatsu[3]}
          isMenzen={riichi[3]}
          isDoubleReach={doubleReach[3]}
          speechBubbles={getPlayerBubbles(3)}
          cpuPersonality={cpuPersonalities[3]}
          badgeLayout="side"
        />
      </div>
      <div className={styles.playerBottom}>
        <PlayerInfo
          player={players[0]}
          isTurn={turnIndex === 0}
          isParent={parentIndex === 0}
          isRiichi={riichi[0]}
          isIppatsu={ippatsu[0]}
          isMenzen={riichi[0]}
          isDoubleReach={doubleReach[0]}
          speechBubbles={getPlayerBubbles(0)}
          cpuPersonality={cpuPersonalities[0]}
        />
      </div>
      <div className={styles.centerBox}>
        <div className={styles.infoCard}>
          <div className={styles.infoMain}>
            <div className={styles.infoText}>
              <span className={styles.wallLabel}>あと</span>
              <span className={styles.wallCount}>{wallLength}</span>
              <span className={styles.wallUnit}>枚</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
