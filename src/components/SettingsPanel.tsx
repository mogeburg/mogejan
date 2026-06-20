import { FieldLabel } from "@/components/FieldLabel";
import { MenuSection } from "@/components/MenuSection";
import { ModeToggle } from "@/components/ModeToggle";
import styles from "@/components/Panel.module.scss";
import { Range } from "@/components/Range";
import { SelectBox } from "@/components/SelectBox";
import type { BgmKey, CpuStrength } from "@/constants/game";
import {
  BGM,
  BGM_NORMAL_KEYS,
  BGM_SELECTABLE_KEYS,
  CPU_STRENGTH_LABELS,
  CPU_STRENGTHS,
  TEXT_SIZE_LABELS,
  TEXT_SIZES,
} from "@/constants/game";
import { useGameStore } from "@/store";

const CPU_STRENGTH_OPTIONS = CPU_STRENGTHS.map((strength) => ({
  value: strength,
  label: CPU_STRENGTH_LABELS[strength],
}));

const TEXT_SIZE_OPTIONS = TEXT_SIZES.map((textSize) => ({
  value: textSize,
  label: TEXT_SIZE_LABELS[textSize],
}));

const RIICHI_AVATAR_OPTIONS = [
  { value: "none", label: "なし" },
  { value: "kanimoge", label: "かにもげ" },
  { value: "burumoge", label: "ぶるもげ" },
] as const;

const SPEED_OPTIONS = [
  { value: 1, label: "激遅" },
  { value: 2, label: "遅い" },
  { value: 3, label: "普通" },
  { value: 4, label: "早い" },
  { value: 5, label: "爆速" },
] as const;

type ToggleOption<T extends string | number> = {
  value: T;
  label: string;
  disabled?: boolean;
};

function ToggleSetting<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly ToggleOption<T>[];
  onChange: (value: T) => void;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <>
      <FieldLabel className={styles.settingsSubLabel}>{label}</FieldLabel>
      <ModeToggle
        compact
        items={options.map((option) => ({
          label: option.label,
          disabled: option.disabled,
        }))}
        activeIndex={activeIndex}
        onChange={(index) => onChange(options[index].value)}
      />
    </>
  );
}

export function SettingsPanel() {
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const textSize = useGameStore((s) => s.textSize);
  const setTextSize = useGameStore((s) => s.setTextSize);
  const cpuStrength = useGameStore((s) => s.cpuStrength);
  const setCpuStrength = useGameStore((s) => s.setCpuStrength);
  const masterVolume = useGameStore((s) => s.masterVolume);
  const bgmVolume = useGameStore((s) => s.bgmVolume);
  const seVolume = useGameStore((s) => s.seVolume);
  const voiceVolume = useGameStore((s) => s.voiceVolume);
  const setMasterVolume = useGameStore((s) => s.setMasterVolume);
  const setBgmVolume = useGameStore((s) => s.setBgmVolume);
  const setSeVolume = useGameStore((s) => s.setSeVolume);
  const setVoiceVolume = useGameStore((s) => s.setVoiceVolume);
  const normalBgmSetting = useGameStore((s) => s.normalBgmSetting);
  const setNormalBgmSetting = useGameStore((s) => s.setNormalBgmSetting);
  const riichiBgmSetting = useGameStore((s) => s.riichiBgmSetting);
  const setRiichiBgmSetting = useGameStore((s) => s.setRiichiBgmSetting);
  const riichiAvatar = useGameStore((s) => s.riichiAvatar);
  const setRiichiAvatar = useGameStore((s) => s.setRiichiAvatar);

  return (
    <div className={styles.panelSettings}>
      <div className={styles.settingsColumns}>
        <div className={styles.settingsLeft}>
          <MenuSection title="設定">
            <div className={styles.sectionStack}>
              <div className={styles.settingsSurface}>
                <ToggleSetting
                  label="文字サイズ"
                  value={textSize}
                  options={TEXT_SIZE_OPTIONS}
                  onChange={(value) => setTextSize(value as typeof textSize)}
                />
              </div>

              <div className={styles.settingsSurface}>
                <ToggleSetting
                  label="速度"
                  value={speed}
                  options={SPEED_OPTIONS}
                  onChange={(value) => setSpeed(value as number)}
                />
              </div>

              <div className={styles.settingsSurface}>
                <SelectBox
                  label="通常BGM"
                  value={normalBgmSetting}
                  options={BGM_NORMAL_KEYS.map((k) => ({
                    value: k,
                    label: BGM[k].label,
                  }))}
                  onChange={(v) => setNormalBgmSetting(v as BgmKey)}
                />
              </div>

              <div className={styles.settingsSurface}>
                <SelectBox
                  label="リーチBGM"
                  value={riichiBgmSetting}
                  options={BGM_SELECTABLE_KEYS.map((k) => ({
                    value: k,
                    label: BGM[k].label,
                  }))}
                  onChange={(v) => setRiichiBgmSetting(v as BgmKey)}
                />
              </div>

              <div className={styles.settingsSurface}>
                <ToggleSetting
                  label="CPUの強さ"
                  value={cpuStrength}
                  options={CPU_STRENGTH_OPTIONS}
                  onChange={(value) => setCpuStrength(value as CpuStrength)}
                />
              </div>

              <div className={styles.settingsSurface}>
                <ToggleSetting
                  label="リーチアバター"
                  value={riichiAvatar}
                  options={RIICHI_AVATAR_OPTIONS}
                  onChange={(value) =>
                    setRiichiAvatar(value as "none" | "kanimoge" | "burumoge")
                  }
                />
              </div>
            </div>
          </MenuSection>
        </div>

        <div className={styles.settingsRight}>
          <MenuSection title="音量">
            <div className={styles.sectionStack}>
              <div className={styles.settingsSurface}>
                <Range
                  label="マスター音量"
                  min={0}
                  max={100}
                  value={masterVolume}
                  onChange={setMasterVolume}
                />
              </div>
              <div className={styles.settingsSurface}>
                <Range
                  label="BGM 音量"
                  min={0}
                  max={100}
                  value={bgmVolume}
                  onChange={setBgmVolume}
                />
              </div>
              <div className={styles.settingsSurface}>
                <Range
                  label="SE 音量"
                  min={0}
                  max={100}
                  value={seVolume}
                  onChange={setSeVolume}
                />
              </div>
              <div className={styles.settingsSurface}>
                <Range
                  label="声 音量"
                  min={0}
                  max={100}
                  value={voiceVolume}
                  onChange={setVoiceVolume}
                />
              </div>
            </div>
          </MenuSection>
        </div>
      </div>
    </div>
  );
}
