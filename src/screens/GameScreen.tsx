import {
  cpuDiscard,
  cpuHandlePon,
  getCpuDelay,
  getEligiblePonPlayers,
} from "@/ai/CpuController";
import { AutoActionToggle } from "@/components/AutoActionToggle";
import { CenterInfo } from "@/components/CenterInfo";
import { DanceAvatar } from "@/components/DanceAvatar";
import { InfoPanel } from "@/components/InfoPanel";
import { PlayerRow, type ActionLabel } from "@/components/PlayerRow";
import { resolveBgmPath } from "@/constants/game";
import { isPortraitGameSize } from "@/constants/layout";
import { getTileColor } from "@/constants/tiles";
import styles from "@/screens/GameScreen.module.scss";
import { useGameStore } from "@/store";
import { useGameScreenStore } from "@/storeSelectors";
import layoutTokens from "@/styles/layoutTokens.module.scss";
import { useBgm } from "@/utils/audio";
import { canFormTenpai, canFormWinningHand } from "@/utils/check";
import {
  autoDiscardAfterRiichiDraw,
  canDeclareRiichi,
  canTsumoWithMiimoge,
  executePonCall,
  executeRiichiAction,
  executeRonWin,
  executeTsumoWin,
  getAimogeDangerColors,
  shouldAutoDiscardRiichiHand,
} from "@/utils/gameplay";
import { startShineSync, stopShineSync } from "@/utils/shineSync";
import { getTilesWithDrawnTile } from "@/utils/tiles";
import { useCallback, useEffect, useMemo, useState } from "react";

function parsePixelValue(value: string): number {
  return Number.parseFloat(value) || 0;
}

const PLAYER_BOX_HEIGHT = parsePixelValue(layoutTokens.playerBoxHeight);
const CPU_PLAYER_BOX_WIDTH = parsePixelValue(layoutTokens.cpuPlayerBoxWidth);
const CPU_PLAYER_BOX_ROTATE_OFFSET =
  (CPU_PLAYER_BOX_WIDTH - PLAYER_BOX_HEIGHT) / 2;

export function GameScreen() {
  const s = useGameScreenStore();
  const lightweightMode = useGameStore((state) => state.lightweightMode);
  const gameSize = useGameStore((state) => state.gameSize);

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

  const playerLayouts = useMemo(() => {
    const sideOffset = isPortraitGameSize(gameSize)
      ? -CPU_PLAYER_BOX_ROTATE_OFFSET + 5
      : CPU_PLAYER_BOX_ROTATE_OFFSET + 5;

    return [
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
          left: sideOffset,
          transform: "rotate(90deg)",
        },
      },
      {
        index: 2,
        style: {
          position: "absolute" as const,
          top: isPortraitGameSize(gameSize) ? 220 : 5,
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
        },
      },
      {
        index: 3,
        style: {
          position: "absolute" as const,
          top: `calc(50% - ${PLAYER_BOX_HEIGHT / 2}px)`,
          right: sideOffset,
          transform: "rotate(270deg)",
        },
      },
    ];
  }, [gameSize]);

  useEffect(() => {
    startShineSync(lightweightMode);
    return () => stopShineSync();
  }, [lightweightMode]);

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
  const dangerTileColorsByPlayer = useMemo(
    () =>
      Array.from({ length: 4 }, (_, playerIndex) =>
        Array.from(getAimogeDangerColors(playerIndex)),
      ),
    [s.aimogeDangerColors],
  );

  const canTsumo = useMemo(
    () => {
      if (s.drawnTile == null) return false;
      if (!canFormWinningHand(allTiles)) return false;
      if (s.riichi[s.turnIndex]) {
        const result = canTsumoWithMiimoge(
          s.turnIndex,
          allTiles,
          s.ponMelds[s.turnIndex].length > 0,
          s.doraTile,
          s.trendTypes,
          currentDiscardCount === 0,
          s.players[s.turnIndex].name,
          s.miimogeActive,
          s.abilityAssignments.map((a) => a.abilityId),
        );
        console.log("[canTsumo] riichi=true, discards=" + currentDiscardCount + ", allTiles=" + JSON.stringify(allTiles) + ", result=" + result);
        return result;
      }
      if (currentDiscardCount === 0) {
        const result = canTsumoWithMiimoge(
          s.turnIndex,
          allTiles,
          s.ponMelds[s.turnIndex].length > 0,
          s.doraTile,
          s.trendTypes,
          true,
          s.players[s.turnIndex].name,
          false,
          s.abilityAssignments.map((a) => a.abilityId),
        );
        console.log("[canTsumo] tenchijin check, allTiles=" + JSON.stringify(allTiles) + ", result=" + result);
        return result;
      }
      console.log("[canTsumo] riichi=" + s.riichi[s.turnIndex] + ", discards=" + currentDiscardCount + " → false");
      return false;
    },
    [
      s.drawnTile,
      s.riichi,
      s.turnIndex,
      allTiles,
      currentDiscardCount,
      s.miimogeActive,
      s.abilityAssignments,
      s.doraTile,
      s.trendTypes,
      s.players,
      s.ponMelds,
    ],
  );
  const canRiichi = useMemo(() => {
    if (s.riichi[s.turnIndex] || canTsumo || !canFormTenpai(allTiles)) return false;
    if (
      s.miimogeActive &&
      s.abilityAssignments[s.turnIndex]?.abilityId !== "miimoge"
    ) {
      return canDeclareRiichi(s.turnIndex, undefined, 5);
    }
    return true;
  }, [s.riichi, s.turnIndex, canTsumo, allTiles, s.miimogeActive, s.abilityAssignments]);

  const handleAction = useCallback(
    (label: ActionLabel, playerIndex: number) => {
      if (label === "ツモ") {
        const state = useGameStore.getState();
        console.log("[handleAction] ツモ clicked, playerIndex=" + playerIndex + ", turnIndex=" + state.turnIndex + ", riichi=" + state.riichi[playerIndex] + ", discards=" + (state.discards[playerIndex]?.length ?? 0) + ", drawnTile=" + state.drawnTile);
        executeTsumoWin(playerIndex);
      }
      else if (label === "リーチ") executeRiichiAction(s.turnIndex);
      else if (label === "ロン") executeRonWin(playerIndex);
      else if (label === "ポン") executePonCall(playerIndex);
      else if (label === "キャンセル") {
        const state = useGameStore.getState();
        if (state.pendingRon) state.cancelRon();
        else if (state.pendingPon) state.cancelPon();
        else if (state.riichi[0] && state.drawnTile != null) state.discard(state.drawnTile);
      }
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
    if (state.abilityCutinActive) return;

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

    if (state.drawnTile != null) {
      const handWithDraw = getTilesWithDrawnTile(
        state.hands[state.turnIndex] ?? [],
        state.drawnTile,
      );
      const allTiles = [...handWithDraw, ...state.ponMelds[state.turnIndex].flat()];
      if (
        (state.riichi[state.turnIndex] ||
          state.discards[state.turnIndex]?.length === 0) &&
        canFormWinningHand(allTiles) &&
        canTsumoWithMiimoge(
          state.turnIndex,
          allTiles,
          state.ponMelds[state.turnIndex].length > 0,
          state.doraTile,
          state.trendTypes,
          (state.discards[state.turnIndex]?.length ?? 0) === 0,
          state.players[state.turnIndex].name,
          state.miimogeActive,
          state.abilityAssignments.map((a) => a.abilityId),
        )
      ) {
        executeTsumoWin(state.turnIndex);
        return;
      }
    }

    const timer = setTimeout(() => {
      const latest = useGameStore.getState();
      if (latest.pendingPon != null || latest.pendingRon != null) return;
      if (latest.winner != null || latest.ryuukyoku) return;
      if (latest.abilityCutinActive) return;
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
    s.abilityCutinActive,
  ]);

  // Deferred riichi execution: declareRiichi + discard at riichi cutin timing
  useEffect(() => {
    if (s.riichiCutinPlayer == null) return;
    if (s.riichi[s.riichiCutinPlayer]) return;

    const state = useGameStore.getState();
    const waiter = state.riichiCutinTileId;
    if (waiter == null) return;

    state.declareRiichi(s.riichiCutinPlayer);
    state.discard(waiter, true);
  }, [s.riichiCutinPlayer, s.riichi]);

  useEffect(() => {
    if (s.manualCpu) return;
    if (s.abilityCutinActive) return;
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

      if (humanEligible.length > 0 && autoActions.cancel) {
        const latest = useGameStore.getState();
        if (latest.pendingRon == null) return;
        latest.cancelRon();
        return;
      }

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
    s.abilityCutinActive,
  ]);

  useEffect(() => {
    if (!useGameStore.getState().autoActions.riichi) return;
    if (s.turnIndex !== 0) return;
    if (!canRiichi || s.winner != null || s.ryuukyoku) return;

    executeRiichiAction(s.turnIndex);
  }, [s.turnIndex, canRiichi, s.winner, s.ryuukyoku, s.autoActions]);

  useEffect(() => {
    if (!useGameStore.getState().autoActions.ronTsumo) return;
    if (useGameStore.getState().autoActions.cancel) return;
    if (s.turnIndex !== 0 || !canTsumo) return;
    if (s.winner != null || s.ryuukyoku) return;

    console.log("[auto-tsumo] triggering executeTsumoWin(0), canTsumo=" + canTsumo + ", turnIndex=" + s.turnIndex + ", drawnTile=" + s.drawnTile + ", discards=" + (s.discards[0]?.length ?? 0));
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
    dangerTileColors: dangerTileColorsByPlayer[i],
    onTileFocus: handleTileFocus,
    onTileBlur: handleTileBlur,
  });

  const showDance =
    s.riichiAvatar !== "none" &&
    s.riichi[0] &&
    !s.abilityCutinActive &&
    s.winner == null &&
    !s.ryuukyoku;

  return (
    <div className={styles.wrapper}>
      {playerLayouts.map(({ index, style }) => (
        <div key={index} style={style}>
          <PlayerRow {...playerRowProps(index)} />
        </div>
      ))}
      <InfoPanel
        round={s.round}
        kyoku={s.kyoku}
        honba={s.honba}
        specialAbilitiesEnabled={s.specialAbilitiesEnabled}
        doraTile={s.doraTile}
        uradoraTile={s.uradoraTile}
        trendTypes={s.trendTypes}
        showAllTiles={s.showAllTiles}
        winner={s.winner}
        riichi={s.riichi}
        ponMelds={s.ponMelds}
        focusedTileColor={focusedTileColor}
      />
      <CenterInfo
        players={s.players}
        turnIndex={s.turnIndex}
        parentIndex={s.parentIndex}
        riichi={s.riichi}
        ippatsu={s.ippatsu}
        doubleReach={s.doubleReach}
        ponMelds={s.ponMelds}
        wallLength={s.wall.length}
        speechBubbles={s.speechBubbles}
        specialAbilitiesEnabled={s.specialAbilitiesEnabled}
        abilityGauge={s.abilityGauge}
        abilityReady={s.abilityReady}
        abilityChargeLocked={s.abilityChargeLocked}
        abilityIds={s.abilityAssignments.map((a) => a.abilityId)}
        miimogeActive={s.miimogeActive}
        cpuPersonalities={s.cpuPersonalities}
      />
      <AutoActionToggle />
      <DanceAvatar character={showDance ? s.riichiAvatar : "none"} />
    </div>
  );
}
