import styles from "@/components/SelectBox.module.scss";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectBoxProps {
  label?: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
}

export function SelectBox({ label, value, options, onChange }: SelectBoxProps) {
  return (
    <div className={styles.row}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.wrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}
