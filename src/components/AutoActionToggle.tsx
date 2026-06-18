import { useGameStore } from "@/store";
import styles from "@/components/AutoActionToggle.module.scss";

const LABELS: Record<string, string> = {
  pon: "ポン",
  riichi: "リーチ",
  ronTsumo: "ツモ・ロン",
  cancel: "キャンセル",
};

export function AutoActionToggle() {
  const autoActions = useGameStore((s) => s.autoActions);
  const toggle = useGameStore((s) => s.toggleAutoAction);

  return (
    <div className={styles.container}>
      <div className={styles.label}>自動</div>
      <div className={styles.btnRow}>
        {(["ronTsumo", "pon"] as const).map((key) => (
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
      <div className={styles.btnRow}>
        {(["riichi", "cancel"] as const).map((key) => (
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
    </div>
  );
}
