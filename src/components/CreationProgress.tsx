import { creationProgress } from '../lib/gameplay.ts';
import type { GameState } from '../lib/game.ts';

export default function CreationProgress({ state }: { state: GameState }) {
  const progress = creationProgress(state);
  return (
    <section className="creation-progress" aria-label="Progresso da criação">
      <div className="progress-caption">
        <span>{progress.completed} / 8 capítulos concluídos</span>
        <span>{progress.percent}%</span>
      </div>
      <progress max={100} value={progress.percent} aria-label="Progresso geral" />
      <ol className="chapter-track">
        {progress.chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            data-status={chapter.status}
            aria-current={chapter.status === 'current' ? 'step' : undefined}
            title={`${chapter.name} · ${chapter.status === 'complete' ? 'Concluído' : chapter.status === 'current' ? 'Atual' : 'Pendente'}`}
          >
            <span aria-hidden="true">
              {chapter.status === 'complete' ? '✓' : String(index + 1).padStart(2, '0')}
            </span>
            <span className="chapter-track-name">{chapter.hubLabel}</span>
            <span className="sr-only">
              {chapter.name} —{' '}
              {chapter.status === 'complete'
                ? 'Concluído'
                : chapter.status === 'current'
                  ? 'Atual'
                  : 'Pendente'}
            </span>
          </li>
        ))}
      </ol>
      {progress.latest?.name && (
        <p className="latest-result">
          <span>Mais recente / {progress.latest.attribute}</span> {progress.latest.name}
        </p>
      )}
    </section>
  );
}
