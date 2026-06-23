import type { CpuPersonality } from "@/ai/CpuController";
import type { AbilityId } from "@/constants/abilities";
import styles from "@/components/CenterInfo.module.scss";
import { PlayerInfo } from "@/components/PlayerInfo";
import type { Player } from "@/store";

const ABILITY_BADGE_LABELS: Partial<Record<AbilityId, string>> = {
  aimoge: "監視中",
  pikasan: "そうだね",
  siran: "知らん",
};

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
  specialAbilitiesEnabled: boolean;
  abilityGauge: number[];
  abilityReady: boolean[];
  abilityChargeLocked: boolean[];
  abilityIds: (AbilityId | null)[];
  miimogeActive: boolean;
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
  specialAbilitiesEnabled,
  abilityGauge,
  abilityReady,
  abilityChargeLocked,
  abilityIds,
  miimogeActive,
  cpuPersonalities = [],
}: CenterInfoProps) {
  const getPlayerBubbles = (playerIndex: number) =>
    speechBubbles.filter((b) => b.playerIndex === playerIndex);
  const wallCountText = String(Math.max(0, wallLength)).padStart(2, "0");

  const ability = (i: number) => {
    const id = abilityIds[i];
    return {
      abilityActivated: abilityChargeLocked[i] && id != null,
      abilityLabel: abilityChargeLocked[i] && id != null
        ? (ABILITY_BADGE_LABELS[id] ?? null)
        : null,
      restrictionBadge:
        miimogeActive && id !== "miimoge" ? "5役制限" : null,
    };
  };

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
          specialAbilitiesEnabled={specialAbilitiesEnabled}
          abilityGauge={abilityGauge[2]}
          abilityReady={abilityReady[2]}
          abilityActivated={ability(2).abilityActivated}
          abilityLabel={ability(2).abilityLabel}
          restrictionBadge={ability(2).restrictionBadge}
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
          isMenzen={riichi[1] && ponMelds[1].length === 0}
          isDoubleReach={doubleReach[1]}
          speechBubbles={getPlayerBubbles(1)}
          specialAbilitiesEnabled={specialAbilitiesEnabled}
          abilityGauge={abilityGauge[1]}
          abilityReady={abilityReady[1]}
          abilityActivated={ability(1).abilityActivated}
          abilityLabel={ability(1).abilityLabel}
          restrictionBadge={ability(1).restrictionBadge}
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
          isMenzen={riichi[3] && ponMelds[3].length === 0}
          isDoubleReach={doubleReach[3]}
          speechBubbles={getPlayerBubbles(3)}
          specialAbilitiesEnabled={specialAbilitiesEnabled}
          abilityGauge={abilityGauge[3]}
          abilityReady={abilityReady[3]}
          abilityActivated={ability(3).abilityActivated}
          abilityLabel={ability(3).abilityLabel}
          restrictionBadge={ability(3).restrictionBadge}
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
          isMenzen={riichi[0] && ponMelds[0].length === 0}
          isDoubleReach={doubleReach[0]}
          speechBubbles={getPlayerBubbles(0)}
          specialAbilitiesEnabled={specialAbilitiesEnabled}
          abilityGauge={abilityGauge[0]}
          abilityReady={abilityReady[0]}
          abilityActivated={ability(0).abilityActivated}
          abilityLabel={ability(0).abilityLabel}
          restrictionBadge={ability(0).restrictionBadge}
          cpuPersonality={cpuPersonalities[0]}
        />
      </div>
      <div className={styles.centerBox}>
        <div className={styles.infoCard}>
          <div className={styles.infoMain}>
            <div className={styles.infoText}>
              <span className={styles.wallLabel}>あと</span>
              <span className={styles.wallCount}>{wallCountText}</span>
              <span className={styles.wallUnit}>枚</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
