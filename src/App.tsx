import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getOption, getWheelProgress, wheels } from './data/wheels.ts';
import { gameReducer, loadGame, saveGame } from './lib/game.ts';
import { getSegments, pickOption, SMALL_SEGMENT_THRESHOLD } from './lib/wheel.ts';
import Wheel, { Sigil } from './components/Wheel.tsx';
import CharacterSheet from './components/CharacterSheet.tsx';
import ResultReveal from './components/ResultReveal.tsx';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const spinLock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const wheel = wheels.find(({ id }) => id === state.stepId)!;
  const result = getOption(state.stepId, state.results[state.stepId]);
  const terminal = state.phase === 'complete';
  const revealedResults =
    state.phase === 'spinning'
      ? Object.fromEntries(Object.entries(state.results).filter(([id]) => id !== state.stepId))
      : state.results;
  const { chapter, chapterNumber, stepNumber, totalSteps } = getWheelProgress(
    wheel,
    revealedResults,
  );
  const chapterLabel = String(chapterNumber).padStart(2, '0');
  const isIntro = state.phase === 'intro';
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
    if (state.phase !== 'ready' || spinLock.current || state.results[state.stepId]) return;
    spinLock.current = true;
    const option = pickOption(wheel.options);
    const nextState = gameReducer(state, { type: 'spin', optionId: option.id });
    saveGame(nextState); // Commit before animation or a possible reload.
    dispatch({ type: 'spin', optionId: option.id });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#game">
        Pular para o jogo
      </a>
      <header className="site-header">
        <div className="brand">
          <Sigil />
          <div>
            <span className="brand-name">JUJUTSU</span>
            <span className="brand-subtitle">CHARACTER SPINNER</span>
          </div>
        </div>
        <div className="header-note">
          <span className="tiny-star" aria-hidden="true">
            ✦
          </span>{' '}
          Uma criação do acaso
        </div>
        <span className="edition">
          VOL. {chapterLabel} <span>/</span> {chapter.hubLabel}
        </span>
      </header>
      <main id="game" className={`game-layout ${terminal ? 'terminal-layout' : ''}`}>
        <section className="play-area" aria-labelledby="game-title">
          <div className="chapter-indicator">
            <span className="chapter-dot" />
            <span>CAPÍTULO {chapterLabel}</span>
            <span className="indicator-slash">/</span>
            <span>{chapter.name.toLocaleUpperCase('pt-BR')}</span>
            <span className="step-indicator">
              {terminal
                ? 'FIM DE CAPÍTULO'
                : `ETAPA ${String(stepNumber).padStart(2, '0')} DE ${String(totalSteps).padStart(2, '0')} · ${wheel.name.toLocaleUpperCase('pt-BR')}`}
            </span>
          </div>
          <div className="game-heading">
            <span className="eyebrow">
              {isIntro
                ? 'Jujutsu Kaisen · Criação de personagem'
                : terminal
                  ? 'Registro da sua criação'
                  : 'O acaso decide'}
            </span>
            <h1 id="game-title" ref={heading} tabIndex={-1}>
              {state.phase === 'complete' ? (
                <>
                  <span className="heading-lead">Sua história</span> <em>começa aqui.</em>
                </>
              ) : (
                <>
                  <span className="heading-lead">{wheel.title}</span> <em>{wheel.titleAccent}</em>
                </>
              )}
            </h1>
            <p>
              {isIntro
                ? 'Gire as roletas. Descubra sua origem. Crie um personagem.'
                : terminal
                  ? 'As roletas disponíveis terminaram. Esta é a sua ficha parcial.'
                  : wheel.description}
            </p>
          </div>
          {terminal ? (
            <div className="end-screen">
              <div className="end-mark">
                <Sigil />
              </div>
              <span className="eyebrow">Capítulo {chapterNumber} concluído</span>
              <h2>Ficha parcial registrada</h2>
              <p>
                Os resultados dos capítulos disponíveis estão registrados. Os próximos capítulos
                ainda estão por vir.
              </p>
              <button className="button button-primary" onClick={() => dispatch({ type: 'reset' })}>
                Iniciar nova criação
                <span aria-hidden="true">✦</span>
              </button>
              {state.phase === 'complete' && (
                <span className="restart-note">Uma nova criação apaga os resultados atuais.</span>
              )}
            </div>
          ) : (
            <>
              <Wheel
                key={wheel.id}
                definition={wheel}
                spinning={state.phase === 'spinning'}
                resultId={result?.id}
                reducedMotion={reducedMotion}
                onComplete={completeSpin}
              />
              <div className="wheel-interaction">
                <div className="live-status" role="status" aria-live="polite">
                  {state.phase === 'spinning'
                    ? 'A roleta está girando…'
                    : state.phase === 'revealed'
                      ? `Resultado: ${result?.name}`
                      : '\u00a0'}
                </div>
                {state.phase === 'revealed' && result ? (
                  <ResultReveal result={result} onContinue={() => dispatch({ type: 'continue' })} />
                ) : (
                  <>
                    <button
                      className="button button-primary spin-button"
                      disabled={state.phase === 'spinning'}
                      onClick={isIntro ? () => dispatch({ type: 'start' }) : spin}
                    >
                      <span aria-hidden="true">{state.phase === 'spinning' ? '◌' : '✦'}</span>
                      {isIntro
                        ? 'Iniciar criação'
                        : state.phase === 'spinning'
                          ? 'Revelando resultado…'
                          : `Girar ${wheel.name.toLocaleLowerCase('pt-BR')}`}
                    </button>
                    <p className="interaction-note">
                      {isIntro
                        ? 'Tudo começa com um giro.'
                        : 'Um giro. Um resultado. Sem voltar atrás.'}
                    </p>
                  </>
                )}
              </div>
              <div className="wheel-legend" aria-label="Resultados e probabilidades">
                {getSegments(wheel.options).map(({ option, probability }, index) => (
                  <div className="legend-item" key={option.id}>
                    <span className="legend-swatch" style={{ background: option.color }} />
                    <span className="legend-name">{option.name}</span>
                    <span className="legend-percentage">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'percent',
                        maximumFractionDigits: 2,
                      }).format(probability)}
                    </span>
                    {probability < SMALL_SEGMENT_THRESHOLD && (
                      <span className="legend-index" aria-label={`Marcador ${index + 1} na roleta`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="probability-note">
                {chapter.id === 'physical'
                  ? 'Referências e probabilidades são abstrações do jogo, não classificações oficiais. Não concedem técnicas ou poderes.'
                  : 'Probabilidades de gameplay. Não representam frequências oficiais da obra.'}
                {getSegments(wheel.options).some(
                  ({ probability }) => probability < SMALL_SEGMENT_THRESHOLD,
                ) && ' Os números identificam os segmentos menores na legenda.'}
              </p>
            </>
          )}
        </section>
        <CharacterSheet state={state} />
      </main>
      <footer className="site-footer">
        <span>
          JUJUTSU KAISEN <span className="footer-divider">/</span> FAN PROJECT
        </span>
        <p>Personagem original. Universo de Gege Akutami.</p>
        <span>
          FEITO PARA O ACASO <span aria-hidden="true">✦</span>
        </span>
      </footer>
    </div>
  );
}
