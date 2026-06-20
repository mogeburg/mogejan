import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/store";

export function useGameScreenStore() {
  return useGameStore(
    useShallow((state) => ({
      players: state.players,
      hands: state.hands,
      deal: state.deal,
      turnIndex: state.turnIndex,
      parentIndex: state.parentIndex,
      round: state.round,
      kyoku: state.kyoku,
      honba: state.honba,
      drawnTile: state.drawnTile,
      discards: state.discards,
      discard: state.discard,
      speed: state.speed,
      cpuStrength: state.cpuStrength,
      cpuPersonalities: state.cpuPersonalities,
      wall: state.wall,
      riichi: state.riichi,
      ippatsu: state.ippatsu,
      doubleReach: state.doubleReach,
      riichiDiscardPositions: state.riichiDiscardPositions,
      pendingPon: state.pendingPon,
      lastDiscard: state.lastDiscard,
      cancelPon: state.cancelPon,
      ponMelds: state.ponMelds,
      takenDiscards: state.takenDiscards,
      pendingRon: state.pendingRon,
      showAllTiles: state.debugFlags.showAllTiles,
      alwaysTsumogiri: state.debugFlags.alwaysTsumogiri,
      manualCpu: state.debugFlags.manualCpu,
      autoActions: state.autoActions,
      doraTile: state.doraTile,
      uradoraTile: state.uradoraTile,
      trendTypes: state.trendTypes,
      normalBgmSetting: state.normalBgmSetting,
      riichiBgmSetting: state.riichiBgmSetting,
      speechBubbles: state.speechBubbles,
      winner: state.winner,
      ryuukyoku: state.ryuukyoku,
      riichiAvatar: state.riichiAvatar,
    })),
  );
}

export function useScoreConfirmStore() {
  return useGameStore(
    useShallow((state) => ({
      players: state.players,
      parentIndex: state.parentIndex,
      round: state.round,
      kyoku: state.kyoku,
      honba: state.honba,
      ryuukyoku: state.ryuukyoku,
      winner: state.winner,
      riichi: state.riichi,
      doubleReach: state.doubleReach,
      ippatsu: state.ippatsu,
      drawnTile: state.drawnTile,
      doraTile: state.doraTile,
      uradoraTile: state.uradoraTile,
      trendTypes: state.trendTypes,
      hands: state.hands,
      ponMelds: state.ponMelds,
      simulationMode: state.simulationMode,
      isRon: state.isRon,
      ronTarget: state.ronTarget,
      discards: state.discards,
    })),
  );
}

export function useYakuResultStore() {
  return useGameStore(
    useShallow((state) => ({
      players: state.players,
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
      goTo: state.goTo,
      addYakuCounts: state.addYakuCounts,
      simulationMode: state.simulationMode,
    })),
  );
}

export function useScoreDisplayStore() {
  return useGameStore(
    useShallow((state) => ({
      players: state.players,
      parentIndex: state.parentIndex,
      round: state.round,
      kyoku: state.kyoku,
      honba: state.honba,
      goTo: state.goTo,
      deal: state.deal,
      simulationMode: state.simulationMode,
    })),
  );
}

export function useTitleScreenStore() {
  return useGameStore(
    useShallow((state) => ({
      riichiBgmSetting: state.riichiBgmSetting,
      riichiAvatar: state.riichiAvatar,
      simulationMode: state.simulationMode,
      setSimulationMode: state.setSimulationMode,
      initGame: state.initGame,
      startDebugMidgame: state.startDebugMidgame,
    })),
  );
}
