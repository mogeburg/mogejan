import { Button } from "@/components/Button";
import { CharacterIntroPanel } from "@/components/CharacterIntroPanel";
import { DanceAvatar } from "@/components/DanceAvatar";
import { ModalCard } from "@/components/ModalCard";
import { ModeToggle } from "@/components/ModeToggle";
import { OtherPanel } from "@/components/OtherPanel";
import { OverlayMenu } from "@/components/OverlayMenu";
import { RulesPanel } from "@/components/RulesPanel";
import { TileImage } from "@/components/TileImage";
import { YakuListPanel } from "@/components/YakuListPanel";
import { BGM, INITIAL_SCORE, PLAYER_COUNT, VERSION } from "@/constants/game";
import { getImageUrl, TileData } from "@/constants/tiles";
import styles from "@/screens/TitleScreen.module.scss";
import { useGameStore } from "@/store";
import { useTitleScreenStore } from "@/storeSelectors";
import { seAudioUrl } from "@/utils/assets";
import { playSe, useBgm } from "@/utils/audio";
import { useCallback, useRef, useState, type MouseEvent } from "react";

const CHARACTER_TILE_IDS = TileData.map((_, i) => i * 9 + 1);

const SPECIAL_INDEX = 1;
const STORY_INDEX = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TitleScreen() {
  const [showDance, setShowDance] = useState(false);
  const [danceUnlocked, setDanceUnlocked] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const {
    riichiBgmSetting,
    riichiAvatar,
    titleModeIndex,
    setTitleModeIndex,
    specialAbilitiesEnabled,
    setSpecialAbilitiesEnabled,
    simulationMode,
    setSimulationMode,
  } = useTitleScreenStore();

  const danceClicks = useRef(0);

  const handleTitleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
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
    },
    [danceUnlocked],
  );

  const bgm =
    showDance && riichiBgmSetting !== "none"
      ? riichiBgmSetting === "random"
        ? BGM.riichi.path
        : BGM[riichiBgmSetting].path
      : BGM.op.path;
  useBgm(bgm);

  function handleSelect(index: number) {
    const enableSpecialAbilities = titleModeIndex === SPECIAL_INDEX;
    if (simulationMode) setSimulationMode(false);
    if (specialAbilitiesEnabled !== enableSpecialAbilities) {
      setSpecialAbilitiesEnabled(enableSpecialAbilities);
    }
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
    <div className={styles.titleLayout}>
      <div className={styles.titleMain}>
        <ModalCard className={styles.modalCard}>
          <p className={styles.version}>
            ver {VERSION}
            {simulationMode ? " 🎲" : ""}
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
              const isStoryMode = titleModeIndex === STORY_INDEX;
              return (
                <div
                  key={id}
                  onClick={isStoryMode ? undefined : () => handleSelect(i)}
                  className={
                    isStoryMode ? styles.charItemFaceDown : styles.charItem
                  }
                >
                  <TileImage id={id} size="normal" faceDown={isStoryMode} />
                </div>
              );
            })}
          </div>
          <ModeToggle
            items={[
              { label: "東南戦" },
              { label: "超東南戦" },
              // { label: "ストーリー", disabled: true },
            ]}
            activeIndex={titleModeIndex}
            onChange={setTitleModeIndex}
          />
        </ModalCard>
      </div>
      <Button
        label="遊び方"
        color="normal"
        size="normal"
        onClick={() => setHowToPlayOpen(true)}
        style={{ marginBottom: 32 }}
      />
      {howToPlayOpen && (
        <OverlayMenu
          onClose={() => setHowToPlayOpen(false)}
          tabs={[
            { label: "ルール", content: <RulesPanel /> },
            { label: "キャラクター", content: <CharacterIntroPanel /> },
            { label: "役一覧", content: <YakuListPanel /> },
            { label: "その他", content: <OtherPanel /> },
          ]}
        />
      )}
      <DanceAvatar character={showDance ? riichiAvatar : "none"} />
    </div>
  );
}
