import { MenuSection } from "@/components/MenuSection";
import styles from "@/components/Panel.module.scss";
import { TileImage } from "@/components/TileImage";
import {
  TileData,
  TREND_COPIES,
  TREND_KINDS_PER_ROUND,
  TREND_TILE_START,
  TrendTileData,
} from "@/constants/tiles";

export function RulesPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionStack}>
        <MenuSection title="概要">
          <p className={styles.compactNote}>
            もげじゃんは、生まれたばかりの麻雀風ドンジャラです。
            <br />
            応援して下さいね☆
            <br />
            お友達にもこのゲームを教えてあげて下さいね。
            <br />
          </p>
        </MenuSection>

        <MenuSection title="ルール">
          <div className={styles.linkList}>
            <a
              className={styles.linkChip}
              href="https://ja.wikipedia.org/wiki/%E3%83%9D%E3%83%B3%E3%82%B8%E3%83%A3%E3%83%B3"
              target="_blank"
              rel="noopener noreferrer"
            >
              ポンジャン - Wikipedia
            </a>
            <a
              className={styles.linkChip}
              href="https://ja.wikipedia.org/wiki/%E9%BA%BB%E9%9B%80"
              target="_blank"
              rel="noopener noreferrer"
            >
              麻雀 - Wikipedia
            </a>
          </div>
        </MenuSection>

        <MenuSection title="もうちょっと教えて">
          <p className={styles.compactNote}>
            雀士へ：基本リーチ必須（面前以外でもリーチ可、面前時裏ドラ有）、刻子のみ、役牌（流行牌）あり
            <br />
            初心者へ：とにかく同じ絵を3枚ずつ揃えよう！赤か青のボタンが出たらドンドン押そう！
            <br />
            ドンジャラーへ：全然ドンジャラじゃないけど許してくれるね、ありがとう。グッドもげじゃん。
          </p>
        </MenuSection>

        <MenuSection title="牌について">
          <p className={styles.compactNote}>
            使用する牌は基本牌81枚（9種 x 9枚）と流行牌16枚（4種 x
            4枚）の計97枚。
          </p>
          <div className={styles.tileGridPanelTight}>
            {TileData.map((tile, i) => (
              <TileImage key={tile.id} id={i * 9 + 1} size="small" />
            ))}
            {TrendTileData.slice(0, TREND_KINDS_PER_ROUND).map((tile, i) => (
              <TileImage
                key={tile.id}
                id={TREND_TILE_START + i * 2 * TREND_COPIES}
                size="small"
              />
            ))}
          </div>
          <p className={styles.compactNote}>
            流行牌は12種類の中から1局が始まる際に抽選が行われ、ランダムに選ばれた4種が使用されます。
          </p>
          <div className={styles.tileGridPanelTight}>
            {TrendTileData.map((tile, i) => (
              <TileImage
                key={tile.id}
                id={TREND_TILE_START + i * TREND_COPIES}
                size="small"
              />
            ))}
          </div>
        </MenuSection>
      </div>
    </div>
  );
}
