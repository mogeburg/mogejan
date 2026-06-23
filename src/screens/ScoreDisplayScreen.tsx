import { useEffect } from "react";
import { ScoreBoard } from "@/components/ScoreBoard";
import { PLAYER_COUNT } from "@/constants/game";
import { useGameStore } from "@/store";
import { useScoreDisplayStore } from "@/storeSelectors";
import { getSimulationTransitionDelay } from "@/utils/simulation";

// スコア表示画面
export function ScoreDisplayScreen() {
  const {
    players,
    specialAbilitiesEnabled,
    parentIndex,
    round,
    kyoku,
    honba,
    goTo,
    deal,
    simulationMode,
  } =
    useScoreDisplayStore();
  const speed = useGameStore((s) => s.speed);

  function handleConfirm() {
    deal();
    goTo("game");
  }

  useEffect(() => {
    if (!simulationMode) return;
    const timer = setTimeout(handleConfirm, getSimulationTransitionDelay(speed));
    return () => clearTimeout(timer);
  }, [simulationMode, handleConfirm, speed]);

  return (
    <ScoreBoard
      players={players}
      parentIndex={parentIndex}
      round={round}
      kyoku={kyoku}
      honba={honba}
      specialAbilitiesEnabled={specialAbilitiesEnabled}
      scoreDeltas={Array(PLAYER_COUNT).fill(0)}
      onConfirm={handleConfirm}
      buttonLabel="次へ"
    />
  );
}
