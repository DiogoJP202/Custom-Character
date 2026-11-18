import { useEffect, useRef, useState } from 'react';
import type { WheelDefinition } from '../data/wheels.ts';
import { getSegments, landingRotation } from '../lib/wheel.ts';

export function Sigil({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="25" />
      <circle cx="32" cy="32" r="15" />
      <path d="M32 1v62M1 32h62M10 10l44 44M10 54l44-44" />
      <path d="m32 19 13 13-13 13-13-13Z" />
    </svg>
  );
}

function point(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 200 + radius * Math.cos(radians), y: 200 + radius * Math.sin(radians) };
}

export default function Wheel({
  definition,
  spinning,
  resultId,
  reducedMotion,
  onComplete,
}: {
  definition: WheelDefinition;
  spinning: boolean;
  resultId?: string;
  reducedMotion: boolean;
  onComplete: () => void;
}) {
  const segments = getSegments(definition.options);
  const selected = segments.find(({ option }) => option.id === resultId);
  const targetRotation = selected ? landingRotation(selected) : 0;
  const [rotation, setRotation] = useState(() =>
    !spinning && selected ? landingRotation(selected, 0, 0) : 0,
  );
  const started = useRef(false);
  const duration = reducedMotion ? 100 : 4400;

  useEffect(() => {
    if (!spinning || !resultId || started.current) return;
    started.current = true;
    const frame = requestAnimationFrame(() => setRotation(targetRotation));
    // Timer also completes the reveal when transition events are suppressed or the tab is hidden.
    const timer = window.setTimeout(onComplete, duration + 100);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      started.current = false;
    };
  }, [spinning, resultId, targetRotation, duration, onComplete]);

  return (
    <div className={`wheel-stage ${spinning ? 'is-spinning' : ''}`}>
      <div className="orbit orbit-outer" aria-hidden="true" />
      <div className="orbit orbit-inner" aria-hidden="true" />
      <div className="wheel-north" aria-hidden="true">
        ✦
      </div>
      <div className="wheel-pointer" aria-hidden="true" />
      <div className="wheel-rim">
        <div
          className="wheel-disc"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}
          onTransitionEnd={(event) => {
            if (event.propertyName === 'transform' && spinning) onComplete();
          }}
        >
          <svg
            viewBox="0 0 400 400"
            role="img"
            aria-label={`Roleta de ${definition.name}. Probabilidades na legenda abaixo.`}
          >
            {segments.map(({ option, start, end, middle, probability }) => {
              const from = point(start, 195),
                to = point(end, 195),
                label = point(middle, 135);
              return (
                <g key={option.id}>
                  {end - start >= 359.999 ? (
                    <circle cx="200" cy="200" r="195" fill={option.color} />
                  ) : (
                    <path
                      d={`M200,200 L${from.x},${from.y} A195,195 0 ${end - start > 180 ? 1 : 0},1 ${to.x},${to.y} Z`}
                      fill={option.color}
                      stroke="#17171c"
                      strokeWidth="1.5"
                    />
                  )}
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${middle > 180 ? middle - 270 : middle - 90}, ${label.x}, ${label.y})`}
                    className={`segment-label ${probability < 0.05 ? 'segment-label-rare' : ''}`}
                  >
                    {option.shortLabel}
                  </text>
                </g>
              );
            })}
            <circle
              cx="200"
              cy="200"
              r="181"
              fill="none"
              stroke="#ffffff"
              strokeOpacity=".15"
              strokeWidth=".8"
            />
            <circle cx="200" cy="200" r="193" fill="none" stroke="#ffffff" strokeOpacity=".12" />
          </svg>
        </div>
        <div className="wheel-hub">
          <Sigil />
          <span>ORIGEM</span>
        </div>
      </div>
      <span className="wheel-coordinate coordinate-left" aria-hidden="true">
        起
      </span>
      <span className="wheel-coordinate coordinate-right" aria-hidden="true">
        源
      </span>
    </div>
  );
}
