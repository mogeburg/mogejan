import { useGameStore, type Player } from "@/store";
import { calcScoreDeltas } from "@/utils/score";
import {
  evaluateWinner,
  type WinEvaluationContext,
} from "@/utils/winResult";
import { usePlayStatsStore } from "@/utils/playStats";

function clearRoundAbilityEffects() {
  const state = useGameStore.getState();
  const resetFlags = state.players.map(() => false);
  useGameStore.setState({
    abilityChargeLocked: [...resetFlags],
    abilityCutinActive: false,
    abilityCutinPlayer: null,
    abilityCutinText: "",
    abilityCutinQueue: [],
    pendingRiichiCutin: null,
    pendingWinCutin: null,
    aimogeDangerColors: resetFlags.map(() => [] as number[]),
    pikasanBonusPending: [...resetFlags],
    siranGuardActive: [...resetFlags],
    anokoSubstitutionPending: [...resetFlags],
    burumogePending: [...resetFlags],
    miimogeActive: false,
    otyantiActive: false,
    anemogeSwapResult: resetFlags.map(() => null),
    imoutoVictimIndex: null,
  });
}

export interface RoundResolutionSnapshot {
  players: Player[];
  parentIndex: number;
  ryuukyoku: boolean;
  winner: number | null;
  riichi: boolean[];
  doubleReach: boolean[];
  ippatsu: boolean[];
  isRon: boolean;
  ronTarget: number | null;
  discards: number[][];
  drawnTile: number | null;
  doraTile: number | null;
  uradoraTile: number | null;
  trendTypes: number[];
  hands: number[][];
  ponMelds: number[][][];
  pikasanBonusPending: boolean[];
  siranGuardActive: boolean[];
  anokoSubstitutionPending: boolean[];
}

export function buildWinContext(
  snapshot: RoundResolutionSnapshot,
): WinEvaluationContext {
  return {
    players: snapshot.players,
    winner: snapshot.winner,
    riichi: snapshot.riichi,
    doubleReach: snapshot.doubleReach,
    ippatsu: snapshot.ippatsu,
    isRon: snapshot.isRon,
    ronTarget: snapshot.ronTarget,
    discards: snapshot.discards,
    drawnTile: snapshot.drawnTile,
    doraTile: snapshot.doraTile,
    uradoraTile: snapshot.uradoraTile,
    trendTypes: snapshot.trendTypes,
    hands: snapshot.hands,
    ponMelds: snapshot.ponMelds,
    pikasanBonusPending: snapshot.pikasanBonusPending,
    siranGuardActive: snapshot.siranGuardActive,
    anokoSubstitutionPending: snapshot.anokoSubstitutionPending,
  };
}

export function getPendingScoreDeltas(
  snapshot: RoundResolutionSnapshot,
): number[] {
  return calcScoreDeltas({
    ryuukyoku: snapshot.ryuukyoku,
    winner: snapshot.winner,
    yaku: evaluateWinner(buildWinContext(snapshot)),
    players: snapshot.players,
    parentIndex: snapshot.parentIndex,
    isRon: snapshot.isRon,
    ronTarget: snapshot.ronTarget,
    siranGuardActive: snapshot.siranGuardActive,
  });
}

export function confirmCurrentRound() {
  const state = useGameStore.getState();

  if (state.ryuukyoku) {
    usePlayStatsStore.getState().recordRyuukyoku();
    clearRoundAbilityEffects();
    state.moveParent();
    useGameStore.setState({ ryuukyoku: false });
    state.goTo(useGameStore.getState().gameOver ? "gameResult" : "scoreDisplay");
    return;
  }

  if (state.winner == null) return;

  const snapshot: RoundResolutionSnapshot = {
    players: state.players,
    parentIndex: state.parentIndex,
    ryuukyoku: state.ryuukyoku,
    winner: state.winner,
    riichi: state.riichi,
    doubleReach: state.doubleReach,
    ippatsu: state.ippatsu,
    isRon: state.isRon,
    ronTarget: state.ronTarget,
    discards: state.discards,
    drawnTile: state.drawnTile,
    doraTile: state.doraTile,
    uradoraTile: state.uradoraTile,
    trendTypes: state.trendTypes,
    hands: state.hands,
    ponMelds: state.ponMelds,
    pikasanBonusPending: state.pikasanBonusPending,
    siranGuardActive: state.siranGuardActive,
    anokoSubstitutionPending: state.anokoSubstitutionPending,
  };

  const yaku = evaluateWinner(buildWinContext(snapshot));
  const deltas = getPendingScoreDeltas(snapshot);
  const totalYaku = yaku.reduce((sum, entry) => sum + entry.yaku, 0);
  const totalScore = Math.max(0, deltas.reduce((sum, delta) => sum + Math.max(0, delta), 0));
  const tsumoCount = state.currentDealWallLength - state.wall.length;

  if (state.winner != null) {
    const winnerGain = Math.max(0, deltas[state.winner] ?? 0);
    if (winnerGain > 0) {
      state.chargeAbility(state.winner, state.isRon ? "ron" : "tsumo", winnerGain);
    }
  }

  deltas.forEach((delta, index) => {
    if (delta < 0) {
      state.chargeAbility(index, "damaged", Math.abs(delta));
    }
  });

  usePlayStatsStore.getState().recordWin({
    isRon: state.isRon,
    totalYaku,
    totalScore,
    tsumoCount,
  });

  state.players.forEach((player, index) => {
    if (deltas[index] !== 0) {
      state.updateScore(index, player.score + deltas[index]);
    }
  });

  useGameStore.setState({ scoreDeltas: deltas });
  clearRoundAbilityEffects();

  const anyLoser = useGameStore.getState().players.some((player) => player.score <= 0);
  if (anyLoser) {
    useGameStore.setState({ gameOver: true });
  }

  if (state.winner !== state.parentIndex) {
    state.moveParent();
  } else {
    state.incrementHonba();
  }

  state.clearWinner();
  state.goTo(useGameStore.getState().gameOver ? "gameResult" : "scoreDisplay");
}
