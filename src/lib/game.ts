import { getOption, wheels } from '../data/wheels.ts';

export type Phase = 'intro' | 'ready' | 'spinning' | 'revealed' | 'pending' | 'complete';
export interface GameState {
  phase: Phase;
  stepId: string;
  results: Record<string, string>;
}
export type Action =
  | { type: 'start' }
  | { type: 'spin'; optionId: string }
  | { type: 'reveal' }
  | { type: 'continue' }
  | { type: 'finish' }
  | { type: 'reset' };
export const STORAGE_KEY = 'jjk-spinner:v1';
export const initialState: GameState = { phase: 'intro', stepId: 'nature', results: {} };

export function nextWheel(state: GameState) {
  const currentIndex = wheels.findIndex((wheel) => wheel.id === state.stepId);
  return wheels
    .slice(currentIndex + 1)
    .find(
      (wheel) =>
        !wheel.availableWhen ||
        state.results[wheel.availableWhen.stepId] === wheel.availableWhen.optionId,
    );
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
      if (next) return { ...state, stepId: next.id, phase: 'ready' };
      return { ...state, phase: state.results.nature === 'human' ? 'complete' : 'pending' };
    }
    case 'finish':
      return state.phase === 'pending' ? { ...state, phase: 'complete' } : state;
    case 'reset':
      return state.phase === 'complete' ? { ...initialState, phase: 'ready' } : state;
  }
}

// Only valid, reachable states can be restored. A committed spin is never rerolled.
export function parseSavedGame(raw: string | null): GameState {
  try {
    if (!raw) return initialState;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return initialState;
    const { phase, stepId, results } = saved as GameState;
    if (
      !results ||
      typeof results !== 'object' ||
      Array.isArray(results) ||
      !['intro', 'ready', 'spinning', 'revealed', 'pending', 'complete'].includes(phase)
    )
      return initialState;
    const entries = Object.entries(results);
    if (entries.some(([step, option]) => typeof option !== 'string' || !getOption(step, option)))
      return initialState;
    const nature = results.nature;
    const lineage = results.lineage;
    if (lineage && nature !== 'human') return initialState;
    if (stepId !== 'nature' && stepId !== 'lineage') return initialState;
    if (stepId === 'lineage' && nature !== 'human') return initialState;
    if (phase === 'intro' && (entries.length || stepId !== 'nature')) return initialState;
    if (phase === 'ready' && (results[stepId] || (stepId === 'nature' && entries.length)))
      return initialState;
    if (
      ['spinning', 'revealed'].includes(phase) &&
      (!results[stepId] || (stepId === 'nature' && lineage))
    )
      return initialState;
    if (phase === 'pending' && (!nature || nature === 'human' || stepId !== 'nature'))
      return initialState;
    if (
      phase === 'complete' &&
      (!nature || (nature === 'human' ? !lineage || stepId !== 'lineage' : stepId !== 'nature'))
    )
      return initialState;
    return { phase: phase === 'spinning' ? 'revealed' : phase, stepId, results: { ...results } };
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
    /* In-memory play remains available. */
  }
}
