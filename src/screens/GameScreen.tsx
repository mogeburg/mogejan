import {
  cpuDiscard,
  cpuHandlePon,
  getCpuDelay,
  getEligiblePonPlayers,
} from "@/ai/CpuController";
import { AutoActionToggle } from "@/components/AutoActionToggle";
import { CenterInfo } from "@/components/CenterInfo";
import { DanceAvatar } from "@/components/DanceAvatar";
import { PlayerRow, type ActionLabel } from "@/components/PlayerRow";
import {
  PLAYER_BOX_HEIGHT,
  PLAYER_BOX_ROTATE_OFFSET,
  resolveBgmPath,
} from "@/constants/game";
import { getTileColor } from "@/constants/tiles";
import styles from "@/screens/GameScreen.module.scss";
import { useGameStore } from "@/store";
import { useGameScreenStore } from "@/storeSelectors";
import { useBgm } from "@/utils/audio";
import { canFormTenpai, canFormWinningHand } from "@/utils/check";
import {
  autoDiscardAfterRiichiDraw,
  executePonCall,
  executeRiichiAction,
  executeRonWin,
  executeTsumoWin,
  shouldAutoDiscardRiichiHand,
} from "@/utils/gameplay";
import { startShineSync, stopShineSync } from "@/utils/shineSync";
import { getTilesWithDrawnTile } from "@/utils/tiles";
import { useCallback, useEffect, useMemo, useState } from "react";

const PLAYER_LAYOUTS = [
  {
    index: 0,
    style: {
      position: "absolute" as const,
      bottom: 5,
      left: "50%",
      transform: "translateX(-50%)",
    },
  },
  {
    index: 1,
    style: {
      position: "absolute" as const,
      top: `calc(50% - ${PLAYER_BOX_HEIGHT / 2}px)`,
      left: -PLAYER_BOX_ROTATE_OFFSET + 5,
      transform: "rotate(90deg)",
    },
  },
  {
    index: 2,
    style: {
      position: "absolute" as const,
      top: 5,
      left: "50%",
      transform: "translateX(-50%) rotate(180deg)",
    },
  },
  {
    index: 3,
    style: {
      position: "absolute" as const,
      top: `calc(50% - ${PLAYER_BOX_HEIGHT / 2}px)`,
      right: -PLAYER_BOX_ROTATE_OFFSET + 5,
      transform: "rotate(270deg)",
    },
  },
];

export function GameScreen() {
  const s = useGameScreenStore();

  const [focusedTileColor, setFocusedTileColor] = useState<number | null>(null);
  const handleTileFocus = useCallback((tileId: number) => {
    setFocusedTileColor(getTileColor(tileId));
  }, []);
  const handleTileBlur = useCallback(() => {
    setFocusedTileColor(null);
  }, []);

  const normalBgmPath = useMemo(
    () => resolveBgmPath(s.normalBgmSetting, s.riichiBgmSetting),
    [s.normalBgmSetting, s.riichiBgmSetting],
  );
  useBgm(normalBgmPath);

  useEffect(() => {
    startShineSync();
    return () => stopShineSync();
  }, []);

  const perPlayerCanRon = useMemo(() => {
    if (s.pendingRon == null) return Array(4).fill(false);
    return Array.from({ length: 4 }, (_, i) =>
      s.pendingRon!.eligiblePlayers.includes(i),
    );
  }, [s.pendingRon]);

  const perPlayerCanPon = useMemo(() => {
    if (s.pendingPon == null) return Array(4).fill(false);
    const eligible = getEligiblePonPlayers(
      s.pendingPon.tileId,
      s.pendingPon.fromPlayer,
    );
    return Array.from({ length: 4 }, (_, i) => eligible.includes(i));
  }, [s.pendingPon]);

  const handTiles = useMemo(
    () => getTilesWithDrawnTile(s.hands[s.turnIndex] ?? [], s.drawnTile),
    [s.drawnTile, s.hands, s.turnIndex],
  );

  const allTiles = useMemo(
    () => [...handTiles, ...s.ponMelds[s.turnIndex].flat()],
    [handTiles, s.ponMelds, s.turnIndex],
  );

  const currentDiscardCount = s.discards[s.turnIndex]?.length ?? 0;

  const canTsumo = useMemo(
    () =>
      s.drawnTile != null &&
      (s.showAllTiles || s.riichi[s.turnIndex] || currentDiscardCount === 0) &&
      canFormWinningHand(allTiles),
    [
      s.drawnTile,
      s.riichi,
      s.turnIndex,
      allTiles,
      s.showAllTiles,
      currentDiscardCount,
    ],
  );
  const canRiichi = useMemo(
    () => !s.riichi[s.turnIndex] && !canTsumo && canFormTenpai(allTiles),
    [s.riichi, s.turnIndex, canTsumo, allTiles],
  );

  const handleAction = useCallback(
    (label: ActionLabel, playerIndex: number) => {
      if (label === "ツモ") executeTsumoWin(playerIndex);
      else if (label === "リーチ") executeRiichiAction(s.turnIndex);
      else if (label === "ロン") executeRonWin(playerIndex);
      else if (label === "ポン") executePonCall(playerIndex);
      else if (label === "キャンセル") s.cancelPon();
    },
    [s.cancelPon, s.turnIndex],
  );

  useEffect(() => {
    if (s.hands.length === 0) s.deal();
  }, []);

  useEffect(() => {
    const state = useGameStore.getState();
    if (state.pendingPon != null || state.pendingRon != null) return;
    if (state.winner != null || state.ryuukyoku) return;

    const player = state.players[state.turnIndex];
    const delay = getCpuDelay(state.speed);

    if (
      state.hands.length > 0 &&
      state.wall.length === 0 &&
      state.drawnTile == null
    ) {
      const latest = useGameStore.getState();
      if (
        latest.wall.length === 0 &&
        latest.drawnTile == null &&
        latest.winner == null
      ) {
        latest.setRyuukyoku();
        latest.showCutin("流局", undefined, "ryuukyoku");
      }
      return;
    }

    const needsAutoDiscard = player.type === "human" || s.manualCpu;

    if (needsAutoDiscard) {
      if (shouldAutoDiscardRiichiHand(state.turnIndex)) {
        const timer = setTimeout(() => autoDiscardAfterRiichiDraw(), delay);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (
      state.drawnTile != null &&
      (state.riichi[state.turnIndex] ||
        state.discards[state.turnIndex]?.length === 0) &&
      canFormWinningHand([
        ...getTilesWithDrawnTile(
          state.hands[state.turnIndex] ?? [],
          state.drawnTile,
        ),
        ...state.ponMelds[state.turnIndex].flat(),
      ])
    ) {
      executeTsumoWin(state.turnIndex);
      return;
    }

    const timer = setTimeout(() => {
      const latest = useGameStore.getState();
      if (latest.pendingPon != null || latest.pendingRon != null) return;
      if (latest.winner != null || latest.ryuukyoku) return;
      if (!latest.hands[latest.turnIndex]) return;

      if (s.alwaysTsumogiri && latest.drawnTile != null) {
        latest.discard(latest.drawnTile);
        return;
      }

      const result = cpuDiscard(
        latest.hands[latest.turnIndex],
        latest.ponMelds[latest.turnIndex],
        latest.drawnTile,
        latest.riichi[latest.turnIndex],
        s.cpuStrength,
        s.cpuPersonalities[latest.turnIndex],
      );
      if (result == null) return;

      if (result.declareRiichi) {
        const declared = executeRiichiAction(latest.turnIndex);
        if (!declared) {
          latest.discard(result.tileId);
        }
        return;
      }
      latest.discard(result.tileId, result.declareRiichi);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    s.turnIndex,
    s.drawnTile,
    s.speed,
    s.cpuStrength,
    s.pendingPon,
    s.pendingRon,
    s.wall.length,
    s.hands.length,
    s.winner,
    s.ryuukyoku,
    s.showAllTiles,
    s.alwaysTsumogiri,
    s.manualCpu,
  ]);

  useEffect(() => {
    if (s.manualCpu) return;
    if (s.pendingPon == null && s.pendingRon == null) return;

    const autoActions = useGameStore.getState().autoActions;

    if (s.pendingPon != null) {
      const eligible = getEligiblePonPlayers(
        s.pendingPon.tileId,
        s.pendingPon.fromPlayer,
      );
      const humanEligible = eligible.filter(
        (i) => s.players[i].type === "human",
      );

      if (humanEligible.length > 0 && autoActions.pon) {
        if (useGameStore.getState().pendingPon == null) return;
        executePonCall(humanEligible[0]);
        return;
      }

      if (humanEligible.length > 0 && autoActions.cancel) {
        if (useGameStore.getState().pendingPon == null) return;
        useGameStore.getState().cancelPon();
        return;
      }

      if (humanEligible.length > 0) return;

      const state = useGameStore.getState();
      if (state.pendingPon == null) return;
      const e = getEligiblePonPlayers(
        state.pendingPon.tileId,
        state.pendingPon.fromPlayer,
      );
      if (e.length > 0) {
        const playerIndex =
          e.find((i) => state.players[i].type === "cpu") ?? e[0];
        cpuHandlePon(
          state.cpuStrength,
          state.cpuPersonalities[playerIndex],
          state.hands[playerIndex],
          state.ponMelds[playerIndex],
          state.pendingPon.tileId,
          state.players[playerIndex].name,
        ) === "pon"
          ? executePonCall(playerIndex)
          : state.cancelPon();
      }
      return;
    }

    if (s.pendingRon != null) {
      const humanEligible = s.pendingRon.eligiblePlayers.filter(
        (i) => s.players[i].type === "human",
      );

      if (humanEligible.length > 0 && autoActions.ronTsumo) {
        const latest = useGameStore.getState();
        if (latest.pendingRon == null) return;
        const eligible = latest.pendingRon.eligiblePlayers.filter(
          (i) => s.players[i].type === "human",
        );
        if (eligible.length === 0) return;
        executeRonWin(eligible[0]);
        return;
      }

      if (humanEligible.length > 0) return;

      const state = useGameStore.getState();
      if (state.pendingRon == null) return;
      if (state.pendingRon.eligiblePlayers.length > 0) {
        executeRonWin(state.pendingRon.eligiblePlayers[0]);
      }
    }
  }, [
    s.pendingPon,
    s.pendingRon,
    s.cpuStrength,
    s.players,
    s.manualCpu,
    s.autoActions,
  ]);

  useEffect(() => {
    if (!useGameStore.getState().autoActions.riichi) return;
    if (s.turnIndex !== 0) return;
    if (!canRiichi || s.winner != null || s.ryuukyoku) return;

    executeRiichiAction(s.turnIndex);
  }, [
    s.turnIndex,
    canRiichi,
    s.winner,
    s.ryuukyoku,
    s.autoActions,
  ]);

  useEffect(() => {
    if (!useGameStore.getState().autoActions.ronTsumo) return;
    if (s.turnIndex !== 0 || !canTsumo) return;
    if (s.winner != null || s.ryuukyoku) return;

    executeTsumoWin(0);
  }, [s.turnIndex, canTsumo, s.winner, s.ryuukyoku, s.autoActions]);

  const playerRowProps = (i: number) => ({
    player: s.players[i],
    index: i,
    isTurn: i === s.turnIndex,
    hand: s.hands[i] ?? [],
    drawnTile: s.drawnTile,
    ponMelds: s.ponMelds[i],
    playerDiscards: s.discards[i] ?? [],
    lastDiscardTileId: s.lastDiscard?.tileId ?? null,
    riichiDiscardPosition: s.riichiDiscardPositions[i],
    takenDiscards: s.takenDiscards[i] ?? [],
    canDiscard:
      i === s.turnIndex &&
      (s.manualCpu || !s.riichi[i]) &&
      s.pendingPon == null,
    canRon: perPlayerCanRon[i],
    canPon: perPlayerCanPon[i],
    canRiichi,
    canTsumo,
    faceDown: !s.showAllTiles && i !== 0 && s.winner !== i,
    manualCpu: s.manualCpu,
    onDiscard: s.discard,
    onAction: handleAction,
    doraTile: s.doraTile,
    focusedTileColor,
    onTileFocus: handleTileFocus,
    onTileBlur: handleTileBlur,
  });

  const showDance =
    s.riichiAvatar !== "none" &&
    s.riichi[0] &&
    s.winner == null &&
    !s.ryuukyoku;

  return (
    <div className={styles.wrapper}>
      {PLAYER_LAYOUTS.map(({ index, style }) => (
        <div key={index} style={style}>
          <PlayerRow {...playerRowProps(index)} />
        </div>
      ))}
      <CenterInfo
        players={s.players}
        turnIndex={s.turnIndex}
        parentIndex={s.parentIndex}
        round={s.round}
        kyoku={s.kyoku}
        honba={s.honba}
        riichi={s.riichi}
        ippatsu={s.ippatsu}
        doubleReach={s.doubleReach}
        ponMelds={s.ponMelds}
        wallLength={s.wall.length}
        doraTile={s.doraTile}
        uradoraTile={s.uradoraTile}
        trendTypes={s.trendTypes}
        showAllTiles={s.showAllTiles}
        winner={s.winner}
        speechBubbles={s.speechBubbles}
        focusedTileColor={focusedTileColor}
        cpuPersonalities={s.cpuPersonalities}
      />
      <AutoActionToggle />
      <DanceAvatar character={showDance ? s.riichiAvatar : "none"} />
    </div>
  );
}
