import { Button } from "@/components/Button";
import { CheckboxButton } from "@/components/CheckboxButton";
import { FieldLabel } from "@/components/FieldLabel";
import { MenuSection } from "@/components/MenuSection";
import styles from "@/components/Panel.module.scss";
import { SelectBox } from "@/components/SelectBox";
import { INITIAL_SCORE, PLAYER_COUNT } from "@/constants/game";
import { getImageUrl, TileData } from "@/constants/tiles";
import { useGameStore } from "@/store";
import { useState } from "react";

const CUTIN_TESTS = [
  { label: "ノーマル", type: "normal" as const, imageVariant: "normal" as const },
  { label: "満貫", type: "rare" as const, imageVariant: "normal" as const },
  { label: "倍満", type: "rare" as const, imageVariant: "baiman" as const },
  { label: "役満", type: "epic" as const, imageVariant: "baiman" as const },
  { label: "流局", type: "ryuukyoku" as const, imageVariant: "normal" as const },
];

const PLAYER_INDEX_OPTIONS = [
  { value: 0, label: "1" },
  { value: 1, label: "2" },
  { value: 2, label: "3" },
  { value: 3, label: "4" },
] as const;

export function DebugPanel({ onClose }: { onClose?: () => void }) {
  const debugFlags = useGameStore((s) => s.debugFlags);
  const players = useGameStore((s) => s.players);
  const initGame = useGameStore((s) => s.initGame);
  const setSimulationMode = useGameStore((s) => s.setSimulationMode);
  const toggleDebugFlag = useGameStore((s) => s.toggleDebugFlag);
  const showCutinTest = useGameStore((s) => s.showCutin);
  const showDebugCutin = useGameStore((s) => s.showDebugCutin);
  const startDebugMidgame = useGameStore((s) => s.startDebugMidgame);
  const [lightningSourcePlayer, setLightningSourcePlayer] = useState(0);
  const [lightningTargetPlayer, setLightningTargetPlayer] = useState(1);

  function shuffle<T>(arr: T[]): T[] {
    const next = [...arr];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function startCpuSimulation() {
    const shuffled = shuffle(TileData);
    const cpuPlayers = shuffled.slice(0, PLAYER_COUNT).map((character) => ({
      name: character.name,
      score: INITIAL_SCORE,
      type: "cpu" as const,
      imageUrl: getImageUrl(character.id),
      colorHex: character.colorHex,
      charId: character.id,
    }));
    setSimulationMode(true);
    initGame(cpuPlayers);
    onClose?.();
  }

  return (
    <div className={styles.panelSettings}>
      <MenuSection title="デバッグ">
        <div className={styles.sectionStack}>
          <div className={styles.settingsSurface}>
            <div className={styles.settingsActions}>
              <CheckboxButton
                label="牌全表示"
                checked={debugFlags.showAllTiles}
                onChange={() => toggleDebugFlag("showAllTiles")}
              />
              <CheckboxButton
                label="CPU手動操作"
                checked={debugFlags.manualCpu}
                onChange={() => toggleDebugFlag("manualCpu")}
              />
              <CheckboxButton
                label="常にツモ切り"
                checked={debugFlags.alwaysTsumogiri}
                onChange={() => toggleDebugFlag("alwaysTsumogiri")}
              />
              <CheckboxButton
                label="性格値表示"
                checked={debugFlags.showCpuPersonalities}
                onChange={() => toggleDebugFlag("showCpuPersonalities")}
              />
            </div>
          </div>

          <div className={styles.settingsSurface}>
            <FieldLabel className={styles.settingsSubLabel}>対局デバッグ</FieldLabel>
            <div className={styles.settingsActions}>
              <Button
                label="CPUシミュレーション"
                size="normal"
                color="secondary"
                onClick={startCpuSimulation}
              />
              <Button
                label="今のメンツで中盤へ"
                size="normal"
                color="secondary"
                onClick={() => {
                  startDebugMidgame(players);
                  onClose?.();
                }}
              />
            </div>
          </div>

          <div className={styles.settingsSurface}>
            <FieldLabel className={styles.settingsSubLabel}>
              カットインテスト
            </FieldLabel>
            <div className={styles.settingsActions}>
              {CUTIN_TESTS.map((c) => (
                <Button
                  key={c.label}
                  label={c.label}
                  size="normal"
                  onClick={() => {
                    showCutinTest("ロン", 0, c.type, c.imageVariant);
                    onClose?.();
                  }}
                />
              ))}
              <Button
                label="リーチ"
                size="normal"
                onClick={() => {
                  useGameStore.getState().setRiichiCutin(0, 1);
                  onClose?.();
                }}
              />
            </div>
          </div>

          <div className={styles.settingsSurface}>
            <FieldLabel className={styles.settingsSubLabel}>雷テスト</FieldLabel>
            <div className={styles.settingsInlineRow}>
              <SelectBox
                label="開始"
                value={lightningSourcePlayer}
                options={[...PLAYER_INDEX_OPTIONS]}
                onChange={(value) => setLightningSourcePlayer(Number(value))}
              />
              <SelectBox
                label="終了"
                value={lightningTargetPlayer}
                options={[...PLAYER_INDEX_OPTIONS]}
                onChange={(value) => setLightningTargetPlayer(Number(value))}
              />
              <div className={styles.settingsInlineActions}>
                <Button
                  label="ロン"
                  size="normal"
                  onClick={() => {
                    showDebugCutin(
                      "ロン",
                      lightningSourcePlayer,
                      {
                        sourcePlayer: lightningSourcePlayer,
                        targetPlayer: lightningTargetPlayer,
                        isRon: true,
                      },
                      "normal",
                      "normal",
                    );
                    onClose?.();
                  }}
                />
                <Button
                  label="ツモ"
                  size="normal"
                  onClick={() => {
                    showDebugCutin(
                      "ツモ",
                      lightningSourcePlayer,
                      {
                        sourcePlayer: lightningSourcePlayer,
                        targetPlayer: lightningSourcePlayer,
                        isRon: false,
                      },
                      "normal",
                      "normal",
                    );
                    onClose?.();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </MenuSection>
    </div>
  );
}
