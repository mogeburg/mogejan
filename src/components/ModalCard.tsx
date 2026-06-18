import type { ReactNode } from "react";
import styles from "@/components/ModalCard.module.scss";

interface ModalCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ModalCard({ children, className, style }: ModalCardProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.card} ${className ?? ""}`} style={style}>
        {children}
      </div>
    </div>
  );
}
