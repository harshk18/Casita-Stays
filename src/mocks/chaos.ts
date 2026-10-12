import { createRng, type Rng } from '@/lib/random';

export interface ChaosConfig {
  enabled: boolean;
  minLatencyMs: number;
  maxLatencyMs: number;
  failureRate: number;
}

export interface Chaos {
  delay(): Promise<void>;
  shouldFail(): boolean;
}

export const DEFAULT_CHAOS: ChaosConfig = {
  enabled: true,
  minLatencyMs: 300,
  maxLatencyMs: 1200,
  failureRate: 0.1,
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createChaos(
  config: ChaosConfig,
  rng: Rng,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Chaos {
  return {
    async delay() {
      if (!config.enabled) return;
      await sleep(rng.int(config.minLatencyMs, config.maxLatencyMs));
    },
    shouldFail() {
      return config.enabled && rng.next() < config.failureRate;
    },
  };
}

/** `MOCK_CHAOS=off` disables latency and failures (curl checks, Lighthouse, e2e). */
export function chaosConfigFromEnv(
  env: Record<string, string | undefined>,
): ChaosConfig {
  return { ...DEFAULT_CHAOS, enabled: env.MOCK_CHAOS !== 'off' };
}

let instance: Chaos | undefined;

export function getChaos(): Chaos {
  instance ??= createChaos(
    chaosConfigFromEnv(process.env),
    createRng(Math.floor(Math.random() * 2 ** 32)),
  );
  return instance;
}
