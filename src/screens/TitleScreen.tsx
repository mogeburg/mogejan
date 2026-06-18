import { DanceAvatar } from "@/components/DanceAvatar";
import { ModalCard } from "@/components/ModalCard";
import { ModeToggle } from "@/components/ModeToggle";
import { TileImage } from "@/components/TileImage";
import { BGM, INITIAL_SCORE, PLAYER_COUNT, VERSION } from "@/constants/game";
import { getImageUrl, TileData } from "@/constants/tiles";
import styles from "@/screens/TitleScreen.module.scss";
import { useGameStore } from "@/store";
import { useTitleScreenStore } from "@/storeSelectors";
import { playSe, useBgm } from "@/utils/audio";
import { seAudioUrl } from "@/utils/assets";
import { useRef, useState, useCallback, type MouseEvent } from "react";

const CHARACTER_TILE_IDS = TileData.map((_, i) => i * 9 + 1);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TitleScreen() {
  const [modeIndex, setModeIndex] = useState(0);
  const [showDance, setShowDance] = useState(false);
  const [danceUnlocked, setDanceUnlocked] = useState(false);
  const [simUnlocked, setSimUnlocked] = useState(false);
  const {
    riichiBgmSetting,
    riichiAvatar,
    simulationMode,
    setSimulationMode,
    initGame,
  } = useTitleScreenStore();

  const danceClicks = useRef(0);
  const simClicks = useRef(0);

  const handleTitleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (danceUnlocked) {
      setShowDance((prev) => !prev);
      return;
    }
    danceClicks.current++;
    if (danceClicks.current >= 3) {
      danceClicks.current = 0;
      setDanceUnlocked(true);
      setShowDance(true);
    }
  }, [danceUnlocked]);

  const handleVersionClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (simUnlocked) {
      if (simulationMode) {
        setSimulationMode(false);
      } else {
        setSimulationMode(true);
        const shuffled = shuffle(TileData);
        const cpuPlayers = shuffled.slice(0, PLAYER_COUNT).map((c) => ({
          name: c.name,
          score: INITIAL_SCORE,
          type: "cpu" as const,
          imageUrl: getImageUrl(c.id),
          colorHex: c.colorHex,
          charId: c.id,
        }));
        initGame(cpuPlayers);
      }
      return;
    }
    simClicks.current++;
    if (simClicks.current >= 3) {
      simClicks.current = 0;
      setSimUnlocked(true);
    }
  }, [simUnlocked, simulationMode, setSimulationMode, initGame]);

  const bgm =
    showDance && riichiBgmSetting !== "none"
      ? riichiBgmSetting === "random"
        ? BGM.riichi.path
        : BGM[riichiBgmSetting].path
      : BGM.op.path;
  useBgm(bgm);

  function handleSelect(index: number) {
    if (simulationMode) setSimulationMode(false);
    playSe(seAudioUrl("start.opus"));
    const chosen = TileData[index];
    const others = TileData.filter((_, i) => i !== index);
    const shuffled = shuffle(others).slice(0, PLAYER_COUNT - 1);
    const players = [
      {
        name: chosen.name,
        score: INITIAL_SCORE,
        type: "human" as const,
        imageUrl: getImageUrl(chosen.id),
        colorHex: chosen.colorHex,
        charId: chosen.id,
      },
      ...shuffled.map((c) => ({
        name: c.name,
        score: INITIAL_SCORE,
        type: "cpu" as const,
        imageUrl: getImageUrl(c.id),
        colorHex: c.colorHex,
        charId: c.id,
      })),
    ];

    useGameStore.getState().initGame(players);
  }

  return (
    <>
      <ModalCard className={styles.modalCard}>
        <p
          className={simUnlocked ? styles.versionRed : styles.version}
          onClick={handleVersionClick}
          style={{ cursor: "pointer" }}
        >
          ver {VERSION}{simulationMode ? " 🎲" : ""}
        </p>
        <h1
          className={danceUnlocked ? styles.titleRed : styles.title}
          onClick={handleTitleClick}
          style={{ cursor: "pointer" }}
        >
          もげじゃん
        </h1>
        <div className={styles.charGrid}>
          {CHARACTER_TILE_IDS.map((id, i) => {
            const isStoryMode = modeIndex === 1;
            const isFirst = i === 0;
            const faceDown = isStoryMode && !isFirst;

            return (
              <div
                key={id}
                onClick={faceDown ? undefined : () => handleSelect(i)}
                className={faceDown ? styles.charItemFaceDown : styles.charItem}
              >
                <TileImage id={id} size="normal" faceDown={faceDown} />
              </div>
            );
          })}
        </div>
        <ModeToggle
          items={[{ label: "東南戦" }, { label: "ストーリー", disabled: true }]}
          activeIndex={modeIndex}
          onChange={setModeIndex}
        />
      </ModalCard>
      <DanceAvatar character={showDance ? riichiAvatar : "none"} />
    </>
  );
}
