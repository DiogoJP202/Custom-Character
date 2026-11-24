import { useEffect, useRef, useState } from 'react';
import { chapters, type WheelDefinition } from '../data/wheels.ts';
import { getSegments, landingRotation, SMALL_SEGMENT_THRESHOLD } from '../lib/wheel.ts';
import { spinCompletion, spinDuration, type SpinPace } from '../lib/gameplay.ts';

function point(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 200 + radius * Math.cos(radians),
    y: 200 + radius * Math.sin(radians),
  };
}

export default function Wheel({
  definition,
  spinning,
  resultId,
  reducedMotion,
  pace = 'standard',
  onComplete,
}: {
  definition: WheelDefinition;
  spinning: boolean;
  resultId?: string;
  reducedMotion: boolean;
  pace?: SpinPace;
  onComplete: () => void;
}) {
  const segments = getSegments(definition.options);
  const chapterIndex = chapters.findIndex(({ id }) => id === definition.chapterId);
  const chapter = chapters[chapterIndex];
  const selected = segments.find(({ option }) => option.id === resultId);
  const targetRotation = selected ? landingRotation(selected) : 0;
  const [rotation, setRotation] = useState(() =>
    !spinning && selected ? landingRotation(selected, 0, 0) : 0,
  );
  const completion = useRef<ReturnType<typeof spinCompletion> | null>(null);
  const duration = spinDuration(pace, reducedMotion);

  useEffect(() => {
    if (!spinning || !resultId) return;
    const run = spinCompletion(onComplete);
    completion.current = run;
    const frame = requestAnimationFrame(() => {
      setRotation(targetRotation);
      if (duration === 0) run.finish();
    });
    // Complete even if transition events are suppressed or the tab is hidden.
    const timer = window.setTimeout(run.finish, duration + 80);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      run.cancel();
      if (completion.current === run) completion.current = null;
    };
  }, [spinning, resultId, targetRotation, duration, onComplete]);

  return (
    <div className={`wheel-stage ${spinning ? 'is-spinning' : ''}`}>
      <svg className="wheel-calibration" viewBox="-24 -24 448 448" fill="none" aria-hidden="true">
        <circle cx="200" cy="200" r="214" />
        {Array.from({ length: 72 }, (_, index) => {
          const from = point(index * 5, index % 6 === 0 ? 204 : 210),
            to = point(index * 5, 218);
          return (
            <line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={index % 6 === 0 ? 'major-tick' : undefined}
            />
          );
        })}
      </svg>
      <div className="wheel-pointer" aria-hidden="true" />
      <div className="wheel-rim">
        <div
          className="wheel-disc"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: `${duration}ms`,
          }}
          onTransitionEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.propertyName === 'transform' &&
              spinning
            )
              completion.current?.finish();
          }}
        >
          <svg
            viewBox="0 0 400 400"
            role="img"
            aria-label={`Roleta de ${definition.name}. Resultados e probabilidades disponíveis abaixo.`}
          >
            {segments.map(({ option, start, end, middle, probability }, index) => {
              const small = probability < SMALL_SEGMENT_THRESHOLD;
              const from = point(start, 195),
                to = point(end, 195),
                label = point(middle, small ? 155 : 135);
              return (
                <g key={option.id}>
                  <title>
                    {option.name} ·{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'percent',
                      maximumFractionDigits: 2,
                    }).format(probability)}
                  </title>
                  {end - start >= 359.999 ? (
                    <circle cx="200" cy="200" r="195" fill={option.color} />
                  ) : (
                    <path
                      d={`M200,200 L${from.x},${from.y} A195,195 0 ${end - start > 180 ? 1 : 0},1 ${to.x},${to.y} Z`}
                      fill={option.color}
                      stroke="#111316"
                      strokeWidth="2"
                    />
                  )}
                  {small && <circle className="segment-marker" cx={label.x} cy={label.y} r="11" />}
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${small ? middle : middle > 180 ? middle - 270 : middle - 90}, ${label.x}, ${label.y})`}
                    className={`segment-label ${small ? 'segment-label-index' : ''}`}
                  >
                    {small ? index + 1 : option.shortLabel}
                  </text>
                </g>
              );
            })}
            <circle cx="200" cy="200" r="183" fill="none" stroke="#E8E3D9" strokeOpacity=".15" />
            <circle cx="200" cy="200" r="194" fill="none" stroke="#111316" strokeWidth="2" />
          </svg>
        </div>
        <div className="wheel-hub" aria-hidden="true">
          <span className="hub-number">{String(chapterIndex + 1).padStart(2, '0')}</span>
          <span className="hub-name">{chapter.hubLabel}</span>
        </div>
      </div>
    </div>
  );
}
