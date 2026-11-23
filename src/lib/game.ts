import { getOption, isWheelAvailable, wheels } from '../data/wheels.ts';
import { forcedOutcome, isStageAvailable, playableWheel } from './conditions.ts';

export type Phase = 'intro' | 'ready' | 'spinning' | 'revealed' | 'complete';
export interface GameState {
  version: 3;
  phase: Phase;
  stepId: string;
  results: Record<string, string>;
  legacyBirth?: true;
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
  version: 3,
  phase: 'intro',
  stepId: wheels[0].id,
  results: {},
};

export function nextWheel(state: GameState) {
  const currentIndex = wheels.findIndex((wheel) => wheel.id === state.stepId);
  return wheels.slice(currentIndex + 1).find((wheel) => isStageAvailable(wheel, state));
}

// One compatible outcome is a consequence, not a random draw. Stop at its reveal
// so the player can read it and explicitly continue, including after restoring a save.
function enterStage(state: GameState): GameState {
  if (state.phase !== 'ready' || state.results[state.stepId]) return state;
  const wheel = wheels.find((entry) => entry.id === state.stepId);
  const forced = wheel && forcedOutcome(wheel, state);
  return forced
    ? {
        ...state,
        phase: 'revealed',
        results: { ...state.results, [state.stepId]: forced.option.id },
      }
    : state;
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? enterStage({ ...state, phase: 'ready' }) : state;
    case 'spin': {
      const wheel = wheels.find((entry) => entry.id === state.stepId);
      if (
        state.phase !== 'ready' ||
        state.results[state.stepId] ||
        !wheel ||
        !isStageAvailable(wheel, state) ||
        playableWheel(wheel, state).options.length <= 1 ||
        !playableWheel(wheel, state).options.some((option) => option.id === action.optionId)
      )
        return state;
      return {
        ...state,
        phase: 'spinning',
        results: { ...state.results, [state.stepId]: action.optionId },
      };
    }
    case 'reveal':
      return state.phase === 'spinning' ? { ...state, phase: 'revealed' } : state;
    case 'continue': {
      if (state.phase !== 'revealed') return state;
      const next = nextWheel(state);
      return next
        ? enterStage({ ...state, stepId: next.id, phase: 'ready' })
        : { ...state, phase: 'complete' };
    }
    case 'retry': {
      if (
        import.meta.env?.PROD === true ||
        !action.testMode ||
        state.phase === 'spinning' ||
        !Object.hasOwn(state.results, action.stepId)
      )
        return state;
      const index = wheels.findIndex((wheel) => wheel.id === action.stepId);
      if (index < 0) return state;
      if (forcedOutcome(wheels[index], state)) return state;
      const earlierSteps = new Set(wheels.slice(0, index).map((wheel) => wheel.id));
      const { legacyBirth, ...rest } = state;
      return enterStage({
        ...rest,
        ...(legacyBirth && index > wheels.findIndex((wheel) => wheel.id === 'birth-condition')
          ? { legacyBirth }
          : {}),
        phase: 'ready',
        stepId: action.stepId,
        results: Object.fromEntries(
          Object.entries(state.results).filter(([id]) => earlierSteps.has(id)),
        ),
      });
    }
    case 'reset':
      return state.phase === 'complete' ? enterStage({ ...initialState, phase: 'ready' }) : state;
  }
}

// Validate one contiguous path through the catalog, including conditional stages.
// Terminal saves resume at the first new wheel without changing any result.
export function parseSavedGame(raw: string | null): GameState {
  return parseGame(raw);
}

// Archives validate against their historical catalog boundary and never resume play.
export function parseArchivedGame(raw: string, catalogEnd: string): GameState | undefined {
  if (!catalogEnd) return undefined;
  const parsed = parseGame(raw, catalogEnd);
  return parsed.phase === 'complete' ? parsed : undefined;
}

function parseGame(raw: string | null, catalogEnd?: string): GameState {
  try {
    if (!raw) return initialState;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return initialState;
    const { phase, stepId, results, version, legacyBirth } = saved as Record<string, unknown>;
    const legacy = version === undefined;
    const oldFlow = version !== 3;
    const boundary = catalogEnd ? wheels.findIndex((wheel) => wheel.id === catalogEnd) : -1;
    if (catalogEnd && (boundary < 0 || version !== 3 || phase !== 'complete')) return initialState;
    if (
      (!legacy && version !== 2 && version !== 3) ||
      (legacyBirth !== undefined && (legacyBirth !== true || oldFlow)) ||
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
    if (
      legacyBirth &&
      (restoredResults.nature !== 'human' ||
        !restoredResults.lineage ||
        restoredResults['birth-condition'] ||
        wheels.indexOf(current) < wheels.findIndex((wheel) => wheel.id === 'strength'))
    )
      return initialState;
    const context = {
      results: restoredResults,
      ...(legacyBirth ? { legacyBirth: true as const } : {}),
    };
    const catalog = oldFlow
      ? wheels.filter((wheel) => ['origin', 'physical'].includes(wheel.chapterId))
      : catalogEnd
        ? wheels.slice(0, boundary + 1)
        : wheels;
    if (
      (oldFlow || catalogEnd) &&
      entries.some(([id]) => !catalog.some((wheel) => wheel.id === id))
    )
      return initialState;
    if (oldFlow && !catalog.includes(current)) return initialState;

    let firstUnrolled: (typeof wheels)[number] | undefined;
    let lastRolled: (typeof wheels)[number] | undefined;
    for (const wheel of catalog) {
      const hasResult = Object.hasOwn(restoredResults, wheel.id);
      if (
        !(oldFlow ? isWheelAvailable(wheel, restoredResults) : isStageAvailable(wheel, context))
      ) {
        if (hasResult) return initialState;
        continue;
      }
      if (hasResult) {
        if (firstUnrolled) return initialState;
        if (
          !oldFlow &&
          !playableWheel(wheel, context).options.some(
            (option) => option.id === restoredResults[wheel.id],
          )
        )
          return initialState;
        lastRolled = wheel;
      } else {
        firstUnrolled ??= wheel;
      }
    }

    const migratedBirth =
      oldFlow &&
      restoredResults.nature === 'human' &&
      ['strength', 'speed', 'endurance'].some((id) => Object.hasOwn(restoredResults, id));
    const state = {
      version: 3 as const,
      stepId,
      results: restoredResults,
      ...(legacyBirth || migratedBirth ? { legacyBirth: true as const } : {}),
    };
    const firstNewUnrolled = (catalogEnd ? catalog : wheels).find(
      (wheel) => isStageAvailable(wheel, state) && !Object.hasOwn(restoredResults, wheel.id),
    );
    if (catalogEnd && firstNewUnrolled) return initialState;
    if (phase === 'intro')
      return !entries.length && stepId === initialState.stepId ? { ...state, phase } : initialState;
    if (phase === 'ready')
      return stepId === firstUnrolled?.id
        ? enterStage({ ...state, phase, stepId: firstNewUnrolled?.id ?? stepId })
        : initialState;
    if (stepId !== lastRolled?.id) return initialState;
    if (phase === 'spinning' || phase === 'revealed') return { ...state, phase: 'revealed' };
    if (phase === 'complete' || (legacy && phase === 'pending')) {
      return firstNewUnrolled
        ? enterStage({ ...state, phase: 'ready', stepId: firstNewUnrolled.id })
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
