import styles from "@/components/ModeToggle.module.scss";

interface ModeItem {
  label: string;
  disabled?: boolean;
}

interface ModeToggleProps {
  items: ModeItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  compact?: boolean;
}

export function ModeToggle({
  items,
  activeIndex,
  onChange,
  compact = false,
}: ModeToggleProps) {
  const rowClass = [styles.row, compact ? styles.rowCompact : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClass}>
      {items.map((item, i) => {
        const active = i === activeIndex;
        const cls = [
          styles.btn,
          active ? styles.active : "",
          !active && !item.disabled ? styles.inactive : "",
          item.disabled ? styles.disabled : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={i}
            className={cls}
            disabled={item.disabled}
            onClick={() => onChange(i)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
