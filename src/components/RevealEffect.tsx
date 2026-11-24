import type { CSSProperties } from 'react';
import type { RevealVisual } from '../data/reveal-effects.ts';

// Original diagrams and silhouettes, drawn here rather than copied from anime frames.
// All motion runs once, finishes in under 2.5 s and has a readable static composition.
export default function RevealEffect({
  visual,
  animate = false,
}: {
  visual: RevealVisual;
  animate?: boolean;
}) {
  const m = visual.motif;
  return (
    <div
      className={`effect-stage motif-${m} ${visual.domain ? 'effect-domain' : ''} ${animate ? 'effect-live' : ''}`}
    >
      <svg viewBox="0 0 440 224" fill="none" aria-hidden="true">
        <path className="effect-grid" d="M20 40H420M20 184H420M60 20V204M380 20V204" />
        <g className="effect-drawing">
          {m === 'swap' && (
            <>
              <path
                className="effect-track"
                d="M112 105C164 30 276 30 328 105M328 119C276 194 164 194 112 119"
              />
              <g className="swap-a">
                <path className="effect-solid" d="M92 92H132V132H92Z" />
                <path d="M102 112H122M112 102V122" />
              </g>
              <g className="swap-b">
                <circle className="effect-accent-fill" cx="328" cy="112" r="23" />
                <circle cx="328" cy="112" r="11" />
              </g>
              <path className="effect-accent" d="M226 47H247L238 38M214 177H193L202 186" />
            </>
          )}
          {m === 'shadows' && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  className="shadow-layer"
                  style={{ '--i': i } as CSSProperties}
                  d={`M${35 + i * 12} ${166 - i * 14} Q${100 + i * 20} ${26 + i * 13} 220 ${104 - i * 6} T${405 - i * 12} ${164 - i * 9} Q285 ${201 - i * 10} ${35 + i * 12} ${166 - i * 14}Z`}
                />
              ))}
              <ellipse className="effect-accent" cx="220" cy="158" rx="117" ry="14" />
              {visual.domain && <path className="effect-track" d="M70 90V45H158M282 45H370V90" />}
            </>
          )}
          {m === 'blood' && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <path
                    className="blood-line"
                    style={{ '--i': i } as CSSProperties}
                    d={`M35 ${65 + i * 30}C150 ${5 + i * 60} 280 ${210 - i * 40} 405 ${65 + i * 28}`}
                  />
                  <circle className="blood-dot" cx={120 + i * 60} cy={70 + i * 25} r={4 + i} />
                </g>
              ))}
            </>
          )}
          {m === 'limit' && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse
                  key={i}
                  className="limit-ring"
                  cx="275"
                  cy="112"
                  rx={10 + i * 17}
                  ry={57 + i * 9}
                  opacity={1 - i * 0.16}
                />
              ))}
              <path className="effect-track" d="M38 112H240" />
              <path className="limit-approach effect-accent-fill" d="M60 101L80 112L60 123Z" />
              <path d="M275 24V200" />
            </>
          )}
          {m === 'voice' && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  className="voice-wave"
                  style={{ '--i': i } as CSSProperties}
                  d={`M${165 + i * 40} ${85 - i * 17}Q${195 + i * 44} 112 ${165 + i * 40} ${139 + i * 17}`}
                />
              ))}
              <path className="effect-accent" d="M70 100L95 112L70 124M93 78L119 112L93 146" />
            </>
          )}
          {m === 'ratio' && (
            <>
              <path className="ratio-line" d="M60 112H380" strokeWidth="6" />
              {Array.from({ length: 11 }, (_, i) => (
                <path key={i} d={`M${60 + i * 32} 101V123`} />
              ))}
              <path
                className="ratio-mark effect-accent"
                d="M284 67V157M274 77L284 67L294 77M274 147L284 157L294 147"
                strokeWidth="3"
              />
              <text x="160" y="163">
                7
              </text>
              <text x="325" y="163">
                3
              </text>
            </>
          )}
          {m === 'straw' && (
            <>
              <g className="straw-figure">
                <circle cx="220" cy="63" r="15" />
                <path d="M220 78V137M179 94H261M220 137L192 172M220 137L248 172" strokeWidth="12" />
              </g>
              <path className="effect-track" d="M95 68L203 100M340 62L237 128M105 164L203 128" />
              {[
                [95, 68],
                [340, 62],
                [105, 164],
              ].map(([x, y], i) => (
                <g
                  key={i}
                  className="straw-nail"
                  style={{ '--i': i } as CSSProperties}
                  transform={`translate(${x} ${y}) rotate(-25)`}
                >
                  <path className="effect-accent" d="M-10 -12H10M0 -12V14" strokeWidth="4" />
                </g>
              ))}
            </>
          )}
          {m === 'heat' && (
            <>
              <path
                className="volcanic-base"
                d="M25 187L100 126L142 151L212 65L270 136L320 111L415 187Z"
              />
              <path
                className="effect-accent"
                d="M100 182L169 154L212 85L240 155L295 179"
                strokeWidth="3"
              />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <path
                  key={i}
                  className="heat-ember"
                  style={{ '--i': i } as CSSProperties}
                  d={`M${90 + i * 43} ${92 + (i % 3) * 23}l3 -12`}
                  strokeWidth="3"
                />
              ))}
            </>
          )}
          {m === 'morph' && (
            <>
              <path
                className="morph-shape"
                d="M141 75Q166 29 218 54T306 93Q340 130 295 163T212 171Q153 198 133 146T141 75Z"
              />
              <path
                className="morph-inner effect-accent"
                d="M170 82Q213 51 254 86T280 139Q241 177 194 142T170 82Z"
              />
              {visual.domain && (
                <>
                  <path className="effect-track" d="M64 28L376 196M376 28L64 196" />
                  <ellipse cx="220" cy="112" rx="170" ry="88" />
                </>
              )}
            </>
          )}
          {m === 'growth' && (
            <>
              {[0, 1, 2].map((i) => (
                <g key={i} className="plant-growth" style={{ '--i': i } as CSSProperties}>
                  <path
                    d={`M220 190Q${135 + i * 70} 125 ${100 + i * 120} ${42 + i * 15}`}
                    strokeWidth="3"
                  />
                  <path
                    className="plant-leaf"
                    d={`M${125 + i * 70} 115q-44 -48 -63 -22q5 31 63 22Z`}
                  />
                  <path
                    className="plant-leaf"
                    d={`M${151 + i * 70} 85q25 -45 54 -28q-5 29 -54 28Z`}
                  />
                </g>
              ))}
            </>
          )}
          {['threads', 'forge', 'orbs', 'frames'].includes(m) && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <g key={i} className="diagram-part" style={{ '--i': i } as CSSProperties}>
                  {m === 'threads' ? (
                    <>
                      <path d={`M${100 + i * 80} 32L${130 + i * 50} 145`} />
                      <circle className="effect-solid" cx={130 + i * 50} cy="145" r="12" />
                    </>
                  ) : m === 'orbs' ? (
                    <circle
                      className="effect-solid"
                      cx={105 + i * 77}
                      cy={112 + (i % 2 ? 15 : -15)}
                      r={16 + i * 5}
                    />
                  ) : (
                    <rect
                      x={100 + i * 45}
                      y={50 + i * 14}
                      width="80"
                      height="80"
                      className={i === 3 ? 'effect-accent' : ''}
                    />
                  )}
                </g>
              ))}
            </>
          )}
          {m === 'cloud-tool' && (
            <g className="tool-illustration" transform="rotate(-13 220 112)">
              <path className="tool-chain" d="M145 92Q156 98 167 113M282 119Q294 116 307 101" />
              <g className="cloud-section">
                <path d="M53 56L145 92" />
                <path className="tool-red" d="M60 59L138 89" />
                <path className="tool-caps" d="M52 53L49 61M146 87L142 97" />
              </g>
              <g className="cloud-section">
                <path d="M167 113L282 119" />
                <path className="tool-red" d="M175 113L274 119" />
                <path className="tool-caps" d="M168 107V119M282 113V125" />
              </g>
              <g className="cloud-section">
                <path d="M307 101L391 69" />
                <path className="tool-red" d="M315 98L384 72" />
                <path className="tool-caps" d="M305 96L309 107M388 65L393 75" />
              </g>
            </g>
          )}
          {m === 'spear-tool' && (
            <g className="tool-illustration" transform="rotate(-17 220 112)">
              <path className="tool-handle" d="M92 112H180" />
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} d={`M${98 + i * 9} 103l-5 18`} className="tool-wrap" />
              ))}
              <path
                className="tool-blade"
                d="M190 98H219V78L234 84V98H245V72L261 77V98L347 93L359 100L341 125H190Z"
              />
              <path d="M186 91V134" className="tool-caps" />
              <circle cx="84" cy="112" r="7" />
              <path d="M238 113H332" className="blade-edge" />
            </g>
          )}
          {(m === 'katana-tool' || m === 'equipment') && (
            <g className="tool-illustration" transform="rotate(-13 220 112)">
              <path className="tool-handle" d="M61 106H145" />
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} d={`M${65 + i * 10} 98l8 16`} className="tool-wrap" />
              ))}
              {m === 'katana-tool' && (
                <path
                  className="katana-guard"
                  d="M143 94L131 80L150 84L155 67L162 88L177 78L174 98L191 94L178 111L185 130L167 122L156 140L151 121L135 129L141 112Z"
                />
              )}
              <path className="tool-blade" d="M173 103L382 96Q365 137 173 128Z" />
              <path className="blade-edge" d="M182 122Q318 123 370 104" />
            </g>
          )}
        </g>
      </svg>
      <span className="effect-caption">{visual.caption}</span>
    </div>
  );
}
