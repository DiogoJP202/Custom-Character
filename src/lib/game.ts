import { getOption, isWheelAvailable, wheels } from '../data/wheels.ts';

export type Phase = 'intro' | 'ready' | 'spinning' | 'revealed' | 'complete';
export interface GameState {
  version: 2;
  phase: Phase;
  stepId: string;
  results: Record<string, string>;
}
export type Action =
  | { type: 'start' }
  | { type: 'spin'; optionId: string }
  | { type: 'reveal' }
  | { type: 'continue' }
  | { type: 'retry'; stepId: string; testMode: boolean }
  | { type: 'reset' };

// Keep the key to recover existing saves; version distinguishes the expanded flow.
export const STORAGE_KEY = 'jjk-spinner:v1';
export const initialState: GameState = {
  version: 2,
  phase: 'intro',
  stepId: wheels[0].id,
  results: {},
};

export function nextWheel(state: GameState) {
  const currentIndex = wheels.findIndex((wheel) => wheel.id === state.stepId);
  return wheels.slice(currentIndex + 1).find((wheel) => isWheelAvailable(wheel, state.results));
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: 'ready' } : state;
    case 'spin':
      if (
        state.phase !== 'ready' ||
        state.results[state.stepId] ||
        !getOption(state.stepId, action.optionId)
      )
        return state;
      return {
        ...state,
        phase: 'spinning',
        results: { ...state.results, [state.stepId]: action.optionId },
      };
    case 'reveal':
      return state.phase === 'spinning' ? { ...state, phase: 'revealed' } : state;
    case 'continue': {
      if (state.phase !== 'revealed') return state;
      const next = nextWheel(state);
      return next ? { ...state, stepId: next.id, phase: 'ready' } : { ...state, phase: 'complete' };
    }
    case 'retry': {
      if (
        !action.testMode ||
        state.phase === 'spinning' ||
        !Object.hasOwn(state.results, action.stepId)
      )
        return state;
      const index = wheels.findIndex((wheel) => wheel.id === action.stepId);
      if (index < 0) return state;
      const earlierSteps = new Set(wheels.slice(0, index).map((wheel) => wheel.id));
      return {
        ...state,
        phase: 'ready',
        stepId: action.stepId,
        results: Object.fromEntries(
          Object.entries(state.results).filter(([id]) => earlierSteps.has(id)),
        ),
      };
    }
    case 'reset':
      return state.phase === 'complete' ? { ...initialState, phase: 'ready' } : state;
  }
}

// Validate one contiguous path through the catalog, including conditional stages.
// Terminal saves resume at the first new wheel without changing any result.
export function parseSavedGame(raw: string | null): GameState {
  try {
    if (!raw) return initialState;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return initialState;
    const { phase, stepId, results, version } = saved as Record<string, unknown>;
    const legacy = version === undefined;
    if (
      (!legacy && version !== 2) ||
      typeof phase !== 'string' ||
      typeof stepId !== 'string' ||
      ![
        'intro',
        'ready',
        'spinning',
        'revealed',
        'complete',
        ...(legacy ? ['pending'] : []),
      ].includes(phase) ||
      !results ||
      typeof results !== 'object' ||
      Array.isArray(results)
    )
      return initialState;
    const entries = Object.entries(results);
    if (entries.some(([step, option]) => typeof option !== 'string' || !getOption(step, option)))
      return initialState;
    const restoredResults = Object.fromEntries(entries) as Record<string, string>;
    const current = wheels.find((wheel) => wheel.id === stepId);
    if (!current) return initialState;

    let firstUnrolled: (typeof wheels)[number] | undefined;
    let lastRolled: (typeof wheels)[number] | undefined;
    for (const wheel of wheels) {
      const hasResult = Object.hasOwn(restoredResults, wheel.id);
      if (!isWheelAvailable(wheel, restoredResults)) {
        if (hasResult) return initialState;
        continue;
      }
      if (hasResult) {
        if (firstUnrolled) return initialState;
        lastRolled = wheel;
      } else {
        firstUnrolled ??= wheel;
      }
    }

    const state = { version: 2 as const, stepId, results: restoredResults };
    if (phase === 'intro')
      return !entries.length && stepId === initialState.stepId ? { ...state, phase } : initialState;
    if (phase === 'ready') return stepId === firstUnrolled?.id ? { ...state, phase } : initialState;
    if (stepId !== lastRolled?.id) return initialState;
    if (phase === 'spinning' || phase === 'revealed') return { ...state, phase: 'revealed' };
    if (phase === 'complete' || (legacy && phase === 'pending')) {
      return firstUnrolled
        ? { ...state, phase: 'ready', stepId: firstUnrolled.id }
        : { ...state, phase: 'complete' };
    }
    return initialState;
  } catch {
    return initialState;
  }
}

export function loadGame(): GameState {
  try {
    return parseSavedGame(localStorage.getItem(STORAGE_KEY));
  } catch {
    return initialState;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Play remains available in memory. */
  }
}
