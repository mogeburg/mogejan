import styles from "@/components/CharacterIntroPanel.module.scss";
import { CHARACTER_ABILITY_INFO } from "@/constants/characterInfo";
import { TileData } from "@/constants/tiles";
import { cutinImageUrl } from "@/utils/assets";

export function CharacterIntroPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        {TileData.map((tile) => {
          const info = CHARACTER_ABILITY_INFO[tile.id];
          return (
            <div
              key={tile.id}
              className={styles.card}
              style={{ background: tile.colorHex }}
            >
              <div className={styles.imageWrapper}>
                <img
                  className={styles.cutinImage}
                  src={cutinImageUrl(tile.id)}
                  alt={tile.name}
                  loading="lazy"
                />
                <div className={styles.nameBox}>
                  <h2 className={styles.name}>{tile.name}</h2>
                  <h3 className={styles.abilityName}>{info.abilityName}</h3>
                </div>
                {info && (
                  <div className={styles.abilityBox}>
                    <div className={styles.abilityDetail}>
                      <span className={styles.detailLabel}>発動タイミング</span>
                      <span>{info.timing}</span>
                    </div>
                    {info.conditions && info.conditions.length > 0 && (
                      <div className={styles.abilityDetail}>
                        <span className={styles.detailLabel}>条件</span>
                        <span>
                          {info.conditions.map((condition, i) => (
                            <div key={i}>
                              {i !== 0 && "かつ "}
                              {condition}
                            </div>
                          ))}
                        </span>
                      </div>
                    )}
                    <div className={styles.abilityDetail}>
                      <span className={styles.detailLabel}>効果</span>
                      <span>{info.effect}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
