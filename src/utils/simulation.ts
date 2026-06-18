const SIMULATION_TRANSITION_DELAYS = [0, 2200, 1700, 1200, 800, 1] as const;
const SIMULATION_RESULT_DELAYS = [0, 3200, 2600, 2000, 1400, 1] as const;

export function getSimulationTransitionDelay(speed: number): number {
  return (
    SIMULATION_TRANSITION_DELAYS[speed] ??
    SIMULATION_TRANSITION_DELAYS[SIMULATION_TRANSITION_DELAYS.length - 1]
  );
}

export function getSimulationResultDelay(speed: number): number {
  return (
    SIMULATION_RESULT_DELAYS[speed] ??
    SIMULATION_RESULT_DELAYS[SIMULATION_RESULT_DELAYS.length - 1]
  );
}
