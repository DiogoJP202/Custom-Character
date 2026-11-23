import { useEffect, useRef, useState, type Ref } from 'react';
import {
  characterExportData,
  renderCharacterPng,
  type CharacterExportData,
} from '../lib/character-export.ts';
import type { GameState } from '../lib/game.ts';

export default function CharacterExportCard({
  data,
  ref,
}: {
  data: CharacterExportData;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="character-export-card" ref={ref} data-density="normal">
      <div className="cex-brand">
        <span>CUSTOM CHARACTER</span>
        <span>JUJUTSU KAISEN / FAN GAME</span>
      </div>
      <header className="cex-identity" data-export-region>
        <p className="cex-eyebrow">Ficha do personagem</p>
        <h2 className="cex-name" data-long={(data.name ?? data.identity).length > 35}>
          {data.name ?? data.identity}
        </h2>
        {data.name && <p className="cex-identity-title">{data.identity}</p>}
        <p className="cex-summary">{data.summary}</p>
      </header>
      <dl className="cex-facts" data-export-region>
        {data.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="cex-body" data-export-region>
        <section className="cex-capabilities" data-export-region>
          <h3 className="cex-section-title">Capacidades</h3>
          {data.capabilities.map((capability) => (
            <section className="cex-capability" key={capability.id} data-export-region>
              <h4>{capability.title}</h4>
              {capability.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </section>
        <div className="cex-interpretation" data-export-region>
          <section className="cex-style" data-export-region>
            <h3 className="cex-section-title">Como atua</h3>
            {data.combatStyle.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
          {data.strengths.length > 0 && (
            <section className="cex-assessment" data-export-region>
              <h3 className="cex-section-title">Pontos fortes</h3>
              <ul>
                {data.strengths.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          )}
          {data.limitations.length > 0 && (
            <section className="cex-assessment cex-limits" data-export-region>
              <h3 className="cex-section-title">Limitações</h3>
              <ul>
                {data.limitations.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      <footer className="cex-footer" data-export-region>
        {data.catalogNote && <p>{data.catalogNote}</p>}
        <p>Personagem gerado em um fan game. Descrições e escalas são interpretações do jogo.</p>
        <span>Custom Character · Universo de Gege Akutami</span>
      </footer>
    </div>
  );
}

export function CharacterExportButton({
  state,
  name,
  scope,
}: {
  state: GameState;
  name?: string;
  scope?: readonly string[];
}) {
  const [draft, setDraft] = useState<CharacterExportData | null>(null);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const card = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const objectURL = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    },
    [],
  );
  useEffect(() => {
    if (!draft || !card.current) return;
    const controller = new AbortController();
    renderCharacterPng(card.current, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        const next = { url: URL.createObjectURL(blob), filename: draft.filename };
        objectURL.current = next.url;
        setDownload(next);
        const anchor = document.createElement('a');
        anchor.href = next.url;
        anchor.download = next.filename;
        document.body.append(anchor);
        try {
          anchor.click();
        } catch {
          /* The persistent link keeps an explicit download available. */
        } finally {
          anchor.remove();
        }
        setMessage('PNG gerado. O download foi solicitado ao navegador.');
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Não foi possível gerar a imagem PNG. Tente novamente.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          lock.current = false;
          setDraft(null);
        }
      });
    return () => controller.abort();
  }, [draft]);

  function start() {
    if (lock.current) return;
    setError('');
    setMessage('');
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = null;
    setDownload(null);
    try {
      const data = characterExportData(state, name, scope);
      lock.current = true;
      setDraft(data);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Não foi possível preparar a ficha para exportar.',
      );
    }
  }
  return (
    <div className="profile-export">
      <button
        className="button button-secondary"
        disabled={!!draft}
        aria-busy={!!draft}
        onClick={start}
      >
        {draft ? 'Gerando PNG…' : 'Exportar PNG'}
      </button>
      {draft && <p role="status">Preparando a imagem e incorporando as fontes…</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="export-error" role="alert">
          {error}
        </p>
      )}
      {download && (
        <a href={download.url} download={download.filename}>
          Baixar PNG novamente
        </a>
      )}
      {draft && (
        <div className="character-export-stage" aria-hidden="true" inert>
          <CharacterExportCard data={draft} ref={card} />
        </div>
      )}
    </div>
  );
}
