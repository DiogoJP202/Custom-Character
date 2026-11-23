import { useEffect, useRef, useState } from 'react';
import { characterProfile } from '../lib/character-profile.ts';
import { wheelForStep } from '../lib/conditions.ts';
import type { GameState } from '../lib/game.ts';
import CharacterSheet from './CharacterSheet.tsx';

export default function FinalCharacterSheet({
  state,
  onInspect,
  onReset,
  onRetry,
  onSave,
  savedName,
  characterName,
  readOnly = false,
  scope,
}: {
  state: GameState;
  onInspect: (stepId: string) => void;
  onReset?: () => void;
  onRetry?: () => void;
  onSave?: () => void;
  savedName?: string;
  characterName?: string;
  readOnly?: boolean;
  scope?: readonly string[];
}) {
  const profile = characterProfile(state, scope);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <article className="final-sheet" aria-labelledby="profile-title">
      <header className="profile-identity">
        <div>
          <p className="profile-eyebrow">Personagem original / Identidade</p>
          <h2 id="profile-title">{characterName ?? profile.title}</h2>
          {characterName && <p className="profile-derived-title">{profile.title}</p>}
          <p className="profile-summary">{profile.summary}</p>
          <small>Descrição derivada dos resultados, sem classe ou grau oficial.</small>
        </div>
        <dl className="profile-facts">
          {profile.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="profile-capacities" aria-labelledby="profile-capacities-title">
        <div className="profile-section-heading">
          <h2 id="profile-capacities-title">Capacidades</h2>
          <span>Resultados recebidos e uso efetivo</span>
        </div>
        {profile.capabilities.map((capability) => (
          <section className="profile-capability" key={capability.id}>
            <h3>{capability.title}</h3>
            <div>
              {capability.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="profile-detail-links" aria-label={`Consultar ${capability.title}`}>
                {capability.steps.map((stepId) => (
                  <button key={stepId} onClick={() => onInspect(stepId)} aria-haspopup="dialog">
                    {wheelForStep(stepId, state)?.name}
                    <span aria-hidden="true"> ↗</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ))}
      </section>

      <section className="profile-style" aria-labelledby="profile-style-title">
        <div className="profile-section-heading">
          <h2 id="profile-style-title">Como atua</h2>
        </div>
        <h3>Estilo de combate</h3>
        {profile.combatStyle.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="profile-assessment">
          {profile.strengths.length > 0 && (
            <section aria-labelledby="profile-strengths-title">
              <h3 id="profile-strengths-title">Pontos fortes</h3>
              <ul>
                {profile.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {profile.limitations.length > 0 && (
            <section aria-labelledby="profile-limits-title">
              <h3 id="profile-limits-title">Limitações</h3>
              <ul>
                {profile.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      {profile.catalogNote && <p className="profile-catalog-note">{profile.catalogNote}</p>}
      <details className="profile-full-results">
        <summary>
          Resultados completos e referências <span aria-hidden="true">+</span>
        </summary>
        <CharacterSheet state={state} onInspect={onInspect} showSummaries={false} scope={scope} />
      </details>
      {!readOnly && (
        <footer className="profile-actions">
          <div>
            {onSave && (
              <button className="button button-primary" disabled={!!savedName} onClick={onSave}>
                {savedName ? 'Salvo na galeria' : 'Salvar na galeria'}
              </button>
            )}
            {onReset && (
              <button className="button button-secondary" onClick={() => setConfirmReset(true)}>
                Criar outro personagem
              </button>
            )}
            {import.meta.env.DEV && onRetry && (
              <button className="button button-secondary" onClick={onRetry}>
                Tentar novamente
              </button>
            )}
          </div>
          <p>
            {savedName
              ? `“${savedName}” permanece na galeria ao iniciar outra criação.`
              : 'Uma nova criação substitui a ficha ativa. Salve na galeria para guardar estes resultados.'}
          </p>
          {savedName && <p role="status">Salvo na galeria como “{savedName}”.</p>}
        </footer>
      )}
      {!readOnly && confirmReset && onReset && (
        <ResetConfirmation
          savedName={savedName}
          onCancel={() => setConfirmReset(false)}
          onConfirm={onReset}
        />
      )}
    </article>
  );
}

function ResetConfirmation({
  onCancel,
  onConfirm,
  savedName,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  savedName?: string;
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
      aria-labelledby="reset-title"
      aria-describedby="reset-description"
      onClose={(event) => {
        if (!event.currentTarget.open) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <h2 id="reset-title">{savedName ? 'Iniciar outra criação?' : 'Substituir esta ficha?'}</h2>
      <p id="reset-description">
        {savedName
          ? `“${savedName}” está na galeria e será preservado. Somente a criação ativa será substituída.`
          : 'Este personagem ainda não foi salvo na galeria. A nova criação substituirá seus resultados ativos.'}
      </p>
      <div>
        <button
          className="button button-secondary"
          onClick={() => dialog.current?.close()}
          autoFocus
        >
          Manter ficha
        </button>
        <button className="button button-primary" onClick={onConfirm}>
          Criar e substituir
        </button>
      </div>
    </dialog>
  );
}
