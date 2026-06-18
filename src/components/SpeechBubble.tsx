import { motion } from "framer-motion";
import styles from "@/components/SpeechBubble.module.scss";

interface SpeechBubbleProps {
  text: string;
}

export function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.1, ease: "easeOut", layout: { duration: 0.1, ease: "easeOut" } }}
      layout
    >
      <span className={styles.text}>{text}</span>
      <div className={styles.tail} />
    </motion.div>
  );
}