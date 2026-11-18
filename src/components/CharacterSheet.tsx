import { getOption, wheels } from '../data/wheels.ts';
import type { GameState } from '../lib/game.ts';
import { Sigil } from './Wheel.tsx';

export default function CharacterSheet({ state }: { state: GameState }) {
  const visibleResults =
    state.phase === 'spinning'
      ? Object.fromEntries(Object.entries(state.results).filter(([step]) => step !== state.stepId))
      : state.results;
  const count = Object.keys(visibleResults).length;
  const human = visibleResults.nature === 'human';
  return (
    <aside
      className={`character-sheet ${state.phase === 'complete' ? 'sheet-complete' : ''}`}
      aria-labelledby="sheet-title"
    >
      <div className="sheet-header">
        <span className="eyebrow">Registro de personagem</span>
        <span className="sheet-number">JJK / 001</span>
      </div>
      <div className="sheet-emblem">
        <Sigil />
        <span>IDENTIDADE EM FORMAÇÃO</span>
      </div>
      <div className="sheet-title-row">
        <h2 id="sheet-title">Sua ficha</h2>
        <span className="sheet-tag">PARCIAL</span>
      </div>
      <p className="sheet-intro">Uma origem. Muitas possibilidades.</p>
      <div className="sheet-chapter">
        <span>01</span>
        <h3>Origem</h3>
        <span className="chapter-rule" />
      </div>
      <dl className="sheet-attributes">
        {wheels.map((wheel) => {
          const result = getOption(wheel.id, visibleResults[wheel.id]);
          const inapplicable = wheel.id === 'lineage' && !!visibleResults.nature && !human;
          return (
            <div className={`sheet-attribute ${result ? 'is-filled' : ''}`} key={wheel.id}>
              <dt>
                <span className="attribute-diamond" aria-hidden="true">
                  ◇
                </span>
                {wheel.name}
              </dt>
              <dd>
                {result ? (
                  <>
                    <span className="attribute-color" style={{ background: result.color }} />
                    {result.name}
                  </>
                ) : (
                  <span className="attribute-empty">
                    {inapplicable ? 'Exclusiva para humanos' : 'Ainda não revelada'}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="sheet-bottom">
        <span className="small-seal" aria-hidden="true">
          ✳
        </span>
        <p>
          {count === 0
            ? 'Os resultados de cada giro serão registrados aqui.'
            : state.phase === 'complete'
              ? 'Origem registrada. Sua criação está salva neste navegador.'
              : 'Cada resultado faz parte da sua história.'}
        </p>
      </div>
      <div className="sheet-footer">
        <span>CAPÍTULO 1</span>
        <span>
          {String(count).padStart(2, '0')} ATRIBUTO{count !== 1 ? 'S' : ''}
        </span>
      </div>
    </aside>
  );
}
