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
    <div className={styles.dataListRow}>
      <div className={`${styles.dataListCell} ${styles.dataListCellName}`}>{name}</div>
      <div className={`${styles.dataListCell} ${styles.dataListCellValue}`}>{yaku}</div>
      <div className={`${styles.dataListCell} ${styles.dataListCellDesc}`}>{desc}</div>
    </div>
  );
}

function YakuList({
  thirdColumnLabel,
  children,
}: {
  thirdColumnLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dataList}>
      <div className={`${styles.dataListRow} ${styles.dataListHead}`}>
        <div className={`${styles.dataListCell} ${styles.dataListCellName}`}>役名</div>
        <div className={`${styles.dataListCell} ${styles.dataListCellValue}`}>役</div>
        <div className={`${styles.dataListCell} ${styles.dataListCellDesc}`}>{thirdColumnLabel}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

const SpecialYakuTiles = ({ tiles }: { tiles: number[] }) => (
  <div className={styles.yakuTileCombo}>
    {tiles.flatMap((tileId) =>
      Array.from({ length: 3 }, (_, i) => (
        <TileImage key={`${tileId}-${i}`} id={tileId} size="mini" />
      )),
    )}
    {tiles.length === 2 &&
      Array.from({ length: 3 }, (_, i) => (
        <TileImage key={`fd-${i}`} id={1} size="mini" faceDown />
      ))}
  </div>
);

export function YakuListPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionStack}>
        <MenuSection title="ボーナス役（リーチ・Wリーチ以外は重複します）">
          <YakuList thirdColumnLabel="条件">
            {BONUS_YAKU_LIST.map((y) => (
              <YakuRow key={y.name} {...y} />
            ))}
          </YakuList>
        </MenuSection>

        <MenuSection title="基本役（上から順に判定を行い、重複しません）">
          <YakuList thirdColumnLabel="条件">
            {BASIC_YAKU_LIST.map((y) => (
              <YakuRow key={y.name} {...y} />
            ))}
          </YakuList>
        </MenuSection>

        <MenuSection title="特殊役">
          <YakuList thirdColumnLabel="組み合わせ">
            {Object.values(SPECIAL_YAKU).map((s) => (
              <div key={s.id} className={styles.dataListRow}>
                <div className={`${styles.dataListCell} ${styles.dataListCellName}`}>{s.name}</div>
                <div className={`${styles.dataListCell} ${styles.dataListCellValue}`}>
                  {s.yakuValue}
                </div>
                <div className={`${styles.dataListCell} ${styles.dataListCellDesc}`}>
                  <SpecialYakuTiles tiles={s.tiles} />
                </div>
              </div>
            ))}
          </YakuList>
        </MenuSection>
      </div>
    </div>
  );
}
