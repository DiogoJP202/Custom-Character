import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getWheelProgress } from './data/wheels.ts';
import { forcedOutcome, isStageAvailable, resultDetails, wheelForStep } from './lib/conditions.ts';
import { gameReducer, loadGame, saveGame } from './lib/game.ts';
import { getSegments, pickOption, SMALL_SEGMENT_THRESHOLD } from './lib/wheel.ts';
import Wheel from './components/Wheel.tsx';
import CharacterSheet from './components/CharacterSheet.tsx';
import FinalCharacterSheet from './components/FinalCharacterSheet.tsx';
import ResultReveal, { ResultDialog } from './components/ResultReveal.tsx';
import CharacterGallery, { GalleryNameDialog } from './components/CharacterGallery.tsx';
import CreationProgress from './components/CreationProgress.tsx';
import { loadSpinPace, saveSpinPace, PREFERENCES_KEY } from './lib/gameplay.ts';
import {
  GALLERY_STORAGE_KEY,
  loadGallery,
  saveCharacter,
  renameCharacter,
  deleteCharacter,
  findSavedCharacter,
  type GalleryResult,
} from './lib/character-gallery.ts';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
  const [gallery, setGallery] = useState(() => loadGallery());
  const [view, setView] = useState<'creation' | 'gallery'>('creation');
  const [saveOpen, setSaveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pace, setPace] = useState(loadSpinPace);
  const focusAfterSave = useRef(false);
  const savedCharacter = findSavedCharacter(gallery.records, state);
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
    if (!saveOpen && focusAfterSave.current) {
      heading.current?.focus();
      focusAfterSave.current = false;
    }
  }, [saveOpen]);

  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key === GALLERY_STORAGE_KEY || event.key === null) setGallery(loadGallery());
      if (event.key === PREFERENCES_KEY || event.key === null) setPace(loadSpinPace());
    };
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);
  useEffect(() => {
    saveSpinPace(pace);
  }, [pace]);

  function applyGalleryResult(result: GalleryResult) {
    if (result.ok) setGallery(result.gallery);
    return result;
  }

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
    if (view === 'creation' && state.phase !== 'spinning' && state.phase !== 'revealed')
      heading.current?.focus();
  }, [state.phase, state.stepId, view]);

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
    if (!import.meta.env.DEV || view !== 'creation') return;
    const action = { type: 'retry' as const, stepId, testMode };
    const next = gameReducer(state, action);
    if (next === state) return;
    saveGame(next);
    setInspectedStep(null);
    setWheelRun((run) => run + 1);
    dispatch(action);
  }

  function cancelCreation() {
    const action = { type: 'cancel' as const };
    const next = gameReducer(state, action);
    setCancelOpen(false);
    if (next === state) return;
    saveGame(next);
    spinLock.current = false;
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
        <button
          className="gallery-nav"
          disabled={state.phase === 'spinning'}
          aria-pressed={view === 'gallery'}
          onClick={() => {
            setInspectedStep(null);
            setGallery(loadGallery());
            setView((current) => (current === 'creation' ? 'gallery' : 'creation'));
          }}
        >
          {view === 'gallery' ? 'Voltar à criação' : 'Meus personagens'}
        </button>
        {import.meta.env.DEV && (
          <button
            className={`test-mode-toggle ${testMode ? 'is-active' : ''}`}
            aria-pressed={testMode}
            disabled={state.phase === 'spinning' || view === 'gallery'}
            onClick={() => setTestMode((enabled) => !enabled)}
          >
            <span className="test-label">Modo de teste</span>
            <span className="test-label-compact">Teste</span>
          </button>
        )}
      </header>
      {view === 'gallery' ? (
        <CharacterGallery
          gallery={gallery}
          onRefresh={() => setGallery(loadGallery())}
          onReturn={() => setView('creation')}
          onRename={(id, name) => applyGalleryResult(renameCharacter(id, name))}
          onDelete={(id) => applyGalleryResult(deleteCharacter(id, true))}
        />
      ) : (
        <main id="game" className={`game-layout ${terminal ? 'is-complete' : ''}`}>
          <section className="play-area" aria-labelledby="game-title">
            <div className="chapter-indicator">
              <span>
                {terminal ? (
                  'Criação concluída'
                ) : (
                  <>
                    Capítulo {chapterLabel} <span aria-hidden="true">—</span> {chapter.name}
                  </>
                )}
              </span>
              <span className="step-indicator">
                {terminal ? 'Concluído' : `Etapa ${stepNumber} / ${totalSteps}`}
              </span>
            </div>
            <div className="game-heading">
              <h1 id="game-title" ref={heading} tabIndex={-1}>
                {terminal ? 'Ficha final do personagem' : wheel.name}
              </h1>
              <p>
                {terminal
                  ? 'Identidade e capacidades derivadas dos seus resultados.'
                  : wheel.description}
              </p>
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
              {!terminal && (
                <div className="game-controls">
                  <fieldset
                    className="pace-control"
                    disabled={state.phase === 'spinning'}
                    aria-describedby={reducedMotion ? 'pace-motion-note' : undefined}
                  >
                    <legend>Ritmo do giro</legend>
                    <button aria-pressed={pace === 'standard'} onClick={() => setPace('standard')}>
                      Padrão
                    </button>
                    <button aria-pressed={pace === 'fast'} onClick={() => setPace('fast')}>
                      Rápido
                    </button>
                  </fieldset>
                  {!isIntro && (
                    <button
                      className="creation-cancel"
                      aria-haspopup="dialog"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancelar criação
                    </button>
                  )}
                </div>
              )}
              {!terminal && reducedMotion && (
                <p id="pace-motion-note" className="pace-motion-note">
                  Movimento reduzido ativo: giro sem animação.
                </p>
              )}
            </div>
            {!isIntro && !terminal && <CreationProgress state={state} />}
            {terminal ? (
              <FinalCharacterSheet
                state={state}
                onInspect={setInspectedStep}
                onReset={() => dispatch({ type: 'reset' })}
                onSave={() => setSaveOpen(true)}
                savedName={savedCharacter?.name}
                characterName={savedCharacter?.name}
                onRetry={testMode && !forced ? () => retry() : undefined}
              />
            ) : (
              <>
                {!forced && state.phase !== 'revealed' && (
                  <>
                    <Wheel
                      key={`${wheel.id}-${wheelRun}`}
                      definition={wheel}
                      spinning={state.phase === 'spinning'}
                      resultId={result?.id}
                      reducedMotion={reducedMotion}
                      pace={pace}
                      onComplete={completeSpin}
                    />
                    <div className="wheel-interaction">
                      <p className="live-status" role="status" aria-live="polite">
                        {state.phase === 'spinning' ? 'Girando…' : '\u00a0'}
                      </p>
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
                    </div>
                  </>
                )}
                {state.phase === 'revealed' && result && (
                  <ResultReveal
                    key={wheel.id}
                    stepId={wheel.id}
                    state={state}
                    attribute={wheel.name}
                    result={result}
                    focusOnMount={!inspectedResult && !cancelOpen}
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
          {!terminal && (
            <CharacterSheet
              state={state}
              onInspect={setInspectedStep}
              compact
              showSummaries={false}
            />
          )}
        </main>
      )}
      <footer className="site-footer">
        <span>
          Custom Character <span aria-hidden="true">/</span> Jujutsu Kaisen
        </span>
        <p>
          Projeto de fãs, sem vínculo oficial. Comparações, escalas e probabilidades são
          interpretações do jogo. Universo de Gege Akutami.
        </p>
      </footer>
      {view === 'creation' && cancelOpen && !isIntro && !terminal && (
        <CancelCreationDialog onKeep={() => setCancelOpen(false)} onConfirm={cancelCreation} />
      )}
      {view === 'creation' && saveOpen && terminal && (
        <GalleryNameDialog
          title="Salvar personagem"
          optional
          onCancel={() => setSaveOpen(false)}
          onSubmit={(name) => {
            const result = applyGalleryResult(saveCharacter(state, name));
            if (!result.ok) return result.error;
            focusAfterSave.current = true;
            setSaveOpen(false);
          }}
        />
      )}
      {view === 'creation' && inspectedWheel && inspectedResult && (
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

function CancelCreationDialog({
  onKeep,
  onConfirm,
}: {
  onKeep: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="profile-reset-dialog"
      aria-labelledby="cancel-creation-title"
      aria-describedby="cancel-creation-description"
      onClose={(event) => {
        if (!event.currentTarget.open) onKeep();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <h2 id="cancel-creation-title">Cancelar criação?</h2>
      <p id="cancel-creation-description">
        Os resultados da criação atual serão descartados e você voltará à roleta de Natureza. Os
        personagens salvos na galeria serão mantidos.
      </p>
      <div>
        <button className="button button-secondary" onClick={onKeep} autoFocus>
          Continuar criação
        </button>
        <button className="button button-primary" onClick={onConfirm}>
          Cancelar e voltar ao início
        </button>
      </div>
    </dialog>
  );
}
