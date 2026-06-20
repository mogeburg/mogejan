import type { ReactNode } from "react";
import styles from "@/components/FieldLabel.module.scss";

interface FieldLabelProps {
  children: ReactNode;
  className?: string;
}

export function FieldLabel({ children, className }: FieldLabelProps) {
  const classes = [styles.label, className].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
