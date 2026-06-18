import styles from "@/components/Button.module.scss";

type ButtonColor = "normal" | "primary" | "secondary" | "tertiary" | "menu";
type ButtonSize = "normal" | "large";

const SIZE_MAP: Record<ButtonSize, string> = {
  normal: styles.sizeNormal,
  large: styles.sizeLarge,
};

const COLOR_MAP: Record<ButtonColor, string> = {
  normal: styles.normal,
  primary: styles.primary,
  secondary: styles.secondary,
  tertiary: styles.tertiary,
  menu: styles.menu,
};

interface ButtonProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  color?: ButtonColor;
  size?: ButtonSize;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Button({ label, onClick, color = "normal", size = "normal", disabled, style }: ButtonProps) {
  return (
    <button
      className={`${styles.base} ${COLOR_MAP[color]} ${SIZE_MAP[size]} ${disabled ? styles.disabled : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </button>
  );
}
