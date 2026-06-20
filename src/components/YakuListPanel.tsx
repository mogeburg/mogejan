import { MenuSection } from "@/components/MenuSection";
import { SPECIAL_YAKU } from "@/constants/specialYaku";
import { BASIC_YAKU_LIST, BONUS_YAKU_LIST } from "@/constants/yaku";
import { TileImage } from "@/components/TileImage";
import styles from "@/components/Panel.module.scss";

function YakuRow({
  name,
  yaku,
  desc,
}: {
  name: string;
  yaku: number;
  desc: string;
}) {
  return (
    <tr className={styles.tr}>
      <td className={`${styles.td} ${styles.tdNowrap}`}>{name}</td>
      <td className={styles.tdCenter}>{yaku}</td>
      <td className={styles.tdDesc}>{desc}</td>
    </tr>
  );
}

const tableHead = (
  <thead>
    <tr className={styles.trHead}>
      <th className={`${styles.th} ${styles.thNowrap}`}>役名</th>
      <th className={styles.thCenter}>役</th>
      <th className={styles.th}>条件</th>
    </tr>
  </thead>
);

export function YakuListPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionStack}>
        <MenuSection title="ボーナス役（リーチ・Wリーチ以外は重複します）">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              {tableHead}
              <tbody>
                {BONUS_YAKU_LIST.map((y) => (
                  <YakuRow key={y.name} {...y} />
                ))}
              </tbody>
            </table>
          </div>
        </MenuSection>

        <MenuSection title="基本役（上から順に判定を行い、重複しません）">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              {tableHead}
              <tbody>
                {BASIC_YAKU_LIST.map((y) => (
                  <YakuRow key={y.name} {...y} />
                ))}
              </tbody>
            </table>
          </div>
        </MenuSection>

        <MenuSection title="特殊役">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.trHead}>
                  <th className={`${styles.th} ${styles.thNowrap}`}>役名</th>
                  <th className={styles.thCenter}>役</th>
                  <th className={styles.th}>組み合わせ</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(SPECIAL_YAKU).map((s) => (
                  <tr key={s.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdNowrap}`}>{s.name}</td>
                    <td className={styles.tdCenter}>{s.yakuValue}</td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {s.tiles.flatMap((tileId) =>
                          Array.from({ length: 3 }, (_, i) => (
                            <TileImage key={`${tileId}-${i}`} id={tileId} size="mini" />
                          )),
                        )}
                        {s.tiles.length === 2 &&
                          Array.from({ length: 3 }, (_, i) => (
                            <TileImage key={`fd-${i}`} id={1} size="mini" faceDown />
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MenuSection>
      </div>
    </div>
  );
}
