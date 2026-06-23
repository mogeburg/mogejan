import { ABILITY_MAX_GAUGE } from "@/constants/abilities";
import { INITIAL_HAND_TILE_COUNT } from "@/constants/game";
import { TileData, TrendTileData, TREND_TILE_START, TREND_KINDS, findTileDataById } from "@/constants/tiles";
import { useGameStore } from "@/store";
import type { TestConfig } from "@/types/testConfig";
import { createHands } from "@/utils/tiles";
import { useCallback, useMemo, useState } from "react";

const BASIC_TILE_KIND_COUNT = 9;
const TILE_COPIES_PER_KIND = 9;
const TREND_COPIES = 4;

function colorCounts(tiles: number[]): number[] {
  const counts = new Array(BASIC_TILE_KIND_COUNT + TREND_KINDS).fill(0);
  for (const id of tiles) {
    const colorIndex = Math.floor((id - 1) / TILE_COPIES_PER_KIND);
    if (colorIndex >= 0 && colorIndex < BASIC_TILE_KIND_COUNT) {
      counts[colorIndex]++;
    } else {
      const trendIndex = Math.floor((id - TREND_TILE_START) / TREND_COPIES);
      if (trendIndex >= 0 && trendIndex < TREND_KINDS) {
        counts[BASIC_TILE_KIND_COUNT + trendIndex]++;
      }
    }
  }
  return counts;
}

function adjustHandTiles(
  hand: number[],
  targetCounts: number[],
  globalUsed: Set<number>,
  maxTotal = INITIAL_HAND_TILE_COUNT,
): number[] {
  const currentCounts = colorCounts(hand);
  const targetTotal = targetCounts.reduce((a, c) => a + c, 0);
  if (targetTotal > maxTotal) return [...hand];
  const result = [...hand];
  const totalColors = BASIC_TILE_KIND_COUNT + TREND_KINDS;

  for (let color = 0; color < totalColors; color++) {
    const current = currentCounts[color] ?? 0;
    const target = targetCounts[color] ?? 0;
    if (target === current) continue;

    if (target < current) {
      const toRemove = current - target;
      const sorted = result
        .map((id, idx) => ({ id, idx }))
        .filter(({ id }) => {
          if (color < BASIC_TILE_KIND_COUNT) {
            return Math.floor((id - 1) / TILE_COPIES_PER_KIND) === color;
          }
          const trendIdx = Math.floor((id - TREND_TILE_START) / TREND_COPIES);
          return trendIdx === color - BASIC_TILE_KIND_COUNT;
        })
        .sort((a, b) => b.id - a.id);
      for (let r = 0; r < toRemove && r < sorted.length; r++) {
        const idx = result.indexOf(sorted[r].id);
        if (idx !== -1) result.splice(idx, 1);
      }
    } else {
      const toAdd = target - current;
      const maxCopies = color < BASIC_TILE_KIND_COUNT ? TILE_COPIES_PER_KIND : TREND_COPIES;
      let added = 0;
      for (let c = 0; c < maxCopies && added < toAdd; c++) {
        const id = color < BASIC_TILE_KIND_COUNT
          ? color * TILE_COPIES_PER_KIND + 1 + c
          : TREND_TILE_START + (color - BASIC_TILE_KIND_COUNT) * TREND_COPIES + c;
        if (!globalUsed.has(id) && !result.includes(id)) {
          result.push(id);
          added++;
        }
      }
    }
  }

  return result.sort((a, b) => a - b);
}

const BASE_CONFIG: Pick<TestConfig, "version" | "players" | "doraTile" | "uradoraTile" | "trendTypes"> = {
  version: 1,
  players: [
    { charId: "aimoge", type: "human", abilityGauge: 100 },
    { charId: "burumoge", type: "cpu", abilityGauge: 100 },
    { charId: "miimoge", type: "cpu", abilityGauge: 100 },
    { charId: "pikasan", type: "cpu", abilityGauge: 100 },
  ],
  doraTile: 1,
  uradoraTile: 1,
  trendTypes: [0, 1, 2, 3],
};

function createInitialConfig(): TestConfig {
  const trendTypes = [0, 1, 2, 3];
  const { hands, wall } = createHands(trendTypes);
  const doraTile = wall.at(-2) ?? 1;
  const uradoraTile = wall.at(-1) ?? 1;
  const wallWithoutDora = wall.slice(0, -2);
  return {
    ...BASE_CONFIG,
    hands: hands.map((h) => [...h]),
    wall: wallWithoutDora,
    doraTile,
    uradoraTile,
    trendTypes,
  };
}

const TEMPLATES_STORAGE_KEY = "testConfigTemplates";

interface SavedTemplate {
  name: string;
  json: string;
}

function loadTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function jsonStringify(config: TestConfig): string {
  return JSON.stringify(config, null, 2);
}

function tryParseJson(text: string): TestConfig | null {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.version === 1 && Array.isArray(obj.players)) return obj as TestConfig;
    return null;
  } catch {
    return null;
  }
}

function getUsedTiles(config: TestConfig): Set<number> {
  const used = new Set<number>();
  for (const hand of config.hands) {
    for (const tile of hand) used.add(tile);
  }
  for (const tile of config.wall) used.add(tile);
  used.add(config.doraTile);
  used.add(config.uradoraTile);
  return used;
}

function getAvailableTiles(config: TestConfig): number[] {
  const used = getUsedTiles(config);
  const allBasic = Array.from({ length: 81 }, (_, i) => i + 1);
  const allTrend: number[] = [];
  for (const t of config.trendTypes) {
    for (let c = 0; c < TREND_COPIES; c++) {
      allTrend.push(TREND_TILE_START + t * TREND_COPIES + c);
    }
  }
  return [...allBasic, ...allTrend].filter((t) => !used.has(t));
}

type TileImgProps = {
  id: number;
  selected?: boolean;
  onClick?: () => void;
  size?: number;
};

function TileImg({ id, selected, onClick, size = 36 }: TileImgProps) {
  const info = findTileDataById(id);
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: Math.round(size * 1.2),
        borderRadius: 3,
        backgroundImage: `url(${info.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: info.colorHex,
        border: selected ? "2px solid #ff0" : "2px solid #2e3d24",
        cursor: onClick ? "pointer" : undefined,
        flexShrink: 0,
        transition: "border 0.15s",
      }}
      title={`${info.name} (${id})`}
    />
  );
}

export function TestConfigScreen() {
  const startTestGame = useGameStore((s) => s.startTestGame);
  const goTo = useGameStore((s) => s.goTo);
  const setSpecialAbilitiesEnabled = useGameStore((s) => s.setSpecialAbilitiesEnabled);

  const [config, setConfig] = useState<TestConfig>(createInitialConfig);
  const [jsonText, setJsonText] = useState(() => jsonStringify(config));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSuperEastSouth, setIsSuperEastSouth] = useState(false);
  const [templates, setTemplates] = useState<SavedTemplate[]>(loadTemplates);

  const updateConfig = useCallback((patch: Partial<TestConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      setJsonText(jsonStringify(next));
      setJsonError(null);
      return next;
    });
  }, []);

  const updatePlayer = useCallback(
    (index: number, patch: Partial<TestConfig["players"][number]>) => {
      setConfig((prev) => {
        const players = prev.players.map((p, i) =>
          i === index ? { ...p, ...patch } : p,
        );
        const next = { ...prev, players };
        setJsonText(jsonStringify(next));
        setJsonError(null);
        return next;
      });
    },
    [],
  );

  const updateHand = useCallback(
    (playerIndex: number, counts: number[]) => {
      setConfig((prev) => {
        const globalUsed = new Set<number>();
        for (const [i, hand] of prev.hands.entries()) {
          if (i === playerIndex) continue;
          for (const tile of hand) globalUsed.add(tile);
        }
        for (const tile of prev.wall) globalUsed.add(tile);
        globalUsed.add(prev.doraTile);
        globalUsed.add(prev.uradoraTile);
        const newTiles = adjustHandTiles(prev.hands[playerIndex], counts, globalUsed);
        const hands = prev.hands.map((h, i) =>
          i === playerIndex ? newTiles : h,
        );
        const next = { ...prev, hands };
        setJsonText(jsonStringify(next));
        setJsonError(null);
        return next;
      });
    },
    [],
  );

  const updateWallTiles = useCallback(
    (newWall: number[]) => {
      setConfig((prev) => {
        const next = { ...prev, wall: newWall };
        setJsonText(jsonStringify(next));
        setJsonError(null);
        return next;
      });
    },
    [],
  );

  const handleDeal = useCallback(() => {
    const trendTypes = config.trendTypes;
    const { hands, wall } = createHands(trendTypes);
    const doraTile = wall.at(-2) ?? 1;
    const uradoraTile = wall.at(-1) ?? 1;
    const wallWithoutDora = wall.slice(0, -2);
    const newHands = hands.map((h) => [...h]);
    const next: TestConfig = {
      ...config,
      hands: newHands,
      wall: wallWithoutDora,
      doraTile,
      uradoraTile,
      trendTypes,
    };
    setConfig(next);
    setJsonText(jsonStringify(next));
    setJsonError(null);
  }, [config]);

  const handleReset = useCallback(() => {
    setConfig((prev) => {
      const next = {
        ...prev,
        hands: [[], [], [], []],
        wall: [],
        doraTile: 1,
        uradoraTile: 1,
      };
      setJsonText(jsonStringify(next));
      setJsonError(null);
      return next;
    });
  }, []);

  const handleSaveTemplate = useCallback(() => {
    const name = window.prompt("テンプレート名を入力");
    if (!name) return;
    const next = [...templates, { name, json: jsonText }];
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  }, [templates, jsonText]);

  const handleLoadTemplate = useCallback((tpl: SavedTemplate) => {
    const parsed = tryParseJson(tpl.json);
    if (parsed) {
      setConfig(parsed);
      setJsonText(tpl.json);
      setJsonError(null);
    }
  }, []);

  const handleDeleteTemplate = useCallback((index: number) => {
    const next = templates.filter((_, i) => i !== index);
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  }, [templates]);

  const handleJsonImport = useCallback(() => {
    const parsed = tryParseJson(jsonText);
    if (parsed) {
      setConfig(parsed);
      setJsonError(null);
    } else {
      setJsonError("JSONの形式が正しくありません");
    }
  }, [jsonText]);

  const handleStart = useCallback(() => {
    const parsed = tryParseJson(jsonText);
    if (parsed) {
      setSpecialAbilitiesEnabled(isSuperEastSouth);
      startTestGame(parsed);
    } else {
      setJsonError("設定にエラーがあります");
    }
  }, [jsonText, startTestGame, setSpecialAbilitiesEnabled, isSuperEastSouth]);

  const allBasicTiles = useMemo(
    () => TileData.map((_, i) => i * TILE_COPIES_PER_KIND + 1),
    [],
  );

  const availableTiles = useMemo(() => getAvailableTiles(config), [config]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#0a1628", color: "#fff",
      display: "flex", flexDirection: "column",
      padding: 16, gap: 12, overflow: "auto",
      fontFamily: "sans-serif", fontSize: 13,
    }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>テスト設定</h1>

      {/* Player section */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {config.players.map((player, i) => (
          <div key={i} style={{
            flex: "1 1 220px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8, padding: 10,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>P{i + 1}</div>
            <select
              value={player.charId}
              onChange={(e) => updatePlayer(i, { charId: e.target.value })}
              style={{ background: "#1a2a44", color: "#fff", border: "1px solid #334", borderRadius: 4, padding: "2px 4px" }}
            >
              {TileData.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>操作:</span>
              <button
                onClick={() => updatePlayer(i, { type: "human" })}
                style={{
                  flex: 1, padding: "2px 6px", borderRadius: 4, border: "1px solid #556",
                  background: player.type === "human" ? "#2a6" : "#1a2a44",
                  color: "#fff", cursor: "pointer", fontSize: 11,
                }}
              >人間</button>
              <button
                onClick={() => updatePlayer(i, { type: "cpu" })}
                style={{
                  flex: 1, padding: "2px 6px", borderRadius: 4, border: "1px solid #556",
                  background: player.type === "cpu" ? "#26a" : "#1a2a44",
                  color: "#fff", cursor: "pointer", fontSize: 11,
                }}
              >CPU</button>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>ゲージ:</span>
              <input
                type="range"
                min={0}
                max={ABILITY_MAX_GAUGE}
                value={player.abilityGauge}
                onChange={(e) => updatePlayer(i, { abilityGauge: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 11, minWidth: 28, textAlign: "right" }}>
                {player.abilityGauge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={handleDeal}
          style={{
            padding: "6px 16px", borderRadius: 6, border: "none",
            background: "#3a6", color: "#fff", cursor: "pointer", fontWeight: "bold",
          }}
        >手牌を自動配布</button>
        <button
          onClick={handleReset}
          style={{
            padding: "6px 16px", borderRadius: 6, border: "1px solid #556",
            background: "#1a2a44", color: "#fff", cursor: "pointer",
          }}
        >初期状態に戻す</button>
      </div>

      {/* Hand editors */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {config.hands.map((hand, i) => (
          <HandEditor
            key={i}
            label={`P${i + 1} 手牌 (${hand.length}枚)`}
            hand={hand}
            counts={colorCounts(hand)}
            trendTypes={config.trendTypes}
            maxTotal={INITIAL_HAND_TILE_COUNT}
            onChange={(counts) => updateHand(i, counts)}
          />
        ))}
      </div>

      {/* Wall sequencer */}
      <WallSequencer
        wall={config.wall}
        availableTiles={availableTiles}
        onChange={updateWallTiles}
      />

      {/* Dora / Trend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>ドラ:</span>
          <select
            value={config.doraTile}
            onChange={(e) => updateConfig({ doraTile: Number(e.target.value) })}
            style={{ background: "#1a2a44", color: "#fff", border: "1px solid #334", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}
          >
            {allBasicTiles.map((id) => (
              <option key={id} value={id}>{TileData[Math.floor((id - 1) / TILE_COPIES_PER_KIND)].name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>裏ドラ:</span>
          <select
            value={config.uradoraTile}
            onChange={(e) => updateConfig({ uradoraTile: Number(e.target.value) })}
            style={{ background: "#1a2a44", color: "#fff", border: "1px solid #334", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}
          >
            {allBasicTiles.map((id) => (
              <option key={id} value={id}>{TileData[Math.floor((id - 1) / TILE_COPIES_PER_KIND)].name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>流行牌:</span>
          {[0, 1, 2, 3].map((slot) => (
            <select
              key={slot}
              value={config.trendTypes[slot] ?? 0}
              onChange={(e) => {
                const newVal = Number(e.target.value);
                const trendTypes = [...config.trendTypes];
                trendTypes[slot] = newVal;
                updateConfig({ trendTypes });
              }}
              style={{ background: "#1a2a44", color: "#fff", border: "1px solid #334", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}
            >
              {TrendTileData.map((t, i) => (
                <option key={t.id} value={i}>{t.name}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* JSON editor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>JSON</span>
          <button
            onClick={handleJsonImport}
            style={{
              padding: "2px 10px", borderRadius: 4, border: "1px solid #556",
              background: "#1a2a44", color: "#fff", cursor: "pointer", fontSize: 11,
            }}
          >インポート</button>
          {jsonError && <span style={{ color: "#f66", fontSize: 11 }}>{jsonError}</span>}
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          style={{
            width: "100%", minHeight: 120,
            background: "#0d1b33", color: "#8cf", border: "1px solid #335",
            borderRadius: 4, padding: 8, fontSize: 11, fontFamily: "monospace",
            resize: "vertical", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Templates */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>テンプレート</span>
          <button
            onClick={handleSaveTemplate}
            style={{
              padding: "2px 10px", borderRadius: 4, border: "1px solid #556",
              background: "#1a2a44", color: "#fff", cursor: "pointer", fontSize: 11,
            }}
          >保存</button>
        </div>
        {templates.length === 0 && (
          <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>保存されたテンプレートはありません</span>
        )}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {templates.map((tpl, i) => (
            <div key={i} style={{
              display: "flex", gap: 4, alignItems: "center",
              background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px",
            }}>
              <button
                onClick={() => handleLoadTemplate(tpl)}
                style={{
                  padding: "2px 8px", borderRadius: 3, border: "1px solid #556",
                  background: "#1a2a44", color: "#8cf", cursor: "pointer", fontSize: 11,
                }}
              >{tpl.name}</button>
              <button
                onClick={() => handleDeleteTemplate(i)}
                style={{
                  width: 18, height: 18, borderRadius: 3, border: "1px solid #822",
                  background: "transparent", color: "#f66", cursor: "pointer",
                  fontSize: 11, padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>モード:</span>
        <button
          onClick={() => setIsSuperEastSouth(false)}
          style={{
            padding: "4px 16px", borderRadius: 4, border: "1px solid #556",
            background: !isSuperEastSouth ? "#3a6" : "#1a2a44",
            color: "#fff", cursor: "pointer", fontSize: 12,
          }}
        >東南戦</button>
        <button
          onClick={() => setIsSuperEastSouth(true)}
          style={{
            padding: "4px 16px", borderRadius: 4, border: "1px solid #556",
            background: isSuperEastSouth ? "#c62828" : "#1a2a44",
            color: "#fff", cursor: "pointer", fontSize: 12,
          }}
        >超東南戦</button>
      </div>

      {/* Start / Back */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={() => goTo("title")}
          style={{
            padding: "8px 24px", borderRadius: 6, border: "1px solid #556",
            background: "#1a2a44", color: "#fff", cursor: "pointer",
          }}
        >戻る</button>
        <button
          onClick={handleStart}
          style={{
            padding: "8px 32px", borderRadius: 6, border: "none",
            background: "#c62828", color: "#fff", cursor: "pointer",
            fontWeight: "bold", fontSize: 15,
          }}
        >スタート</button>
      </div>
    </div>
  );
}

function HandEditor({
  label,
  hand,
  counts,
  trendTypes,
  maxTotal,
  onChange,
}: {
  label: string;
  hand: number[];
  counts: number[];
  trendTypes: number[];
  maxTotal: number;
  onChange: (counts: number[]) => void;
}) {
  const activeTrends = trendTypes.filter(
    (t) => t >= 0 && t < TREND_KINDS,
  );
  const total = counts.reduce((a, c) => a + c, 0);
  const atMax = total >= maxTotal;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 6, padding: 8,
      display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px",
    }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>
        {label}
      </div>

      {/* Tile preview row */}
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", minHeight: 28 }}>
        {hand.slice(0, 20).map((id, i) => (
          <TileImg key={`${id}-${i}`} id={id} size={26} />
        ))}
        {hand.length > 20 && (
          <span style={{ fontSize: 10, color: "#888", alignSelf: "center" }}>
            +{hand.length - 20}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Basic tiles */}
        {TileData.map((tile, i) => (
          <TileRow
            key={tile.id}
            color={tile.colorHex}
            name={tile.name}
            count={counts[i] ?? 0}
            canInc={!atMax}
            onDec={() => {
              const next = [...counts];
              next[i] = Math.max(0, next[i] - 1);
              onChange(next);
            }}
            onInc={() => {
              const next = [...counts];
              next[i] = Math.min(9, next[i] + 1);
              onChange(next);
            }}
          />
        ))}
        {/* Trend tiles */}
        {activeTrends.length > 0 && (
          <>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4, marginBottom: 2 }}>流行牌</div>
            {activeTrends.map((trendIdx) => {
              const trend = TrendTileData[trendIdx];
              const ci = BASIC_TILE_KIND_COUNT + trendIdx;
              return (
                <TileRow
                  key={`trend-${trendIdx}`}
                  color={trend.colorHex}
                  name={trend.name}
                  count={counts[ci] ?? 0}
                  canInc={!atMax}
                  onDec={() => {
                    const next = [...counts];
                    next[ci] = Math.max(0, next[ci] - 1);
                    onChange(next);
                  }}
                  onInc={() => {
                    const next = [...counts];
                    next[ci] = Math.min(4, next[ci] + 1);
                    onChange(next);
                  }}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function TileRow({
  color,
  name,
  count,
  canInc,
  onDec,
  onInc,
}: {
  color: string;
  name: string;
  count: number;
  canInc: boolean;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 11,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: 2,
        background: color, flexShrink: 0,
      }} />
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name}
      </span>
      <button
        onClick={onDec}
        disabled={count === 0}
        style={{
          width: 18, height: 18, borderRadius: 3, border: "1px solid #556",
          background: count === 0 ? "#111" : "#1a2a44",
          color: count === 0 ? "#444" : "#fff",
          cursor: count === 0 ? "default" : "pointer",
          fontSize: 11, padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>
      <span style={{ minWidth: 16, textAlign: "center", fontSize: 12 }}>{count}</span>
      <button
        onClick={onInc}
        disabled={!canInc}
        style={{
          width: 18, height: 18, borderRadius: 3, border: "1px solid #556",
          background: !canInc ? "#111" : "#1a2a44",
          color: !canInc ? "#444" : "#fff",
          cursor: !canInc ? "default" : "pointer",
          fontSize: 11, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >＋</button>
    </div>
  );
}

function WallSequencer({
  wall,
  availableTiles,
  onChange,
}: {
  wall: number[];
  availableTiles: number[];
  onChange: (tiles: number[]) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const moveLeft = () => {
    if (selected == null) return;
    const idx = wall.indexOf(selected);
    if (idx <= 0) return;
    const next = [...wall];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveRight = () => {
    if (selected == null) return;
    const idx = wall.indexOf(selected);
    if (idx < 0 || idx >= wall.length - 1) return;
    const next = [...wall];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  const moveFirst = () => {
    if (selected == null) return;
    const idx = wall.indexOf(selected);
    if (idx <= 0) return;
    const next = [selected, ...wall.filter((t) => t !== selected)];
    onChange(next);
  };

  const moveLast = () => {
    if (selected == null) return;
    const idx = wall.indexOf(selected);
    if (idx < 0 || idx >= wall.length - 1) return;
    const next = [...wall.filter((t) => t !== selected), selected];
    onChange(next);
  };

  const removeTile = () => {
    if (selected == null) return;
    onChange(wall.filter((t) => t !== selected));
    setSelected(null);
  };

  const addTile = (id: number) => {
    onChange([...wall, id]);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 6, padding: 8,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        山札 ({wall.length}枚) — 1枚目が配牌後のツモ牌
      </div>

      {/* Wall tiles */}
      <div style={{
        display: "flex", gap: 3, flexWrap: "wrap",
        padding: 6, background: "rgba(0,0,0,0.2)", borderRadius: 4,
        minHeight: 48, maxHeight: 160, overflow: "auto",
      }}>
        {wall.length === 0 && (
          <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>牌なし</span>
        )}
        {wall.map((id, i) => (
          <div key={`${id}-${i}`} style={{ position: "relative" }}>
            <TileImg
              id={id}
              selected={selected === id}
              onClick={() => setSelected(selected === id ? null : id)}
            />
            {i === 0 && (
              <div style={{
                position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
                fontSize: 8, color: "#ff0", background: "rgba(0,0,0,0.6)", borderRadius: 2, padding: "0 3px",
                whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                1枚目
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected tile controls */}
      {selected != null && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11 }}>
          <span style={{ opacity: 0.6 }}>選択中: {findTileDataById(selected).name} ({selected})</span>
          <button onClick={moveFirst} style={btnStyle}>«</button>
          <button onClick={moveLeft} style={btnStyle}>←</button>
          <button onClick={moveRight} style={btnStyle}>→</button>
          <button onClick={moveLast} style={btnStyle}>»</button>
          <button onClick={removeTile} style={{ ...btnStyle, background: "#822" }}>削除</button>
        </div>
      )}

      {/* Available tiles pool */}
      <div style={{ fontSize: 11, opacity: 0.6 }}>追加可能な牌 (クリックで山札の末尾に追加)</div>
      <div style={{
        display: "flex", gap: 2, flexWrap: "wrap",
        padding: 4, background: "rgba(0,0,0,0.15)", borderRadius: 4,
        maxHeight: 120, overflow: "auto",
      }}>
        {availableTiles.length === 0 && (
          <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>追加可能な牌なし</span>
        )}
        {availableTiles.map((id) => (
          <TileImg
            key={id}
            id={id}
            size={30}
            onClick={() => {
              addTile(id);
              setSelected(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 3, border: "1px solid #556",
  background: "#1a2a44", color: "#fff", cursor: "pointer",
  fontSize: 12, padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
};
