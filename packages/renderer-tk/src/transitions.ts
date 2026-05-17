/**
 * Scene transition effects — visual overlays during scene changes.
 *
 * Transitions are purely visual and don't affect game state.
 * The renderer drives them: on scene change, start a transition,
 * render the overlay each frame until it completes.
 */

export type TransitionKind = 'fade_in' | 'wipe_down';

export interface TransitionState {
  kind: TransitionKind;
  progress: number; // 0→1
  duration: number; // total ticks
  elapsed: number;
}

// ── Create ───────────────────────────────────────────────────────────

const DEFAULT_DURATION = 12; // ~0.4s at 30Hz

export const startTransition = (
  kind: TransitionKind = 'fade_in',
  duration: number = DEFAULT_DURATION
): TransitionState => ({
  kind,
  progress: 0,
  duration,
  elapsed: 0,
});

// ── Update ───────────────────────────────────────────────────────────

/**
 * Advance the transition by one tick. Returns null when complete.
 */
export const tickTransition = (
  t: TransitionState
): TransitionState | null => {
  const elapsed = t.elapsed + 1;
  if (elapsed >= t.duration) return null;

  return {
    ...t,
    elapsed,
    progress: elapsed / t.duration,
  };
};

// ── Rendering helpers ────────────────────────────────────────────────

/**
 * For fade_in: returns the fill character density (0→1 means full coverage → no coverage).
 * At progress=0, screen is fully covered. At progress=1, screen is clear.
 */
export const getFadeOpacity = (t: TransitionState): number =>
  1 - t.progress;

/**
 * For wipe_down: returns how many rows from the top should be revealed.
 */
export const getWipeRow = (t: TransitionState, totalRows: number): number =>
  Math.floor(t.progress * totalRows);
