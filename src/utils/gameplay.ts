import { resolveBgmPath } from "@/constants/game";
import type { AbilityId } from "@/constants/abilities";
import {
  getTileCharacterId,
  getTileColor,
} from "@/constants/tiles";
import { useGameStore } from "@/store";
import { sortTiles } from "@/utils/tiles";
import { voiceAudioUrl } from "@/utils/assets";
import { getCurrentBgmSrc, playBgm, playVoice } from "@/utils/audio";
import { canFormWinningHand, findAllWaitingColors, findWaiterId } from "@/utils/check";
import type { YakuResult } from "@/utils/evaluateYaku";
import { evaluateYaku } from "@/utils/evaluateYaku";
import { evaluateSpecialYaku } from "@/utils/evaluateSpecialYaku";
import {
  canDeclareRiichiForTiles,
  getProjectedTotalYaku,
  getCutinRarity,
  getCutinImageVariant,
  shouldUseEchoVoice,
} from "@/utils/gameplayLogic";
import { getCpuProfile } from "@/ai/CpuController";

function canActivateAbility(playerIndex: number, abilityId: AbilityId) {
  const state = useGameStore.getState();
  return (
    state.specialAbilitiesEnabled &&
    state.abilityAssignments[playerIndex]?.abilityId === abilityId &&
    state.abilityReady[playerIndex] &&
    !state.abilityChargeLocked[playerIndex]
  );
}

function getRiichiWaitingColors(excludePlayer: number): Set<number> {
  const state = useGameStore.getState();
  const colors = new Set<number>();
  for (let oppIdx = 0; oppIdx < state.players.length; oppIdx++) {
    if (!state.riichi[oppIdx] || oppIdx === excludePlayer) continue;
    const waiting = findAllWaitingColors(
      state.hands[oppIdx],
      state.ponMelds[oppIdx],
      state.trendTypes,
    );
    for (const color of waiting) colors.add(color);
  }
  return colors;
}

function tryActivateAimoge(playerIndex: number): boolean {
  const state = useGameStore.getState();
  if (state.riichi[playerIndex]) return false;
  if (!canActivateAbility(playerIndex, "aimoge")) return false;

  const waitingColors = getRiichiWaitingColors(playerIndex);
  if (waitingColors.size === 0) return false;

  const playerTiles = [
    ...state.hands[playerIndex],
    ...(state.drawnTile != null ? [state.drawnTile] : []),
  ];
  const hasDanger = playerTiles.some((tileId) =>
    waitingColors.has(getTileColor(tileId)),
  );
  if (!hasDanger) return false;

  state.activateAbility(playerIndex, "aimoge");
  state.setAimogeDangerColors(playerIndex, [...waitingColors]);
  return true;
}

export function triggerAimogeOnTurn(playerIndex: number) {
  tryActivateAimoge(playerIndex);
}

export function executeAnemogeSwap(
  playerIndex: number,
  hands: number[][],
  wall: number[],
  doraTile: number | null,
  uradoraTile: number | null,
): {
  hands: number[][];
  wall: number[];
  doraTile: number | null;
  uradoraTile: number | null;
  diceResult: number;
} {
  const N = Math.floor(Math.random() * 8) + 1;
  const hand = [...hands[playerIndex]];
  const newWall = [...wall];
  let newDora = doraTile;
  let newUradora = uradoraTile;
  const newHands = hands.map(h => [...h]);
  const modifiedOtherPlayers = new Set<number>();

  const isAnemoge = (tileId: number) => getTileCharacterId(tileId) === "anemoge";

  let modified = false;

  for (let pos = 0; pos < N && pos < hand.length; pos++) {
    if (isAnemoge(hand[pos])) continue;

    let found = false;

    for (let j = N; j < hand.length; j++) {
      if (isAnemoge(hand[j])) {
        [hand[pos], hand[j]] = [hand[j], hand[pos]];
        found = true;
        modified = true;
        break;
      }
    }
    if (found) continue;

    for (let j = 0; j < newWall.length; j++) {
      if (isAnemoge(newWall[j])) {
        [hand[pos], newWall[j]] = [newWall[j], hand[pos]];
        found = true;
        modified = true;
        break;
      }
    }
    if (found) continue;

    if (newDora != null && isAnemoge(newDora)) {
      [hand[pos], newDora] = [newDora, hand[pos]];
      found = true;
      modified = true;
    }
    if (found) continue;

    if (newUradora != null && isAnemoge(newUradora)) {
      [hand[pos], newUradora] = [newUradora, hand[pos]];
      found = true;
      modified = true;
    }
    if (found) continue;

    for (let p = 0; p < newHands.length; p++) {
      if (p === playerIndex) continue;
      for (let j = 0; j < newHands[p].length; j++) {
        if (isAnemoge(newHands[p][j])) {
          [hand[pos], newHands[p][j]] = [newHands[p][j], hand[pos]];
          modifiedOtherPlayers.add(p);
          found = true;
          modified = true;
          break;
        }
      }
      if (found) break;
    }
  }

  for (let pos = N; pos < hand.length; pos++) {
    if (!isAnemoge(hand[pos])) continue;
    if (newWall.length === 0) break;

    const wallTop = newWall.shift()!;
    const handTile = hand[pos];
    hand[pos] = wallTop;
    newWall.push(handTile);
    modified = true;
  }

  if (modified) {
    hand.sort(sortTiles);
    newHands[playerIndex] = hand;
    for (const p of modifiedOtherPlayers) {
      newHands[p].sort(sortTiles);
    }
  }

  return { hands: newHands, wall: newWall, doraTile: newDora, uradoraTile: newUradora, diceResult: N };
}

function triggerAnokoOnWin(playerIndex: number) {
  const state = useGameStore.getState();
  if (!canActivateAbility(playerIndex, "anoko")) return;

  const allTiles = [
    ...state.hands[playerIndex],
    ...(state.drawnTile != null ? [state.drawnTile] : []),
    ...state.ponMelds[playerIndex].flat(),
  ];
  const hasTarget = allTiles.some((t) => {
    const id = getTileCharacterId(t);
    return id === "anoko" || id === "siran";
  });
  if (!hasTarget) return;

  state.activateAbility(playerIndex, "anoko");
  state.setAnokoSubstitutionPending(playerIndex, true);
}

function triggerPikasanOnRiichi(playerIndex: number) {
  const state = useGameStore.getState();
  if (!canActivateAbility(playerIndex, "pikasan")) return;
  state.activateAbility(playerIndex, "pikasan");
  state.setPikasanBonusPending(playerIndex, true);
}

function tryActivateImouto(riichiPlayerIndex: number, waiter: number): boolean {
  const state = useGameStore.getState();
  if (state.abilityAssignments[riichiPlayerIndex]?.abilityId === "imouto") return false;

  const imoutoIndex = state.abilityAssignments.findIndex(
    (a) => a.abilityId === "imouto",
  );
  if (imoutoIndex === -1) return false;
  if (state.riichi[imoutoIndex]) return false;
  if (!canActivateAbility(imoutoIndex, "imouto")) return false;

  state.mergeDrawnIntoHand(riichiPlayerIndex);
  state.swapHandsAndMelds(imoutoIndex, riichiPlayerIndex);
  state.activateAbility(imoutoIndex, "imouto");

  const imoutoCanRiichi = canDeclareRiichi(imoutoIndex);
  if (imoutoCanRiichi) {
    state.declareRiichi(imoutoIndex);
    state.directDiscard(imoutoIndex, waiter, true);
    state.setRiichiCutin(imoutoIndex);
    state.showSpeechBubble("リーチ", imoutoIndex);
  } else {
    state.directDiscard(imoutoIndex, waiter, false);
  }

  state.skipTurn();
  return true;
}

export function getAimogeDangerColors(playerIndex: number): Set<number> {
  const state = useGameStore.getState();
  if (!state.specialAbilitiesEnabled) return new Set<number>();
  return new Set(state.aimogeDangerColors[playerIndex]);
}

export function canTsumoWithMiimoge(
  playerIndex: number,
  allTiles: number[],
  hasPonMelds: boolean,
  doraTile: number | null,
  trendTypes: number[],
  winnerDiscardsEmpty: boolean,
  playerName: string,
  miimogeActive: boolean,
  abilityIds: (AbilityId | null)[],
  minYaku = 5,
): boolean {
  if (!miimogeActive || abilityIds[playerIndex] === "miimoge") {
    return winnerDiscardsEmpty ? getProjectedTotalYaku({
      riichi: false,
      doubleReach: false,
      ippatsu: false,
      isRon: false,
      hasPonMelds,
      doraTile,
      uradoraTile: null,
      allTiles,
      winnerDiscardsEmpty,
      playerName,
      trendTypes,
    }) >= 13 : true;
  }

  const totalYaku = getProjectedTotalYaku({
    riichi: false,
    doubleReach: false,
    ippatsu: false,
    isRon: false,
    hasPonMelds,
    doraTile,
    uradoraTile: null,
    allTiles,
    winnerDiscardsEmpty,
    playerName,
    trendTypes,
  });

  return totalYaku >= minYaku;
}



export function canDeclareRiichi(
  playerIndex: number,
  discardTileId?: number | null,
  minTotalYaku = 2,
): boolean {
  const state = useGameStore.getState();
  const tiles = [
    ...state.hands[playerIndex],
    ...(state.drawnTile != null ? [state.drawnTile] : []),
  ];
  const riichiDiscardTileId = discardTileId ?? findWaiterId(tiles);
  if (riichiDiscardTileId == null) return false;

  return canDeclareRiichiForTiles({
    tiles,
    discardTileId: riichiDiscardTileId,
    openMeldTiles: state.ponMelds[playerIndex].flat(),
    hasPonMelds: state.ponMelds[playerIndex].length > 0,
    doraTile: state.doraTile,
    playerName: state.players[playerIndex].name,
    trendTypes: state.trendTypes,
    winnerDiscardsEmpty: state.discards[playerIndex].length === 0,
    doubleReach: state.discards[playerIndex].length === 0,
    minTotalYaku,
  });
}

function runYakuEvaluation(
  allTiles: number[],
  playerIndex: number,
  options?: { isRon?: boolean },
): YakuResult[] {
  const state = useGameStore.getState();
  return evaluateYaku({
    riichi: state.riichi[playerIndex],
    doubleReach: state.doubleReach[playerIndex],
    ippatsu: state.ippatsu[playerIndex],
    isRon: options?.isRon ?? false,
    hasPonMelds: state.ponMelds[playerIndex].length > 0,
    doraTile: state.doraTile,
    uradoraTile: state.uradoraTile,
    allTiles,
    winnerDiscardsEmpty: state.discards[playerIndex].length === 0,
    playerName: state.players[playerIndex].name,
    trendTypes: state.trendTypes,
  }).concat(evaluateSpecialYaku(allTiles));
}

function mapSiranToAnoko(tiles: number[]): number[] {
  return tiles.map((t) =>
    getTileCharacterId(t) === "siran" ? t + 9 : t,
  );
}

function mapAnokoToSiran(tiles: number[]): number[] {
  return tiles.map((t) =>
    getTileCharacterId(t) === "anoko" ? t - 9 : t,
  );
}

function mergeYakuResults(scenarios: YakuResult[][]): YakuResult[] {
  const seen = new Map<string, number>();
  for (const results of scenarios) {
    for (const r of results) {
      if (!seen.has(r.name)) {
        seen.set(r.name, r.yaku);
      }
    }
  }
  return Array.from(seen.entries()).map(([name, yaku]) => ({ name, yaku }));
}

export function evaluateWin(
  playerIndex: number,
  options?: {
    isRon?: boolean;
    claimedTile?: number;
  },
): { totalYaku: number; results: YakuResult[] } {
  const state = useGameStore.getState();
  const drawnTiles =
    options?.claimedTile != null
      ? [options.claimedTile]
      : state.drawnTile != null
        ? [state.drawnTile]
        : [];
  const allTiles = [
    ...state.hands[playerIndex],
    ...drawnTiles,
    ...state.ponMelds[playerIndex].flat(),
  ];

  const scenarios: YakuResult[][] = [];
  scenarios.push(runYakuEvaluation(allTiles, playerIndex, options));

  if (state.anokoSubstitutionPending[playerIndex]) {
    scenarios.push(
      runYakuEvaluation(mapSiranToAnoko(allTiles), playerIndex, options),
    );
    scenarios.push(
      runYakuEvaluation(mapAnokoToSiran(allTiles), playerIndex, options),
    );
  }

  const results = mergeYakuResults(scenarios);

  if (state.pikasanBonusPending[playerIndex]) {
    if (!results.some((r) => r.name === "そうだね")) {
      results.push({ name: "そうだね", yaku: 3 });
    }
  }

  const adjustedTotalYaku = results.reduce((sum, result) => sum + result.yaku, 0);

  return {
    totalYaku: adjustedTotalYaku,
    results,
  };
}

export function executeTsumoWin(playerIndex: number) {
  const state = useGameStore.getState();
  state.declareWin(playerIndex);
  triggerAnokoOnWin(playerIndex);
  const { totalYaku } = evaluateWin(playerIndex);
  playVoice(
    shouldUseEchoVoice(totalYaku)
      ? voiceAudioUrl("tsumo-echo.opus")
      : voiceAudioUrl("tsumo.opus"),
  );
  if (
    useGameStore.getState().anokoSubstitutionPending[playerIndex]
  ) {
    state.setPendingWinCutin(
      "ツモ",
      playerIndex,
      getCutinRarity(totalYaku),
      getCutinImageVariant(totalYaku),
    );
  } else {
    state.showCutin(
      "ツモ",
      playerIndex,
      getCutinRarity(totalYaku),
      getCutinImageVariant(totalYaku),
    );
  }
}

export function executeRonWin(playerIndex: number) {
  const state = useGameStore.getState();
  const claimedTile = state.pendingRon?.tileId;
  if (claimedTile == null) return;

  triggerAnokoOnWin(playerIndex);
  const { totalYaku } = evaluateWin(playerIndex, {
    isRon: true,
    claimedTile,
  });
  playVoice(
    shouldUseEchoVoice(totalYaku)
      ? voiceAudioUrl("ron-echo.opus")
      : voiceAudioUrl("ron.opus"),
  );
  state.executeRon(playerIndex);
  if (
    useGameStore.getState().anokoSubstitutionPending[playerIndex]
  ) {
    state.setPendingWinCutin(
      "ロン",
      playerIndex,
      getCutinRarity(totalYaku),
      getCutinImageVariant(totalYaku),
    );
  } else {
    state.showCutin(
      "ロン",
      playerIndex,
      getCutinRarity(totalYaku),
      getCutinImageVariant(totalYaku),
    );
  }
}

export function executePonCall(playerIndex: number) {
  const state = useGameStore.getState();
  playVoice(voiceAudioUrl("pon.opus"));
  state.executePon(playerIndex);
  triggerAimogeOnTurn(playerIndex);
  state.showSpeechBubble("ポン", playerIndex);
}

export function executeRiichiAction(playerIndex: number): boolean {
  const state = useGameStore.getState();
  const isHumanPlayer = state.players[playerIndex].type === "human";
  const handTiles = [
    ...state.hands[playerIndex],
    ...(state.drawnTile != null ? [state.drawnTile] : []),
    ...state.ponMelds[playerIndex].flat(),
  ];
  const waiter = findWaiterId(handTiles);
  if (waiter == null) return false;
  if (
    state.miimogeActive &&
    state.abilityAssignments[playerIndex]?.abilityId !== "miimoge"
  ) {
    if (!canDeclareRiichi(playerIndex, waiter, 5)) {
      return false;
    }
  }
  if (!isHumanPlayer) {
    const minTotalYaku = getCpuProfile(state.cpuStrength).minRiichiYaku;
    if (!canDeclareRiichi(playerIndex, waiter, minTotalYaku)) {
      return false;
    }
  }

  if (tryActivateImouto(playerIndex, waiter)) {
    return true;
  }

  triggerPikasanOnRiichi(playerIndex);
  if (!isHumanPlayer) {
    playVoice(voiceAudioUrl("riichi.opus"));
  }
  state.showSpeechBubble("リーチ", playerIndex);
  if (
    isHumanPlayer &&
    state.riichiBgmSetting !== "none" &&
    (state.riichiBgmSetting === "random" ||
      state.riichiBgmSetting !== state.normalBgmSetting)
  ) {
    playBgm(
      resolveBgmPath(
        state.riichiBgmSetting,
        state.normalBgmSetting,
        getCurrentBgmSrc(),
      ),
    );
  }
  if (isHumanPlayer) {
    if (useGameStore.getState().abilityCutinActive) {
      useGameStore.getState().setPendingRiichiCutin(playerIndex, waiter);
    } else {
      state.setRiichiCutin(playerIndex, waiter);
    }
  } else {
    playVoice(voiceAudioUrl("riichi.opus"));
    state.declareRiichi(playerIndex);
    state.discard(waiter, true);
  }
  return true;
}

export function autoDiscardAfterRiichiDraw() {
  const state = useGameStore.getState();
  if (state.drawnTile != null && state.riichi[state.turnIndex]) {
    state.discard(state.drawnTile);
  }
}

export function shouldAutoDiscardRiichiHand(playerIndex: number): boolean {
  const state = useGameStore.getState();
  if (state.drawnTile == null || !state.riichi[playerIndex]) return false;

  const allTiles = [
    ...state.hands[playerIndex],
    state.drawnTile,
    ...state.ponMelds[playerIndex].flat(),
  ];
  return !canFormWinningHand(allTiles);
}
