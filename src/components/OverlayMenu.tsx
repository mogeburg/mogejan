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
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function OverlayMenu({
  tabs,
  footer,
  onClose,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
}: Props) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;

  function handleTabChange(index: number) {
    if (controlledActiveIndex == null) {
      setInternalActiveIndex(index);
    }
    onActiveIndexChange?.(index);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tabBar}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(i)}
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
          {tabs.map((tab, index) => (
            <div
              key={tab.label}
              className={
                index === activeIndex ? styles.contentPanelActive : styles.contentPanelHidden
              }
              aria-hidden={index !== activeIndex}
            >
              {tab.content}
            </div>
          ))}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
