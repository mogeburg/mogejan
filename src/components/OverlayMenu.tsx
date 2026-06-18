import { useState, type ReactNode } from "react";
import styles from "@/components/OverlayMenu.module.scss";

interface Tab {
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  footer?: ReactNode;
  onClose: () => void;
}

export function OverlayMenu({ tabs, footer, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tabs[activeIndex];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tabBar}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`${styles.tabBtn} ${i === activeIndex ? styles.tabActive : styles.tabInactive}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="閉じる"
        >
          ✕
        </button>
        <div className={styles.content}>
          {active.content}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
