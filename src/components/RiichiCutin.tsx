import { motion } from "framer-motion";
import styles from "@/components/RiichiCutin.module.scss";
import { useGameStore } from "@/store";
import { tileImageUrl as getTileImageUrl } from "@/utils/assets";

export function RiichiCutin() {
  const riichiCutinPlayer = useGameStore((s) => s.riichiCutinPlayer);
  const setRiichiCutin = useGameStore((s) => s.setRiichiCutin);
  const players = useGameStore((s) => s.players);

  if (riichiCutinPlayer == null) return null;

  const imageUrl = getTileImageUrl(players[riichiCutinPlayer].charId);

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.bar}
        initial={{ height: 1 }}
        animate={{ height: [1, 90, 90, 1] }}
        transition={{
          duration: 1,
          times: [0, 0.1, 0.9, 1],
          ease: "easeInOut",
        }}
        onAnimationComplete={() => setRiichiCutin(null)}
      >
        <motion.div
          className={styles.inner}
          initial={{ x: "300%" }}
          animate={{ x: ["300%", "5px", "-5px", "-100%"] }}
          transition={{
            duration: 1,
            times: [0, 0.15, 0.85, 1],
            ease: ["easeOut", "linear", "easeIn"],
          }}
        >
          <img src={imageUrl} alt="" className={styles.tileImage} />
          <span className={styles.text}>リーチ</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
