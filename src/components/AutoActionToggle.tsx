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
  const open = useGameStore((s) => s.autoActionTrayOpen);
  const setOpen = useGameStore((s) => s.setAutoActionTrayOpen);

  return (
    <div
      className={`${styles.container} ${open ? styles.open : styles.closed}`}
    >
      <div className={styles.wrapper}>
        <button
          className={styles.toggle}
          onClick={() => setOpen(!open)}
          type="button"
        >
          {open ? "▶自動" : "◀自動"}
        </button>
        <div className={styles.panel}>
          {(["ronTsumo", "riichi", "pon", "cancel"] as const).map((key) => (
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
    </div>
  );
}
