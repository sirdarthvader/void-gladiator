export interface Ticker {
  start: () => void;
  stop: () => void;
}

export interface CreateTickerOptions {
  fps: number;
  tick: () => void;
}

// helper function to create a ticker that calls the provided tick function at the specified frames per second (fps)
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

// helper function to describe the ticker in a human-readable way (for debugging/logging)
export const describeTicker = (ticksPerSecond: number): string => {
  return `simulation ${ticksPerSecond} Hz`;
};
