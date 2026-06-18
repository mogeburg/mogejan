import styles from "@/components/Panel.module.scss";
import { SPECIAL_YAKU } from "@/constants/specialYaku";
import { BASIC_YAKU_LIST, BONUS_YAKU_LIST } from "@/constants/yaku";
import { useGameStore } from "@/store";
import { usePlayStatsStore } from "@/utils/playStats";

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

export function HistoryPanel() {
  const yakuCounts = useGameStore((s) => s.yakuCounts);
  const stats = usePlayStatsStore();

  const totalRounds = stats.totalRounds;
  const winRate =
    totalRounds > 0 ? `${((stats.wins / totalRounds) * 100).toFixed(1)}%` : "-";
  const ryuukyokuRate =
    totalRounds > 0
      ? `${((stats.ryuukyoku / totalRounds) * 100).toFixed(1)}%`
      : "-";
  const avgYaku =
    stats.wins > 0 ? `${(stats.totalYaku / stats.wins).toFixed(1)}役` : "-";
  const avgScore =
    stats.wins > 0 ? `${(stats.totalScore / stats.wins).toFixed(1)}点` : "-";
  const avgTsumo =
    stats.wins > 0
      ? `${(stats.totalTsumoCount / stats.wins).toFixed(1)}回`
      : "-";
  const totalTsumoWins = stats.tsumoWins;
  const totalRonWins = stats.ronWins;
  const winCount = `${stats.wins}回(${winRate})`;
  const ryuukyokuCount = `${stats.ryuukyoku}回(${ryuukyokuRate})`;
  const bonusYakuEntries = BONUS_YAKU_LIST.map((y) => ({
    name: y.name,
    count: yakuCounts[y.name] ?? 0,
  }));
  const basicYakuEntries = BASIC_YAKU_LIST.map((y) => ({
    name: y.name,
    count: yakuCounts[y.name] ?? 0,
  }));
  const specialYakuEntries = Object.values(SPECIAL_YAKU).map((y) => ({
    name: y.name,
    count: yakuCounts[y.name] ?? 0,
  }));
  const yakuValueEntries = Object.entries(stats.yakuValueCounts)
    .map(([value, count]) => ({
      value: Number(value),
      count,
    }))
    .sort((a, b) => a.value - b.value);

  return (
    <div className={styles.panelAlt}>
      <h3 className={styles.h3Alt}>対戦履歴</h3>
      <div className={styles.metricSection}>
        <div className={styles.metricGrid}>
          <MetricCard label="局数" value={`${totalRounds}局`} />
          <MetricCard label="和了数(率)" value={winCount} />
          <MetricCard label="流局数(率)" value={ryuukyokuCount} />
          <MetricCard label="平均ツモ数" value={avgTsumo} />
          <MetricCard label="ツモ" value={`${totalTsumoWins}回`} />
          <MetricCard label="ロン" value={`${totalRonWins}回`} />
          <MetricCard label="平均役" value={avgYaku} />
          <MetricCard label="平均点" value={avgScore} />
        </div>
      </div>

      <div className={styles.metricSection}>
        <h3 className={styles.h3Alt}>和了役数</h3>
        <div className={styles.metricGridCompact}>
          {yakuValueEntries.length > 0 ? (
            yakuValueEntries.map(({ value, count }) => (
              <MetricCard key={value} label={`${value}役`} value={`${count}回`} />
            ))
          ) : (
            <MetricCard label="未記録" value="0回" />
          )}
        </div>
      </div>

      <div className={styles.metricSection}>
        <h3 className={styles.h3Alt}>役別回数</h3>

        <div className={styles.metricSubSection}>
          <div className={styles.metricGroupTitle}>ボーナス役</div>
          <div className={styles.metricGridCompact}>
            {bonusYakuEntries.map(({ name, count }) => (
              <MetricCard key={name} label={name} value={`${count}回`} />
            ))}
          </div>
        </div>

        <div className={styles.metricSubSection}>
          <div className={styles.metricGroupTitle}>基本役</div>
          <div className={styles.metricGridCompact}>
            {basicYakuEntries.map(({ name, count }) => (
              <MetricCard key={name} label={name} value={`${count}回`} />
            ))}
          </div>
        </div>

        <div className={styles.metricSubSection}>
          <div className={styles.metricGroupTitle}>特殊役</div>
          <div className={styles.metricGridCompact}>
            {specialYakuEntries.map(({ name, count }) => (
              <MetricCard key={name} label={name} value={`${count}回`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
