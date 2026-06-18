import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { CutIn } from "@/components/CutIn";
import { RiichiCutin } from "@/components/RiichiCutin";
import { HistoryPanel } from "@/components/HistoryPanel";
import { OtherPanel } from "@/components/OtherPanel";
import { OverlayMenu } from "@/components/OverlayMenu";
import { RulesPanel } from "@/components/RulesPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { YakuListPanel } from "@/components/YakuListPanel";
import { GameResultScreen } from "@/screens/GameResultScreen";
import { GameScreen } from "@/screens/GameScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { ScoreConfirmScreen } from "@/screens/ScoreConfirmScreen";
import { ScoreDisplayScreen } from "@/screens/ScoreDisplayScreen";
import { TitleScreen } from "@/screens/TitleScreen";
import { YakuResultScreen } from "@/screens/YakuResultScreen";
import { useGameStore, type Screen } from "@/store";
import styles from "@/App.module.scss";

const GAME_W = 1024;
const GAME_H = 768;

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [titleConfirm, setTitleConfirm] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const s = Math.min(ww / GAME_W, wh / GAME_H);
      setScale(Math.min(s, 1));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className={styles.outer}>
      <div
        className={styles.gameArea}
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {screens[currentScreen]}
        <RiichiCutin />
        <CutIn />
        {menuOpen && (
          <OverlayMenu
            onClose={() => { setMenuOpen(false); setResetConfirm(false); setTitleConfirm(false); }}
            tabs={[
              { label: "設定", content: <SettingsPanel onClose={() => setMenuOpen(false)} /> },
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
                      goTo("title"); setMenuOpen(false); setResetConfirm(false); setTitleConfirm(false);
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
          size="normal"
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
