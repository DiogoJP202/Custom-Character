import { useEffect, useRef } from 'react';
import type { WheelOption } from '../data/wheels.ts';

export default function ResultReveal({
  result,
  onContinue,
}: {
  result: WheelOption;
  onContinue: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="result-reveal" aria-label="Resultado revelado">
      <div className="result-copy">
        <span className="eyebrow">Resultado revelado</span>
        <h2 ref={heading} tabIndex={-1}>
          {result.name}
        </h2>
        <p>{result.description}</p>
      </div>
      <button className="button button-primary" onClick={onContinue}>
        Continuar <span aria-hidden="true">✦</span>
      </button>
    </section>
  );
}
