import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getWheelProgress } from './data/wheels.ts';
import { forcedOutcome, isStageAvailable, resultDetails, wheelForStep } from './lib/conditions.ts';
import { gameReducer, loadGame, saveGame } from './lib/game.ts';
import { getSegments, pickOption, SMALL_SEGMENT_THRESHOLD } from './lib/wheel.ts';
import Wheel from './components/Wheel.tsx';
import CharacterSheet from './components/CharacterSheet.tsx';
import ResultReveal, { ResultDialog } from './components/ResultReveal.tsx';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
  const [inspectedStep, setInspectedStep] = useState<string | null>(null);
  const [testModeEnabled, setTestMode] = useState(false);
  const testMode = import.meta.env.DEV && testModeEnabled;
  const [wheelRun, setWheelRun] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const spinLock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const wheel = wheelForStep(state.stepId, state)!;
  const result = resultDetails(state.stepId, state);
  const forced = forcedOutcome(wheel, state);
  const terminal = state.phase === 'complete';
  const revealedResults =
    state.phase === 'spinning'
      ? Object.fromEntries(Object.entries(state.results).filter(([id]) => id !== state.stepId))
      : state.results;
  const { chapter, chapterNumber, stepNumber, totalSteps } = getWheelProgress(
    wheel,
    revealedResults,
    (entry) =>
      (entry.availableWhen && !revealedResults[entry.availableWhen.stepId]) ||
      isStageAvailable(entry, { ...state, results: revealedResults }),
  );
  const chapterLabel = String(chapterNumber).padStart(2, '0');
  const isIntro = state.phase === 'intro';
  const segments = getSegments(wheel.options);
  const inspectedWheel = inspectedStep ? wheelForStep(inspectedStep, state) : undefined;
  const inspectedResult =
    inspectedWheel && resultDetails(inspectedWheel.id, { ...state, results: revealedResults });
  const inspectedForced =
    inspectedWheel && forcedOutcome(inspectedWheel, { ...state, results: revealedResults });
  const completeSpin = useCallback(() => dispatch({ type: 'reveal' }), []);

  useEffect(() => {
    saveGame(state);
    if (state.phase !== 'spinning') spinLock.current = false;
  }, [state]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.phase !== 'spinning' && state.phase !== 'revealed') heading.current?.focus();
  }, [state.phase, state.stepId]);

  function spin() {
    if (
      state.phase !== 'ready' ||
      spinLock.current ||
      state.results[state.stepId] ||
      wheel.options.length <= 1
    )
      return;
    spinLock.current = true;
    const option = pickOption(wheel.options);
    saveGame(gameReducer(state, { type: 'spin', optionId: option.id }));
    dispatch({ type: 'spin', optionId: option.id });
  }

  function retry(stepId = state.stepId) {
    if (!import.meta.env.DEV) return;
    const action = { type: 'retry' as const, stepId, testMode };
    const next = gameReducer(state, action);
    if (next === state) return;
    saveGame(next);
    setInspectedStep(null);
    setWheelRun((run) => run + 1);
    dispatch(action);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#game">
        Pular para o jogo
      </a>
      <header className="site-header">
        <div className="brand" aria-label="Custom Character">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">
            CUSTOM<span>CHARACTER</span>
          </span>
        </div>
        <p className="header-context">
          JUJUTSU KAISEN <span>FAN GAME</span>
        </p>
        {import.meta.env.DEV && (
          <button
            className={`test-mode-toggle ${testMode ? 'is-active' : ''}`}
            aria-pressed={testMode}
            disabled={state.phase === 'spinning'}
            onClick={() => setTestMode((enabled) => !enabled)}
          >
            <span className="test-label">Modo de teste</span>
            <span className="test-label-compact">Teste</span>
          </button>
        )}
      </header>
      <main id="game" className="game-layout">
        <section className="play-area" aria-labelledby="game-title">
          <div className="chapter-indicator">
            <span>
              Capítulo {chapterLabel} <span aria-hidden="true">—</span> {chapter.name}
            </span>
            <span className="step-indicator">
              {terminal ? 'Concluído' : `Etapa ${stepNumber} / ${totalSteps}`}
            </span>
          </div>
          <div className="game-heading">
            <h1 id="game-title" ref={heading} tabIndex={-1}>
              {terminal ? 'Criação concluída' : wheel.name}
            </h1>
            <p>{terminal ? 'Consulte os resultados na ficha do personagem.' : wheel.description}</p>
            {state.legacyBirth && (
              <p className="secondary-note">
                Partida anterior: condição de nascimento não registrada. Seus resultados foram
                preservados.
              </p>
            )}
            {testMode && (
              <p className="test-mode-note" role="status">
                Modo de teste ativo. Você pode repetir os giros e testar outros resultados.
              </p>
            )}
          </div>
          {terminal ? (
            <section className="completion-panel" aria-label="Criação concluída">
              <span className="completion-label">Ficha parcial</span>
              <h2>Todos os resultados registrados.</h2>
              <p>Selecione um atributo na ficha para consultar sua explicação e referências.</p>
              <button className="button button-primary" onClick={() => dispatch({ type: 'reset' })}>
                Criar outro personagem
              </button>
              {testMode && !forced && (
                <button className="button button-secondary" onClick={() => retry()}>
                  Tentar novamente
                </button>
              )}
              <p className="secondary-note">Substitui a ficha atual.</p>
            </section>
          ) : (
            <>
              {!forced && (
                <>
                  <Wheel
                    key={`${wheel.id}-${wheelRun}`}
                    definition={wheel}
                    spinning={state.phase === 'spinning'}
                    resultId={result?.id}
                    reducedMotion={reducedMotion}
                    onComplete={completeSpin}
                  />
                  <div className="wheel-interaction">
                    <p className="live-status" role="status" aria-live="polite">
                      {state.phase === 'spinning'
                        ? 'Girando…'
                        : state.phase === 'revealed'
                          ? `Resultado: ${result?.name}`
                          : '\u00a0'}
                    </p>
                    {state.phase !== 'revealed' && (
                      <>
                        <button
                          className="button button-primary spin-button"
                          disabled={state.phase === 'spinning'}
                          onClick={isIntro ? () => dispatch({ type: 'start' }) : spin}
                          aria-label={
                            isIntro
                              ? 'Criar personagem'
                              : state.phase === 'spinning'
                                ? 'Girando roleta'
                                : `Girar roleta de ${wheel.name}`
                          }
                        >
                          {isIntro
                            ? 'Criar personagem'
                            : state.phase === 'spinning'
                              ? 'Girando…'
                              : 'Girar roleta'}
                        </button>
                        <p className="secondary-note">
                          {isIntro
                            ? 'Origem, condição especial, atributos físicos, energia, técnica e suas aplicações.'
                            : testMode
                              ? 'Modo de teste: novos giros estão liberados.'
                              : 'O resultado não pode ser alterado.'}
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
              {state.phase === 'revealed' && result && (
                <ResultReveal
                  key={wheel.id}
                  attribute={wheel.name}
                  result={result}
                  focusOnMount={!inspectedResult}
                  reducedMotion={reducedMotion}
                  automaticReason={forced?.reason}
                  onContinue={() => dispatch({ type: 'continue' })}
                  onRetry={testMode && !forced ? () => retry() : undefined}
                />
              )}
              {!forced && (
                <details className="probabilities" key={`probabilities-${wheel.id}`}>
                  <summary>
                    Resultados e probabilidades{' '}
                    <span>
                      {segments.length} {segments.length === 1 ? 'opção' : 'opções'}
                    </span>
                  </summary>
                  <ol className="wheel-legend">
                    {segments.map(({ option, probability }, index) => (
                      <li className="legend-item" key={option.id}>
                        <span
                          className="legend-marker"
                          style={{ backgroundColor: option.color }}
                          aria-label={
                            probability < SMALL_SEGMENT_THRESHOLD
                              ? `Marcador ${index + 1} na roleta`
                              : undefined
                          }
                        >
                          {index + 1}
                        </span>
                        <span className="legend-name">{option.name}</span>
                        <span className="legend-percentage">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'percent',
                            maximumFractionDigits: 2,
                          }).format(probability)}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="probability-note">
                    Os pesos são escolhas do jogo, não frequências ou classificações oficiais. Os
                    números identificam os segmentos na roleta.
                  </p>
                </details>
              )}
            </>
          )}
        </section>
        <CharacterSheet state={state} onInspect={setInspectedStep} />
      </main>
      <footer className="site-footer">
        <span>
          Custom Character <span aria-hidden="true">/</span> Jujutsu Kaisen
        </span>
        <p>Projeto de fãs, sem vínculo oficial. Universo de Gege Akutami.</p>
      </footer>
      {inspectedWheel && inspectedResult && (
        <ResultDialog
          attribute={inspectedWheel.name}
          result={inspectedResult}
          automaticReason={inspectedForced?.reason}
          onClose={() => setInspectedStep(null)}
          onRetry={
            testMode &&
            !inspectedForced &&
            state.phase !== 'spinning' &&
            state.results[inspectedWheel.id]
              ? () => retry(inspectedWheel.id)
              : undefined
          }
        />
      )}
    </div>
  );
}
