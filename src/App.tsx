import styles from "@/App.module.scss";
import { Button } from "@/components/Button";
import { CutIn } from "@/components/CutIn";
import { DebugPanel } from "@/components/DebugPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { OtherPanel } from "@/components/OtherPanel";
import { OverlayMenu } from "@/components/OverlayMenu";
import { RiichiCutin } from "@/components/RiichiCutin";
import { RulesPanel } from "@/components/RulesPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { YakuListPanel } from "@/components/YakuListPanel";
import { getPreloadBgmPaths, IS_DEBUG } from "@/constants/game";
import { GameResultScreen } from "@/screens/GameResultScreen";
import { GameScreen } from "@/screens/GameScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { ScoreConfirmScreen } from "@/screens/ScoreConfirmScreen";
import { ScoreDisplayScreen } from "@/screens/ScoreDisplayScreen";
import { TitleScreen } from "@/screens/TitleScreen";
import { YakuResultScreen } from "@/screens/YakuResultScreen";
import { getGameSizeForScreenMode } from "@/constants/layout";
import { useGameStore, type Screen } from "@/store";
import { preloadAudioFiles } from "@/utils/audio";
import { useEffect, useState, type ReactNode } from "react";

const screens: Record<Screen, ReactNode> = {
  loading: <LoadingScreen />,
  title: <TitleScreen />,
  scoreDisplay: <ScoreDisplayScreen />,
  scoreConfirm: <ScoreConfirmScreen />,
  game: <GameScreen />,
  result: <YakuResultScreen />,
  gameResult: <GameResultScreen />,
};

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const goTo = useGameStore((s) => s.goTo);
  const resetData = useGameStore((s) => s.resetData);
  const textSize = useGameStore((s) => s.textSize);
  const screenMode = useGameStore((s) => s.screenMode);
  const gameSize = useGameStore((s) => s.gameSize);
  const lightweightMode = useGameStore((s) => s.lightweightMode);
  const normalBgmSetting = useGameStore((s) => s.normalBgmSetting);
  const riichiBgmSetting = useGameStore((s) => s.riichiBgmSetting);
  const setGameSize = useGameStore((s) => s.setGameSize);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTabIndex, setMenuTabIndex] = useState(0);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [titleConfirm, setTitleConfirm] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const nextGameSize = getGameSizeForScreenMode(screenMode, ww, wh);
      setGameSize(nextGameSize);
      const s = Math.min(
        ww / nextGameSize.width,
        wh / nextGameSize.height,
      );
      setScale(Math.min(s, 1));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [screenMode]);

  useEffect(() => {
    if (!lightweightMode) return;
    const bgmFiles = getPreloadBgmPaths(
      true,
      normalBgmSetting,
      riichiBgmSetting,
    );
    void preloadAudioFiles(bgmFiles);
  }, [lightweightMode, normalBgmSetting, riichiBgmSetting]);

  return (
    <div className={styles.outer}>
      <div
        className={styles.gameArea}
        data-text-size={textSize}
        style={{
          width: gameSize.width,
          height: gameSize.height,
          transform: `scale(${scale})`,
        }}
      >
        {screens[currentScreen]}
        <RiichiCutin />
        <CutIn />
        {menuOpen && (
          <OverlayMenu
            onClose={() => {
              setMenuOpen(false);
              setResetConfirm(false);
              setTitleConfirm(false);
            }}
            activeIndex={menuTabIndex}
            onActiveIndexChange={setMenuTabIndex}
            tabs={[
              {
                label: "設定",
                content: <SettingsPanel />,
              },
              ...(IS_DEBUG
                ? [
                    {
                      label: "デバッグ",
                      content: <DebugPanel onClose={() => setMenuOpen(false)} />,
                    },
                  ]
                : []),
              { label: "ルール", content: <RulesPanel /> },
              { label: "役一覧", content: <YakuListPanel /> },
              { label: "履歴", content: <HistoryPanel /> },
              { label: "その他", content: <OtherPanel /> },
            ]}
            footer={
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <Button
                  label={titleConfirm ? "本当に？" : "タイトルに戻る"}
                  color="tertiary"
                  size="normal"
                  onClick={() => {
                    if (titleConfirm) {
                      useGameStore.getState().setSimulationMode(false);
                      goTo("title");
                      setMenuOpen(false);
                      setResetConfirm(false);
                      setTitleConfirm(false);
                    } else {
                      setTitleConfirm(true);
                    }
                  }}
                />
                <Button
                  label={resetConfirm ? "本当に？" : "データをリセット"}
                  color="primary"
                  size="normal"
                  style={{ marginLeft: "auto" }}
                  onClick={() => {
                    if (resetConfirm) {
                      resetData();
                      setResetConfirm(false);
                    } else {
                      setResetConfirm(true);
                    }
                  }}
                />
              </div>
            }
          />
        )}
        <Button
          label="メニュー"
          color="menu"
          size="large"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 50,
          }}
        />
      </div>
    </div>
  );
}
