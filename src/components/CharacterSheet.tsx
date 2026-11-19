import { chapters, getOption, isWheelAvailable, wheels } from '../data/wheels.ts';
import type { GameState } from '../lib/game.ts';

export default function CharacterSheet({
  state,
  onInspect,
}: {
  state: GameState;
  onInspect: (stepId: string) => void;
}) {
  const visibleResults =
    state.phase === 'spinning'
      ? Object.fromEntries(Object.entries(state.results).filter(([step]) => step !== state.stepId))
      : state.results;
  const count = Object.keys(visibleResults).length;
  return (
    <aside className="character-sheet" aria-labelledby="sheet-title">
      <div className="sheet-header">
        <span>Registro do personagem</span>
        <span className="sheet-status">
          {state.phase === 'complete' ? 'Concluído' : 'Em criação'}
        </span>
      </div>
      <h2 id="sheet-title">
        <span>Ficha do</span> personagem
      </h2>
      {chapters.map((chapter, index) => (
        <section
          className="sheet-chapter-group"
          key={chapter.id}
          aria-labelledby={`sheet-${chapter.id}`}
        >
          <h3 id={`sheet-${chapter.id}`} className="sheet-chapter">
            <span>{String(index + 1).padStart(2, '0')}</span>
            {chapter.name}
          </h3>
          <dl className="sheet-attributes">
            {wheels
              .filter((wheel) => wheel.chapterId === chapter.id)
              .map((wheel) => {
                const result = getOption(wheel.id, visibleResults[wheel.id]);
                const inapplicable =
                  wheel.availableWhen &&
                  !!visibleResults[wheel.availableWhen.stepId] &&
                  !isWheelAvailable(wheel, visibleResults);
                return (
                  <div className="sheet-attribute" key={wheel.id}>
                    <dt>{wheel.name}</dt>
                    <dd>
                      {result ? (
                        <button
                          className="sheet-result"
                          onClick={() => onInspect(wheel.id)}
                          aria-label={`Ver detalhes de ${wheel.name}: ${result.name}`}
                          aria-haspopup="dialog"
                        >
                          <span>{result.name}</span>
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
        </section>
      ))}
      <div className="sheet-footer">
        <strong>
          {count} resultado{count !== 1 ? 's' : ''}
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
