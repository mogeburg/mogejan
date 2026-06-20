import styles from "@/components/AutoActionToggle.module.scss";
import { useGameStore } from "@/store";

const LABELS: Record<string, string> = {
  pon: "ポン",
  riichi: "リーチ",
  ronTsumo: "アガリ",
  cancel: "キャンセル",
};

export function AutoActionToggle() {
  const autoActions = useGameStore((s) => s.autoActions);
  const toggle = useGameStore((s) => s.toggleAutoAction);

  return (
    <div className={styles.container}>
      <div className={styles.label}>自動</div>
      {(["ronTsumo", "pon", "riichi", "cancel"] as const).map((key) => (
        <button
          key={key}
          className={`${styles.btn} ${autoActions[key] ? styles.on : styles.off}`}
          onClick={() => toggle(key)}
          type="button"
        >
          {LABELS[key]}
        </button>
      ))}
    </div>
  );
}
