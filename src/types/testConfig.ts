export interface TestConfigPlayer {
  charId: string;
  type: "human" | "cpu";
  abilityGauge: number;
}

export interface TestConfig {
  version: 1;
  players: TestConfigPlayer[];
  hands: number[][];
  wall: number[];
  doraTile: number;
  uradoraTile: number;
  trendTypes: number[];
}
