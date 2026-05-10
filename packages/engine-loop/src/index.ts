export interface Ticker {
  start: () => void;
  stop: () => void;
}

export interface CreateTickerOptions {
  fps: number;
  tick: () => void;
}

export const createTicker = ({ fps, tick }: CreateTickerOptions): Ticker => {
  let timer: NodeJS.Timeout | null = null;
  const intervalMs = Math.max(1, Math.floor(1000 / fps));

  return {
    start: () => {
      if (timer) {
        return;
      }

      tick();
      timer = setInterval(tick, intervalMs);
    },
    stop: () => {
      if (!timer) {
        return;
      }

      clearInterval(timer);
      timer = null;
    },
  };
};
export const describeTicker = (ticksPerSecond: number): string => {
  return `simulation ${ticksPerSecond} Hz`;
};
