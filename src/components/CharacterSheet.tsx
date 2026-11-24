import { chapters, wheels } from '../data/wheels.ts';
import {
  energySummary,
  forcedOutcome,
  isStageAvailable,
  resultDetails,
  wheelForStep,
} from '../lib/conditions.ts';
import type { GameState } from '../lib/game.ts';
import { advancedSummary } from '../lib/advanced.ts';
import { domainSummary } from '../lib/domains.ts';
import type { ReactNode } from 'react';

export default function CharacterSheet({
  state,
  onInspect,
  showSummaries = true,
  scope,
  compact = false,
}: {
  state: GameState;
  onInspect: (stepId: string) => void;
  showSummaries?: boolean;
  scope?: readonly string[];
  compact?: boolean;
}) {
  const currentChapter = wheels.find((wheel) => wheel.id === state.stepId)?.chapterId;
  const visibleResults =
    state.phase === 'spinning'
      ? Object.fromEntries(Object.entries(state.results).filter(([step]) => step !== state.stepId))
      : state.results;
  const count = Object.keys(visibleResults).length;
  const visibleState = { ...state, results: visibleResults };
  const summary = energySummary(visibleState);
  const resourceSummary = advancedSummary(visibleState);
  const expansionSummary = domainSummary(visibleState);
  const automaticCount = wheels.filter(
    (wheel) => visibleResults[wheel.id] && forcedOutcome(wheel, visibleState),
  ).length;
  return (
    <aside
      className={`character-sheet ${compact ? 'sheet-compact' : ''}`}
      aria-labelledby="sheet-title"
    >
      <div className="sheet-header">
        <span>Registro do personagem</span>
        <span className="sheet-status">
          {state.phase === 'complete' ? 'Concluído' : 'Em criação'}
        </span>
      </div>
      <h2 id="sheet-title">
        <span>Ficha do</span> personagem
      </h2>
      {chapters.map(
        (chapter, index) =>
          (!compact ||
            chapter.id === currentChapter ||
            wheels.some((wheel) => wheel.chapterId === chapter.id && visibleResults[wheel.id])) &&
          (!scope ||
            wheels.some((wheel) => wheel.chapterId === chapter.id && scope.includes(wheel.id))) && (
            <SheetChapter
              key={chapter.id}
              id={`sheet-${chapter.id}`}
              compact={compact}
              open={state.phase !== 'spinning' && chapter.id === currentChapter}
              title={
                <h3 id={`sheet-${chapter.id}`} className="sheet-chapter">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {chapter.name}
                </h3>
              }
            >
              <dl className="sheet-attributes">
                {wheels
                  .filter(
                    (wheel) =>
                      wheel.chapterId === chapter.id &&
                      (!scope || scope.includes(wheel.id)) &&
                      (wheel.id !== 'innate-technique' ||
                        visibleResults['technique-presence'] === 'yes'),
                  )
                  .map((wheel) => {
                    const displayWheel = wheelForStep(wheel.id, visibleState)!;
                    const result = resultDetails(wheel.id, visibleState);
                    const inapplicable =
                      !isStageAvailable(wheel, visibleState) &&
                      wheel.availableWhen &&
                      !!visibleResults[wheel.availableWhen.stepId];
                    return (
                      <div className="sheet-attribute" key={wheel.id}>
                        <dt>{displayWheel.name}</dt>
                        <dd>
                          {result ? (
                            <button
                              className="sheet-result"
                              onClick={() => onInspect(wheel.id)}
                              aria-label={`Ver detalhes de ${displayWheel.name}: ${result.name}`}
                              aria-haspopup="dialog"
                            >
                              <span>
                                {result.name}
                                {result.technique && result.reference?.character && (
                                  <small className="sheet-reference">
                                    Referência: {result.reference.character}
                                  </small>
                                )}
                                {result.domain && (
                                  <small className="sheet-reference">
                                    {result.domain.manifestation === 'incomplete'
                                      ? 'Manifestação incompleta'
                                      : 'Manifestação completa'}
                                    {' · '}
                                    {result.reference?.character}
                                  </small>
                                )}
                                {forcedOutcome(wheel, visibleState) && (
                                  <small className="sheet-reference">Consequência automática</small>
                                )}
                                {result.adjustment && (
                                  <small className="sheet-effect">{result.adjustment.label}</small>
                                )}
                              </span>
                              <span className="sheet-detail-label">Detalhes</span>
                            </button>
                          ) : (
                            <span className="attribute-empty">
                              {inapplicable
                                ? (wheel.unavailableLabel ?? 'Não se aplica')
                                : 'Não sorteado'}
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              {showSummaries && chapter.id === 'mastery' && summary.length > 0 && (
                <div className="sheet-context" aria-label="Resumo das capacidades">
                  <h4>No conjunto</h4>
                  {summary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <small>Interpretação qualitativa do jogo.</small>
                </div>
              )}
              {showSummaries && chapter.id === 'advanced' && resourceSummary.length > 0 && (
                <div className="sheet-context" aria-label="Resumo dos recursos avançados">
                  <h4>Recursos no conjunto</h4>
                  {resourceSummary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <small>Interpretação qualitativa do jogo.</small>
                </div>
              )}
              {showSummaries && chapter.id === 'domains' && expansionSummary.length > 0 && (
                <div className="sheet-context" aria-label="Resumo de barreiras e domínio">
                  <h4>Barreiras e manifestação</h4>
                  {expansionSummary.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <small>Capacidade efetiva: interpretação qualitativa do jogo.</small>
                </div>
              )}
            </SheetChapter>
          ),
      )}
      <div className="sheet-footer">
        <strong>
          {count} resultado{count !== 1 ? 's' : ''} registrado
          {count !== 1 ? 's' : ''}
          {automaticCount > 0 &&
            ` · ${automaticCount} automático${automaticCount !== 1 ? 's' : ''}`}
        </strong>
        <p>
          {count
            ? 'Selecione um resultado para ver os detalhes.'
            : 'Os resultados aparecerão aqui.'}
        </p>
      </div>
    </aside>
  );
}

function SheetChapter({
  id,
  title,
  compact,
  open,
  children,
}: {
  id: string;
  title: ReactNode;
  compact: boolean;
  open: boolean;
  children: ReactNode;
}) {
  return compact ? (
    <details className="sheet-chapter-group" open={open}>
      <summary>{title}</summary>
      {children}
    </details>
  ) : (
    <section className="sheet-chapter-group" aria-labelledby={id}>
      {title}
      {children}
    </section>
  );
}
