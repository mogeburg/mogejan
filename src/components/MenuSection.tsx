import type { ReactNode } from "react";
import styles from "@/components/Panel.module.scss";

export function MenuIntro({
  title,
  description,
  aside,
}: {
  title: string;
  description: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={styles.menuIntro}>
      <div className={styles.menuIntroMain}>
        <h2 className={styles.menuTitle}>{title}</h2>
        <div className={styles.menuLead}>{description}</div>
      </div>
      {aside && <div className={styles.menuIntroAside}>{aside}</div>}
    </div>
  );
}

export function MenuSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.menuSection}>
      <div className={styles.menuSectionHeader}>
        <h3 className={styles.menuSectionTitle}>{title}</h3>
        {description && <div className={styles.menuSectionDescription}>{description}</div>}
      </div>
      <div className={styles.menuSectionBody}>{children}</div>
    </section>
  );
}
