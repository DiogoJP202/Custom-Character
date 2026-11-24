import { useEffect, useReducer } from 'react';
import {
  mediaEmbedURL,
  mediaForResult,
  mediaSourceURL,
  mediaStatus,
} from '../data/reveal-media.ts';
import type { RevealKind } from '../lib/gameplay.ts';

export default function ResultMedia({
  stepId,
  resultId,
  kind,
}: {
  stepId: string;
  resultId: string;
  kind: RevealKind;
}) {
  const media = mediaForResult(stepId, resultId);
  const [status, mediaEvent] = useReducer(mediaStatus, 'idle');
  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(() => mediaEvent('failed'), 12000);
    return () => window.clearTimeout(timeout);
  }, [status]);
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
          <button className="media-load" onClick={() => mediaEvent('open')}>
            <span className="media-play" aria-hidden="true">
              ▶
            </span>
            <span>
              Ver cena oficial <small>{media.source} / YouTube · carregar player</small>
            </span>
          </button>
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
