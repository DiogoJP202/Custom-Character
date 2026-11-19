import { useEffect, useRef, type Ref } from 'react';
import type { WheelOption } from '../data/wheels.ts';

function ResultContent({
  attribute,
  result,
  headingId,
  headingRef,
}: {
  attribute: string;
  result: WheelOption;
  headingId: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const reference = result.reference;
  const initials = result.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  return (
    <>
      <header className={`result-header ${reference ? 'has-reference' : ''}`}>
        {reference && (
          <div className="reference-portrait" aria-hidden="true">
            <span className="portrait-label">PERSONAGEM DE REFERÊNCIA</span>
            <span className="portrait-initials">{initials}</span>
            <span className="portrait-caption">JUJUTSU KAISEN</span>
          </div>
        )}
        <div className="result-identity">
          <span className="result-attribute">
            Resultado <span aria-hidden="true">/</span> {attribute}
          </span>
          <h2 id={headingId} ref={headingRef} tabIndex={-1}>
            {result.name}
          </h2>
          {reference && <p className="reference-version">{reference.version}</p>}
        </div>
      </header>
      <div className="result-body">
        <section className="practical-description">
          <h3>{reference ? 'Na prática' : 'Descrição'}</h3>
          <p>{result.description}</p>
        </section>
        {reference && (
          <>
            <section className="reference-feats" aria-label="Feitos e contexto">
              <h3>Na obra</h3>
              <ul>
                {reference.feats.map((feat) => (
                  <li key={`${feat.source.url}-${feat.description}`}>
                    <p className="feat-description">{feat.description}</p>
                    <p className="feat-context">{feat.context}</p>
                    <a
                      className="reference-source"
                      href={feat.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Consultar sinopse oficial: ${feat.source.label}`}
                    >
                      {feat.source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section className="comparison-limits">
              <h3>Limites da comparação</h3>
              <p>{reference.limitations}</p>
            </section>
            <p className="reference-disclaimer">
              A aplicação deste desempenho ao seu personagem é uma abstração do jogo, não uma
              classificação oficial.
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default function ResultReveal({
  attribute,
  result,
  onContinue,
  focusOnMount = true,
}: {
  attribute: string;
  result: WheelOption;
  onContinue: () => void;
  focusOnMount?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const hasFocused = useRef(false);
  useEffect(() => {
    if (!focusOnMount || hasFocused.current) return;
    hasFocused.current = true;
    heading.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [focusOnMount]);
  return (
    <section ref={panel} className="result-reveal" aria-labelledby="result-title">
      <ResultContent
        attribute={attribute}
        result={result}
        headingId="result-title"
        headingRef={heading}
      />
      <div className="result-actions">
        <button className="button button-primary" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </section>
  );
}

export function ResultDialog({
  attribute,
  result,
  onClose,
}: {
  attribute: string;
  result: WheelOption;
  onClose: () => void;
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
      className="result-dialog"
      aria-labelledby="detail-title"
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="dialog-toolbar">
        <span>Detalhes do resultado</span>
        <button className="dialog-close" onClick={() => dialog.current?.close()} autoFocus>
          Fechar <span aria-hidden="true">×</span>
        </button>
      </div>
      <ResultContent attribute={attribute} result={result} headingId="detail-title" />
    </dialog>
  );
}
