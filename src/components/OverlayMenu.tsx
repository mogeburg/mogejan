import { useState, type ReactNode } from "react";
import styles from "@/components/OverlayMenu.module.scss";

interface Tab {
  label: string;
  content: ReactNode;
}

interface Props {
  rows: Tab[][];
  footer?: ReactNode;
  onClose: () => void;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

function flatIndex(rows: Tab[][], rowIdx: number, colIdx: number): number {
  let idx = 0;
  for (let r = 0; r < rowIdx; r++) {
    idx += rows[r].length;
  }
  return idx + colIdx;
}

function allTabs(rows: Tab[][]): Tab[] {
  return rows.flat();
}

export function OverlayMenu({
  rows,
  footer,
  onClose,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
}: Props) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;
  const tabs = allTabs(rows);

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
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.tabRow}>
              {row.map((tab, colIdx) => {
                const idx = flatIndex(rows, rowIdx, colIdx);
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleTabChange(idx)}
                    className={`${styles.tabBtn} ${idx === activeIndex ? styles.tabActive : styles.tabInactive}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
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
