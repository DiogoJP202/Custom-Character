import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getOption } from '../data/wheels.ts';
import { characterProfile } from '../lib/character-profile.ts';
import { forcedOutcome, resultDetails, wheelForStep } from '../lib/conditions.ts';
import {
  archiveStepIds,
  MAX_CHARACTERS,
  MAX_CHARACTER_NAME,
  type GalleryResult,
  type GalleryState,
} from '../lib/character-gallery.ts';
import FinalCharacterSheet from './FinalCharacterSheet.tsx';
import { ResultDialog } from './ResultReveal.tsx';

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));

export default function CharacterGallery({
  gallery,
  onRefresh,
  onReturn,
  onRename,
  onDelete,
}: {
  gallery: GalleryState;
  onRefresh: () => void;
  onReturn: () => void;
  onRename: (id: string, name: string) => GalleryResult;
  onDelete: (id: string) => GalleryResult;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectedStep, setInspectedStep] = useState<string | null>(null);
  const [action, setAction] = useState<'rename' | 'delete' | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = gallery.records.find((record) => record.id === selectedId);
  const scope = selected && archiveStepIds(selected);
  const inspectedWheel =
    selected && inspectedStep && scope?.includes(inspectedStep)
      ? wheelForStep(inspectedStep, selected.snapshot)
      : undefined;
  const inspectedResult =
    selected && inspectedWheel && resultDetails(inspectedWheel.id, selected.snapshot);
  useEffect(() => {
    heading.current?.focus();
  }, [selectedId, !!selected]);

  return (
    <main id="game" className="gallery-page">
      <header className="gallery-heading">
        {selected && (
          <button
            className="gallery-back"
            onClick={() => {
              setSelectedId(null);
              setInspectedStep(null);
              setAction(null);
            }}
          >
            ← Voltar à galeria
          </button>
        )}
        <h1 ref={heading} tabIndex={-1}>
          {selected ? selected.name : 'Meus personagens'}
        </h1>
        <p>
          {selected
            ? `Criação salva em ${dateLabel(selected.createdAt)} · Ficha arquivada, somente leitura.`
            : `${gallery.records.length} / ${MAX_CHARACTERS} personagens · Salvos neste navegador.`}
        </p>
        <div className="gallery-toolbar">
          {selected ? (
            <>
              <button
                className="button button-secondary"
                disabled={!!gallery.error}
                onClick={() => setAction('rename')}
              >
                Renomear
              </button>
              <button
                className="button button-secondary gallery-delete"
                disabled={!!gallery.error}
                onClick={() => setAction('delete')}
              >
                Excluir
              </button>
            </>
          ) : (
            <button className="button button-secondary" onClick={onReturn}>
              Voltar à criação
            </button>
          )}
        </div>
      </header>
      {gallery.error && (
        <div className="gallery-error" role="alert">
          <p>{gallery.error}</p>
          <button className="button button-secondary" onClick={onRefresh}>
            Recarregar galeria
          </button>
        </div>
      )}
      {(notice || (selectedId && !selected)) && (
        <p role="status" className="gallery-notice">
          {selectedId && !selected
            ? 'Este personagem não está mais disponível na coleção.'
            : notice}
        </p>
      )}
      {selected ? (
        <FinalCharacterSheet
          key={selected.id}
          state={selected.snapshot}
          characterName={selected.name}
          readOnly
          scope={scope}
          onInspect={setInspectedStep}
        />
      ) : (
        <>
          {gallery.records.length === 0 && !gallery.error ? (
            <section className="gallery-empty">
              <h2>Nenhum personagem salvo</h2>
              <p>
                Conclua uma criação e selecione “Salvar na galeria” na Ficha Final. Sua partida
                atual continua disponível.
              </p>
            </section>
          ) : (
            <div className="gallery-grid">
              {gallery.records.map((record) => {
                const profile = characterProfile(record.snapshot, archiveStepIds(record));
                const r = record.snapshot.results;
                const technique =
                  r['technique-presence'] === 'yes' &&
                  getOption('innate-technique', r['innate-technique']);
                const tool = r.equipment !== 'none' && getOption('equipment', r.equipment);
                const domain = getOption('domain-expansion', r['domain-expansion']);
                return (
                  <article className="gallery-card" key={record.id}>
                    <p className="gallery-card-date">
                      <time dateTime={record.createdAt}>
                        Salvo em {dateLabel(record.createdAt)}
                      </time>
                    </p>
                    <h2>
                      <button
                        onClick={() => {
                          setSelectedId(record.id);
                          setAction(null);
                          setInspectedStep(null);
                          setNotice('');
                        }}
                        aria-label={`Abrir ficha de ${record.name}`}
                      >
                        {record.name}
                      </button>
                    </h2>
                    <p className="gallery-card-identity">{profile.title}</p>
                    <dl>
                      {profile.facts
                        .filter((fact) => fact.label !== 'Condição de nascimento')
                        .map((fact) => (
                          <div key={fact.label}>
                            <dt>{fact.label}</dt>
                            <dd>{fact.value}</dd>
                          </div>
                        ))}
                      {technique && (
                        <div>
                          <dt>Técnica</dt>
                          <dd>{technique.name}</dd>
                        </div>
                      )}
                      {tool && (
                        <div>
                          <dt>Equipamento</dt>
                          <dd>{tool.name}</dd>
                        </div>
                      )}
                      {domain?.domain && (
                        <div>
                          <dt>Domínio</dt>
                          <dd>{domain.name}</dd>
                        </div>
                      )}
                    </dl>
                    <span className="gallery-open-label" aria-hidden="true">
                      Abrir ficha ↗
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {selected && action === 'rename' && (
        <GalleryNameDialog
          title="Renomear personagem"
          initialName={selected.name}
          onCancel={() => setAction(null)}
          onSubmit={(name) => {
            const result = onRename(selected.id, name);
            if (!result.ok) return result.error;
            setAction(null);
            setNotice('Nome atualizado. Os resultados foram preservados.');
          }}
        />
      )}
      {selected && action === 'delete' && (
        <GalleryDeleteDialog
          name={selected.name}
          onCancel={() => setAction(null)}
          onConfirm={() => {
            const result = onDelete(selected.id);
            if (!result.ok) return result.error;
            setSelectedId(null);
            setInspectedStep(null);
            setAction(null);
            setNotice('Personagem excluído da galeria. A criação ativa foi preservada.');
          }}
        />
      )}
      {selected && inspectedWheel && inspectedResult && (
        <ResultDialog
          attribute={inspectedWheel.name}
          result={inspectedResult}
          automaticReason={forcedOutcome(inspectedWheel, selected.snapshot)?.reason}
          onClose={() => setInspectedStep(null)}
        />
      )}
    </main>
  );
}

function GalleryDialog({
  title,
  onCancel,
  children,
  destructive = false,
}: {
  title: string;
  onCancel: () => void;
  children: ReactNode;
  destructive?: boolean;
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
      className="profile-reset-dialog gallery-dialog"
      role={destructive ? 'alertdialog' : undefined}
      aria-labelledby="gallery-dialog-title"
      aria-describedby="gallery-dialog-description"
      onClose={(event) => {
        if (!event.currentTarget.open) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <h2 id="gallery-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}

export function GalleryNameDialog({
  title,
  initialName = '',
  optional = false,
  onCancel,
  onSubmit,
}: {
  title: string;
  initialName?: string;
  optional?: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => string | undefined;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  return (
    <GalleryDialog title={title} onCancel={onCancel}>
      <p id="gallery-dialog-description">
        {optional
          ? 'O nome é opcional. Sem nome, será usado “Personagem 01” ou o próximo nome disponível.'
          : 'O nome identifica sua ficha; os resultados não serão alterados.'}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const failure = onSubmit(name);
          if (failure) setError(failure);
        }}
      >
        <label htmlFor="gallery-character-name">
          Nome do personagem {optional && '(opcional)'}
        </label>
        <input
          id="gallery-character-name"
          value={name}
          maxLength={MAX_CHARACTER_NAME}
          autoFocus
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? 'gallery-form-error gallery-name-limit' : 'gallery-name-limit'}
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
        />
        <small id="gallery-name-limit">Até {MAX_CHARACTER_NAME} caracteres.</small>
        {error && (
          <p className="gallery-form-error" id="gallery-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="gallery-dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary">
            {optional ? 'Salvar personagem' : 'Salvar nome'}
          </button>
        </div>
      </form>
    </GalleryDialog>
  );
}

function GalleryDeleteDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => string | undefined;
}) {
  const [error, setError] = useState('');
  return (
    <GalleryDialog title="Excluir personagem?" onCancel={onCancel} destructive>
      <p id="gallery-dialog-description">
        “{name}” será removido da galeria. A criação ativa e os outros personagens serão
        preservados.
      </p>
      {error && (
        <p className="gallery-form-error" role="alert">
          {error}
        </p>
      )}
      <div className="gallery-dialog-actions">
        <button className="button button-secondary" onClick={onCancel} autoFocus>
          Manter personagem
        </button>
        <button
          className="button button-primary"
          onClick={() => {
            const failure = onConfirm();
            if (failure) setError(failure);
          }}
        >
          Excluir personagem
        </button>
      </div>
    </GalleryDialog>
  );
}
