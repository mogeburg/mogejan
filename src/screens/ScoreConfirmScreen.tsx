import { useEffect, useMemo } from "react";
import { ScoreBoard } from "@/components/ScoreBoard";
import { useGameStore } from "@/store";
import { useScoreConfirmStore } from "@/storeSelectors";
import {
  confirmCurrentRound,
  getPendingScoreDeltas,
  type RoundResolutionSnapshot,
} from "@/utils/roundResolution";
import { getSimulationTransitionDelay } from "@/utils/simulation";

export function ScoreConfirmScreen() {
  const speed = useGameStore((s) => s.speed);
  const {
    players,
    parentIndex,
    round,
    kyoku,
    honba,
    ryuukyoku,
    winner,
    riichi,
    doubleReach,
    ippatsu,
    drawnTile,
    doraTile,
    uradoraTile,
    trendTypes,
    hands,
    ponMelds,
    simulationMode,
    isRon,
    ronTarget,
    discards,
  } = useScoreConfirmStore();

  const snapshot: RoundResolutionSnapshot = {
    players,
    parentIndex,
    ryuukyoku,
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

  const pendingDeltas = useMemo(
    () => getPendingScoreDeltas(snapshot),
    [snapshot],
  );

  function handleConfirm() {
    confirmCurrentRound();
  }

  useEffect(() => {
    if (!simulationMode) return;
    const timer = setTimeout(handleConfirm, getSimulationTransitionDelay(speed));
    return () => clearTimeout(timer);
  }, [simulationMode, handleConfirm, speed]);

  const isFinalRound = round === 1 && kyoku === 3;
  const parentMoves = winner !== parentIndex || ryuukyoku;
  const willAnyLose = pendingDeltas.some((d, i) => players[i].score + d <= 0);

  return (
    <ScoreBoard
      players={players}
      parentIndex={parentIndex}
      round={round}
      kyoku={kyoku}
      honba={honba}
      scoreDeltas={pendingDeltas}
      onConfirm={handleConfirm}
      buttonLabel={willAnyLose || (isFinalRound && parentMoves) ? "結果確認へ" : undefined}
    />
  );
}
