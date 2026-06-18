import styles from "@/components/SliderInput.module.scss";

interface SliderInputProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function SliderInput({ label, min, max, value, onChange }: SliderInputProps) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
