import styles from "@/components/CheckboxButton.module.scss";

interface CheckboxButtonProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function CheckboxButton({ label, checked, onChange }: CheckboxButtonProps) {
  return (
    <button
      className={`${styles.base} ${checked ? styles.checked : styles.unchecked}`}
      onClick={onChange}
      type="button"
    >
      {label}
    </button>
  );
}
