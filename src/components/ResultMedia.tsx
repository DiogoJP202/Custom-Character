import { useEffect, useReducer } from 'react';
import {
  mediaEmbedURL,
  mediaForResult,
  mediaSourceURL,
  mediaStatus,
} from '../data/reveal-media.ts';
import type { RevealKind } from '../lib/gameplay.ts';
import { effectForResult } from '../data/reveal-effects.ts';
import RevealEffect from './RevealEffect.tsx';

export default function ResultMedia({
  stepId,
  resultId,
  kind,
  animate = false,
}: {
  stepId: string;
  resultId: string;
  kind: RevealKind;
  animate?: boolean;
}) {
  const media = mediaForResult(stepId, resultId);
  const visual = effectForResult(stepId, resultId);
  const [status, mediaEvent] = useReducer(mediaStatus, 'idle');
  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(() => mediaEvent('failed'), 12000);
    return () => window.clearTimeout(timeout);
  }, [status]);
  if (!media && visual)
    return (
      <figure className="result-media result-visual">
        <RevealEffect visual={visual} animate={animate} />
        <figcaption>
          Ilustração original ·{' '}
          {stepId === 'equipment' ? 'Posse não concede perícia.' : 'Representação abstrata.'}
        </figcaption>
      </figure>
    );
  if (!media)
    return kind === 'common' ? null : (
      <div className={`reveal-imprint imprint-${kind}`} aria-hidden="true">
        <i />
        <i />
        <span>
          {stepId === 'equipment'
            ? 'EQUIPAMENTO'
            : stepId === 'birth-condition'
              ? 'CONDIÇÃO DE NASCIMENTO'
              : kind === 'exceptional'
                ? 'EXPANSÃO DE DOMÍNIO'
                : 'JUJUTSU'}
        </span>
      </div>
    );
  return (
    <figure className="result-media">
      <div className="media-frame" aria-busy={status === 'loading'}>
        {status === 'loading' || status === 'ready' ? (
          <iframe
            src={mediaEmbedURL(media)}
            title={`${media.title} — ${media.source}`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => mediaEvent('loaded')}
            onError={() => mediaEvent('failed')}
          />
        ) : status === 'error' ? (
          <p className="media-error" role="alert">
            Não foi possível carregar o player. Você pode continuar ou abrir a fonte.
          </p>
        ) : (
          <>
            {visual && <RevealEffect visual={visual} animate={animate} />}
            <button
              className={`media-load ${visual ? 'media-load-overlay' : ''}`}
              onClick={() => mediaEvent('open')}
            >
              <span className="media-play" aria-hidden="true">
                ▶
              </span>
              <span>
                Ver cena oficial <small>{media.source} / YouTube · carregar player</small>
              </span>
            </button>
          </>
        )}
      </div>
      <figcaption>
        <span>{media.context}</span>
        <div className="media-links">
          <a href={mediaSourceURL(media)} target="_blank" rel="noopener noreferrer">
            Abrir no YouTube ↗
          </a>
          {status !== 'idle' && (
            <button onClick={() => mediaEvent('close')}>
              {status === 'error' ? 'Fechar aviso' : 'Fechar vídeo'}
            </button>
          )}
        </div>
      </figcaption>
      {status === 'loading' && (
        <p className="media-status" role="status">
          Carregando player…
        </p>
      )}
    </figure>
  );
}
