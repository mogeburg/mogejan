import styles from "@/components/Range.module.scss";

interface RangeProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function Range({ label, min, max, value, onChange }: RangeProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.row}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.trackWrap}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={styles.input}
        />
      </div>
    </div>
  );
}
