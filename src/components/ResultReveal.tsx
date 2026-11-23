import { useEffect, useRef, type Ref } from 'react';
import type { WheelOption } from '../data/wheels.ts';

function ResultContent({
  attribute,
  result,
  headingId,
  headingRef,
  automaticReason,
}: {
  attribute: string;
  result: WheelOption;
  headingId: string;
  headingRef?: Ref<HTMLHeadingElement>;
  automaticReason?: string;
}) {
  const reference = result.reference;
  const isProficiency = reference?.topic === 'proficiency';
  const isTechnique = !!result.technique || isProficiency;
  const isEnergy = reference?.topic === 'energy';
  const isResource = reference?.topic === 'resource';
  const representativeFeat = reference?.feats[0];
  return (
    <>
      <header className={`result-header ${reference ? 'has-reference' : ''}`}>
        {reference && (
          <div className="reference-print" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        <div className="result-identity">
          <span className="result-attribute">
            {automaticReason ? 'Resultado automático' : 'Resultado'}{' '}
            <span aria-hidden="true">/</span> {attribute}
          </span>
          <h2 id={headingId} ref={headingRef} tabIndex={-1}>
            {result.name}
          </h2>
          {reference && (
            <p className="reference-version">
              {isEnergy || isResource ? (
                isResource ? (
                  'Requisitos e uso do recurso'
                ) : (
                  'Escala qualitativa do jogo'
                )
              ) : (
                <>
                  {result.adjustment && 'Referência sorteada · '}
                  {reference.character && `${reference.character} · `}
                  {reference.version}
                </>
              )}
            </p>
          )}
        </div>
      </header>
      <div className={`result-body ${reference ? '' : 'simple-result'}`}>
        <section className="practical-description">
          {automaticReason && (
            <p className="comparison-note" role="status">
              Consequência automática: {automaticReason} Não é necessário girar esta etapa.
            </p>
          )}
          <h3>
            {isTechnique || isResource
              ? 'Como funciona'
              : reference
                ? 'No seu personagem'
                : 'Descrição'}
          </h3>
          {result.adjustment && <p className="result-adjustment">{result.adjustment.label}</p>}
          <p>{result.description}</p>
          {reference && (
            <p className="comparison-note">
              {isResource
                ? 'O exemplo da obra não concede a experiência do personagem.'
                : isProficiency
                  ? 'Proficiência não elimina requisitos, custos ou recursos ausentes.'
                  : isTechnique
                    ? 'Receber a técnica não concede o domínio demonstrado pelo personagem.'
                    : isEnergy
                      ? 'O exemplo ilustra o conceito; não equivale ao nível sorteado.'
                      : 'Interpretação para o jogo, não uma equivalência exata.'}
            </p>
          )}
        </section>
        {reference?.initialUse && (
          <section className="representative-feat">
            <h3>
              {isResource
                ? 'Uso com seus resultados'
                : isProficiency
                  ? 'Aplicações possíveis'
                  : 'Uso inicial'}
            </h3>
            <p>{reference.initialUse}</p>
          </section>
        )}
        {representativeFeat && !result.adjustment && !isTechnique && !isEnergy && !isResource && (
          <section className="representative-feat" aria-label="Feito representativo">
            <h3>Na obra</h3>
            <p>{representativeFeat.description}</p>
          </section>
        )}
        {(reference || result.notes || result.sources?.length) && (
          <details className="reference-details">
            <summary>
              {reference ? 'Feitos, fontes e limites' : 'Contexto, fontes e limites'}{' '}
              <span aria-hidden="true">+</span>
            </summary>
            <div className="reference-details-body">
              {result.notes && <p className="feat-context">{result.notes}</p>}
              {result.sources?.map((source) => (
                <p key={`${source.url}-${source.label}`}>
                  <a
                    className="reference-source"
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label}
                  </a>
                </p>
              ))}
              {reference && (
                <>
                  <section className="reference-feats" aria-label="Feitos e contexto">
                    <h3>Feitos e contexto</h3>
                    {(isEnergy || isResource) && (
                      <p className="reference-version">
                        {reference.character} · {reference.version}
                      </p>
                    )}
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
                            title={`Abrir sinopse oficial em nova aba: ${feat.source.label}`}
                          >
                            {feat.source.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="comparison-limits">
                    <h3>{isProficiency ? 'Condições da técnica' : 'Limites da comparação'}</h3>
                    <p>{reference.limitations}</p>
                  </section>
                  <p className="reference-disclaimer">
                    {isResource ? (
                      'O resultado registra um recurso neste cenário de fã. Requisitos de energia, corpo, treinamento e ativação continuam valendo. Não concede domínio de armas, técnicas adicionais ou vitória garantida. As fontes oficiais indicam cenas e capítulos de leitura; as sinopses não detalham todas as condições.'
                    ) : isEnergy ? (
                      'Controle, output e reserva são capacidades distintas. Esta escala e suas combinações são abstrações do jogo; os exemplos não transferem técnicas, características especiais ou a experiência dos personagens. As fontes indicam o contexto oficial, sem classificar os níveis desta escala.'
                    ) : isProficiency ? (
                      'A proficiência descreve aplicações acessíveis, não todo o repertório do personagem de referência. Energia, condições de ativação, fisiologia e recursos necessários continuam limitando o uso. Não concede domínios ou aplicações reversas.'
                    ) : isTechnique ? (
                      'O sorteio atribui a técnica, não o domínio de suas aplicações. Não concede equipamentos, treinamento, expansões de domínio ou aplicações reversas. Os links indicam referências oficiais de leitura; suas sinopses não descrevem todas as condições de uso.'
                    ) : (
                      <>
                        A aplicação deste desempenho ao seu personagem é uma abstração do jogo, não
                        uma classificação oficial. As cenas podem incluir reforço de energia
                        amaldiçoada, armas e técnicas; a obra não fornece uma medida isolada do
                        corpo. Este resultado não concede esses recursos. Os links levam às sinopses
                        oficiais dos episódios; elas resumem o confronto, sem descrever cada
                        movimento.
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </>
  );
}

export default function ResultReveal({
  attribute,
  result,
  onContinue,
  onRetry,
  focusOnMount = true,
  reducedMotion = false,
  automaticReason,
}: {
  attribute: string;
  result: WheelOption;
  onContinue: () => void;
  onRetry?: () => void;
  focusOnMount?: boolean;
  reducedMotion?: boolean;
  automaticReason?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const hasFocused = useRef(false);
  useEffect(() => {
    if (!focusOnMount || hasFocused.current) return;
    hasFocused.current = true;
    heading.current?.focus({ preventScroll: true });
    // Reveal more of a long result while leaving the bottom of the wheel as context.
    const bounds = panel.current?.getBoundingClientRect();
    const context = Math.min(144, window.innerHeight * 0.2);
    if (bounds && automaticReason && bounds.top < 24) {
      // Removing the wheel shortens this stage; keep its explanation in view.
      window.scrollBy({ top: bounds.top - 24, behavior: reducedMotion ? 'instant' : 'smooth' });
    } else if (bounds && bounds.bottom > window.innerHeight && bounds.top > context) {
      window.scrollBy({
        top: Math.min(bounds.top - context, bounds.bottom - window.innerHeight + 24),
        behavior: reducedMotion ? 'instant' : 'smooth',
      });
    }
  }, [focusOnMount, reducedMotion, automaticReason]);
  return (
    <section ref={panel} className="result-reveal" aria-labelledby="result-title">
      <ResultContent
        attribute={attribute}
        result={result}
        headingId="result-title"
        headingRef={heading}
        automaticReason={automaticReason}
      />
      <div className="result-actions">
        {import.meta.env.DEV && onRetry && (
          <button className="button button-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
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
  onRetry,
  automaticReason,
}: {
  attribute: string;
  result: WheelOption;
  onClose: () => void;
  onRetry?: () => void;
  automaticReason?: string;
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
    >
      <div className="dialog-toolbar">
        <span>Detalhes do resultado</span>
        <button className="dialog-close" onClick={() => dialog.current?.close()} autoFocus>
          Fechar <span aria-hidden="true">×</span>
        </button>
      </div>
      <ResultContent
        attribute={attribute}
        result={result}
        headingId="detail-title"
        automaticReason={automaticReason}
      />
      {import.meta.env.DEV && onRetry && (
        <div className="test-retry-actions">
          <p>Repetir esta etapa apaga este resultado e os seguintes.</p>
          <button className="button button-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}
    </dialog>
  );
}
