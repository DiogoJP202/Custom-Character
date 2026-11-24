import { useEffect, useRef, type Ref } from 'react';
import { getOption, type WheelOption } from '../data/wheels.ts';
import { revealPresentation } from '../lib/gameplay.ts';
import type { RuleContext } from '../lib/conditions.ts';
import ResultMedia from './ResultMedia.tsx';
import { mediaForResult } from '../data/reveal-media.ts';
import { effectForResult } from '../data/reveal-effects.ts';
import { formatChance, rarityLabels, type Rarity } from '../lib/rarity.ts';

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
  const isDomain = !!result.domain;
  const representativeFeat = reference?.feats[0];
  return (
    <>
      <header
        className={`result-header ${reference ? 'has-reference' : ''} ${isDomain ? 'domain-result-header' : ''}`}
      >
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
          {result.domain && (
            <p className="domain-manifestation">
              {result.domain.relatedTechnique} ·{' '}
              {result.domain.manifestation === 'incomplete'
                ? 'Manifestação incompleta documentada'
                : 'Manifestação completa documentada'}
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
            {isTechnique || isResource || isDomain
              ? 'Como funciona'
              : reference
                ? 'No seu personagem'
                : 'Descrição'}
          </h3>
          {result.adjustment && <p className="result-adjustment">{result.adjustment.label}</p>}
          <p>{result.description}</p>
          {reference && (
            <p className="comparison-note">
              {isDomain
                ? 'Acesso à expansão não transfere a perícia do personagem de referência.'
                : isResource
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
              {isDomain
                ? 'Capacidade efetiva de utilização'
                : isResource
                  ? 'Uso com seus resultados'
                  : isProficiency
                    ? 'Aplicações possíveis'
                    : 'Uso inicial'}
            </h3>
            <p>{reference.initialUse}</p>
          </section>
        )}
        {representativeFeat &&
          !result.adjustment &&
          !isTechnique &&
          !isEnergy &&
          !isResource &&
          !isDomain && (
            <section className="representative-feat" aria-label="Feito representativo">
              <h3>Na obra</h3>
              <p>{representativeFeat.description}</p>
            </section>
          )}
        {(reference || result.notes || result.sources?.length) && (
          <details className="reference-details" open>
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
                    <h3>
                      {isDomain
                        ? 'Limites da expansão'
                        : isProficiency
                          ? 'Condições da técnica'
                          : 'Limites da comparação'}
                    </h3>
                    <p>{reference.limitations}</p>
                  </section>
                  <p className="reference-disclaimer">
                    {isDomain ? (
                      'A manifestação conserva as propriedades documentadas. As condições sorteadas afetam sua execução, sem criar versões alternativas, garantir vitória ou conceder repertório, energia e características adicionais.'
                    ) : isResource ? (
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
  stepId,
  state,
  attribute,
  result,
  onContinue,
  onRetry,
  focusOnMount = true,
  reducedMotion = false,
  automaticReason,
  animate = false,
  chance,
  reconstructedChance = false,
}: {
  stepId: string;
  state: RuleContext;
  attribute: string;
  result: WheelOption;
  onContinue: () => void;
  onRetry?: () => void;
  focusOnMount?: boolean;
  reducedMotion?: boolean;
  automaticReason?: string;
  animate?: boolean;
  chance?: { probability: number; rarity: Rarity };
  reconstructedChance?: boolean;
}) {
  const presentation = revealPresentation(stepId, result, state);
  const effectsActive = animate && !reducedMotion;
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const hasFocused = useRef(false);
  useEffect(() => {
    if (!focusOnMount || hasFocused.current) return;
    hasFocused.current = true;
    heading.current?.focus({ preventScroll: true });
    // The reveal occupies the wheel's space; only scroll if it is outside the reading area.
    const bounds = panel.current?.getBoundingClientRect();
    const actions = panel.current?.querySelector('.result-actions')?.getBoundingClientRect();
    if (
      bounds &&
      (bounds.top < 12 ||
        bounds.top > window.innerHeight * 0.55 ||
        (actions && actions.bottom > window.innerHeight - 16))
    ) {
      window.scrollBy({
        top: bounds.top - 24,
        behavior: reducedMotion ? 'instant' : 'smooth',
      });
    }
  }, [focusOnMount, reducedMotion, automaticReason]);
  return (
    <section
      ref={panel}
      className={`result-reveal quick-reveal reveal-${presentation.kind} ${effectsActive ? 'reveal-live' : ''} ${chance && !automaticReason ? `rarity-${chance.rarity}` : ''} ${automaticReason ? 'reveal-automatic' : ''} ${mediaForResult(stepId, result.id) || effectForResult(stepId, result.id) ? 'reveal-with-media' : ''}`}
      aria-labelledby="result-title"
    >
      <header className="quick-result-header">
        <span className="result-attribute">
          {automaticReason ? 'Consequência automática' : 'Resultado'} / {attribute}
        </span>
        <h2 id="result-title" ref={heading} tabIndex={-1}>
          {result.name}
        </h2>
        {chance && !automaticReason && (
          <p
            className="result-chance"
            title="Chance condicional desta roleta, após os filtros. Categoria visual do jogo, sem relação com poder ou grau oficial."
          >
            <span>{rarityLabels[chance.rarity]}</span>{' '}
            {reconstructedChance ? 'Chance no catálogo atual' : 'Chance neste giro'}:{' '}
            <strong>{formatChance(chance.probability)}</strong>
            {reconstructedChance && (
              <small>Recalculada; não é uma probabilidade histórica registrada.</small>
            )}
          </p>
        )}
        {effectsActive && chance && chance.rarity !== 'common' && (
          <div className="rarity-particles" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ left: `${12 + i * 11}%`, animationDelay: `${i * 35}ms` }} />
            ))}
          </div>
        )}
        {result.reference && !['energy', 'proficiency'].includes(result.reference.topic ?? '') && (
          <p className="quick-reference">
            {[
              result.adjustment ? 'Referência sorteada' : undefined,
              result.reference.character ?? (result.adjustment ? result.name : undefined),
              !result.domain ? result.reference.version : undefined,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {result.domain && (
          <span className="manifestation-tag">
            {result.domain.manifestation === 'incomplete'
              ? 'Manifestação incompleta'
              : 'Manifestação completa documentada'}
          </span>
        )}
        {result.reference?.topic === 'proficiency' && (
          <p className="quick-reference">
            Técnica: {getOption('innate-technique', state.results['innate-technique'])?.name}
          </p>
        )}
      </header>
      <ResultMedia
        key={`${stepId}/${result.id}`}
        stepId={stepId}
        resultId={result.id}
        kind={presentation.kind}
        animate={effectsActive}
      />
      <div className="quick-result-copy">
        <p className="quick-description">{presentation.summary}</p>
        {presentation.consequence && (
          <p className="quick-consequence">{presentation.consequence}</p>
        )}
        {automaticReason && !presentation.consequence && (
          <p className="automatic-label">
            Definido pelas condições anteriores, sem consumir um sorteio.
          </p>
        )}
      </div>
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
      <details className="quick-details">
        <summary>
          {result.technique || result.domain ? 'Entender habilidade' : 'Entender resultado'}{' '}
          <span aria-hidden="true">+</span>
        </summary>
        <ResultContent
          attribute={attribute}
          result={result}
          headingId="result-full-title"
          automaticReason={automaticReason}
        />
      </details>
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
