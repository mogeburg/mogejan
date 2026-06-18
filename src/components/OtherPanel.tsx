import { MenuSection } from "@/components/MenuSection";
import styles from "@/components/Panel.module.scss";
import { VERSION_HISTORY } from "@/constants/versionHistory";
import type { VersionHistoryEntry } from "@/constants/versionHistory";

function formatVersionLabel(version: string) {
  return version.startsWith("v") ? version : `v${version}`;
}

function renderVersionSummary(summary?: string | string[]) {
  if (!summary) return null;

  if (Array.isArray(summary)) {
    return (
      <ul className={styles.versionHistorySummaryList}>
        {summary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <span className={styles.versionHistoryText}>{summary}</span>;
}

function renderVersionHistoryEntry(entry: VersionHistoryEntry) {
  const label = (
    <span className={styles.versionHistoryLabel}>
      {formatVersionLabel(entry.version)}
    </span>
  );

  if (entry.children?.length) {
    return (
      <li key={entry.version}>
        <details className={styles.versionHistoryFold} open={entry.defaultOpen}>
          <summary className={styles.versionHistorySummary}>{label}</summary>
          <ul className={styles.versionHistoryList}>
            {entry.children.map((child) => renderVersionHistoryEntry(child))}
          </ul>
        </details>
      </li>
    );
  }

  return (
    <li key={entry.version}>
      {label}
      {renderVersionSummary(entry.summary)}
    </li>
  );
}

export function OtherPanel() {
  return (
    <div className={styles.panelAlt}>
      <div className={styles.sectionStack}>
        <MenuSection title="バージョン履歴">
          <ul className={styles.versionHistoryTree}>
            {VERSION_HISTORY.map((entry) => renderVersionHistoryEntry(entry))}
          </ul>
        </MenuSection>

        <MenuSection title="クレジット">
          <div className={styles.creditGrid}>
            <div className={styles.creditCard}>
              <h4 className={styles.creditTitle}>キャラクターなど</h4>
              <div className={styles.creditBody}>
                <ul className={styles.creditList}>
                  <li>
                    <a
                      className={styles.creditLink}
                      href="https://nijiurachan.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      二次元裏@αimg(あいもげ)
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles.creditCard}>
              <h4 className={styles.creditTitle}>BGM</h4>
              <div className={styles.creditBody}>
                <ul className={styles.creditList}>
                  <li>あいもげ市民作の物を無断利用</li>
                  <li>Suno</li>
                  <li>Google Flow Music</li>
                </ul>
              </div>
            </div>

            <div className={styles.creditCard}>
              <h4 className={styles.creditTitle}>SE・ボイス</h4>
              <div className={styles.creditBody}>
                <ul className={styles.creditList}>
                  <li>
                    <a
                      className={styles.creditLink}
                      href="https://soundeffect-lab.info/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      効果音ラボ
                    </a>
                  </li>
                  <li>
                    <a
                      className={styles.creditLink}
                      href="http://notanomori.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ノタの森
                    </a>
                  </li>
                  <li>
                    <a
                      className={styles.creditLink}
                      href="https://ondoku3.com/ja/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      音読さん
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles.creditCard}>
              <h4 className={styles.creditTitle}>その他</h4>
              <div className={styles.creditBody}>
                <ul className={styles.creditList}>
                  <li>
                    <a
                      className={styles.creditLink}
                      href="https://mogejan.netlify.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      v0.0111
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </MenuSection>
      </div>
    </div>
  );
}
