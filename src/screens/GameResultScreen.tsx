import { useEffect, useMemo } from "react";
import { useGameStore } from "@/store";
import { playSe } from "@/utils/audio";
import { ModalCard } from "@/components/ModalCard";
import { Button } from "@/components/Button";
import { INITIAL_SCORE, PLAYER_COUNT } from "@/constants/game";
import { getImageUrl, TileData } from "@/constants/tiles";
import styles from "@/screens/GameResultScreen.module.scss";
import { seAudioUrl } from "@/utils/assets";
import { getSimulationResultDelay } from "@/utils/simulation";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GameResultScreen() {
  useEffect(() => {
    playSe(seAudioUrl("end.opus"));
  }, []);
  const players = useGameStore((s) => s.players);
  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const humanPlayerName = useMemo(() => players.find((p) => p.type === "human")?.name, [players]);

  const rankIcons = ["🥇", "🥈", "🥉", "😭"];

  useEffect(() => {
    const state = useGameStore.getState();
    if (!state.simulationMode) return;
    const timer = setTimeout(() => {
      const shuffled = shuffle(TileData);
      const cpuPlayers = shuffled.slice(0, PLAYER_COUNT).map((c) => ({
        name: c.name,
        score: INITIAL_SCORE,
        type: "cpu" as const,
        imageUrl: getImageUrl(c.id),
        colorHex: c.colorHex,
        charId: c.id,
      }));
      useGameStore.getState().initGame(cpuPlayers);
    }, getSimulationResultDelay(state.speed));
    return () => clearTimeout(timer);
  }, []);

  return (
    <ModalCard style={{ minWidth: 360 }}>
      <h1 className={styles.title}>
        ゲーム終了
      </h1>
      <div className={styles.playerList}>
        {sorted.map((p, i) => (
          <div
            key={i}
            className={`${styles.playerRow} ${p.name === humanPlayerName ? styles.winnerRow : ""}`}
          >
            <div className={styles.playerLeft}>
              <span className={styles.rankIcon}>{rankIcons[i]}</span>
              <div
                className={styles.avatar}
                style={{
                  backgroundImage: `url(${p.imageUrl})`,
                  backgroundColor: p.colorHex,
                }}
              />
              <span className={styles.playerName}>
                {p.name}
              </span>
            </div>
            <span className={styles.playerScore}>
              {p.score}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.buttonRow}>
        <Button
          label="タイトルに戻る"
          color="normal"
          size="large"
          onClick={() => {
            useGameStore.setState({
              currentScreen: "title",
              round: 0,
              kyoku: 0,
              honba: 0,
              gameOver: false,
            });
          }}
        />
      </div>
    </ModalCard>
  );
}
