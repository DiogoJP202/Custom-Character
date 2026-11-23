import { characterProfile } from './character-profile.ts';
import { resultDetails } from './conditions.ts';
import { parseArchivedGame, type GameState } from './game.ts';
import { wheels } from '../data/wheels.ts';

export const EXPORT_WIDTH = 1200;
export const EXPORT_HEIGHT = 2160;

export function characterPngFilename(name?: string): string {
  const slug = (name ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
  return `custom-character-${slug || 'personagem'}.png`;
}

const sentences = (paragraph: string) => paragraph.split(/(?<=[.!?])\s+/u).filter(Boolean);
// Presentation excerpts only: preserve the opening and final qualification, without rewriting rules.
const excerpt = (paragraph: string) => {
  const parts = sentences(paragraph);
  return parts.length > 2 ? `${parts[0]} ${parts.at(-1)}` : paragraph;
};

export function characterExportData(state: GameState, name?: string, scope?: readonly string[]) {
  const boundary = scope?.at(-1) ?? wheels.at(-1)!.id;
  if (state.phase !== 'complete' || !parseArchivedGame(JSON.stringify(state), boundary))
    throw new Error('Conclua uma ficha válida antes de exportar.');
  const profile = characterProfile(state, scope);
  const displayName = name?.replace(/\s+/gu, ' ').trim() || undefined;
  const facts = profile.facts.map((fact) => ({ ...fact }));
  for (const [id, label] of [
    ['innate-technique', 'Técnica inata'],
    ['equipment', 'Equipamento'],
    ['domain-expansion', 'Expansão de Domínio'],
  ]) {
    if (scope && !scope.includes(id)) continue;
    const result = resultDetails(id, state);
    if (state.results[id] && result && result.id !== 'none')
      facts.push({ label, value: result.name });
  }
  return {
    filename: characterPngFilename(displayName),
    name: displayName,
    identity: profile.title,
    summary: profile.summary,
    facts,
    capabilities: profile.capabilities.map((capability) => ({
      id: capability.id,
      title: capability.title,
      paragraphs: capability.paragraphs
        .map((paragraph, index) => {
          if (capability.id === 'energy') return paragraph;
          if (capability.id === 'domain')
            return sentences(paragraph)
              .slice(0, index === 0 && capability.paragraphs.length > 1 ? 1 : 3)
              .join(' ');
          if (capability.id === 'resources') return sentences(paragraph)[0] ?? '';
          return excerpt(paragraph);
        })
        .filter(Boolean),
    })),
    combatStyle: profile.combatStyle.slice(0, 2).map(excerpt),
    strengths: [...profile.strengths],
    limitations: [...profile.limitations],
    catalogNote: profile.catalogNote,
  };
}
export type CharacterExportData = ReturnType<typeof characterExportData>;

async function localFontCSS(signal: AbortSignal): Promise<string> {
  const faces = [
    { family: 'Barlow Condensed', weight: '700', path: '/fonts/barlow-condensed-latin-700.woff2' },
    {
      family: 'IBM Plex Sans',
      weight: '100 700',
      path: '/fonts/ibm-plex-sans-latin-variable.woff2',
    },
  ];
  return (
    await Promise.all(
      faces.map(async (face) => {
        const response = await fetch(face.path, { signal });
        if (!response.ok)
          throw new Error('Não foi possível carregar as fontes da ficha. Tente novamente.');
        const blob = await response.blob();
        if (!blob.size) throw new Error('Uma fonte da ficha não pôde ser carregada.');
        const dataURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Não foi possível preparar as fontes da ficha.'));
          reader.readAsDataURL(blob);
        });
        return `@font-face{font-family:'${face.family}';font-style:normal;font-weight:${face.weight};src:url('${dataURL}') format('woff2');}`;
      }),
    )
  ).join('\n');
}

export async function renderCharacterPng(node: HTMLElement, signal: AbortSignal): Promise<Blob> {
  const cancelled = () => {
    if (signal.aborted) throw new DOMException('Exportação cancelada.', 'AbortError');
  };
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  const work = async () => {
    cancelled();
    if (!document.fonts)
      throw new Error('Este navegador não oferece os recursos necessários para exportar a ficha.');
    const [renderer, fontEmbedCSS, loaded] = await Promise.all([
      import('html-to-image'),
      localFontCSS(signal),
      Promise.all([
        document.fonts.load('700 64px "Barlow Condensed"'),
        document.fonts.load('400 24px "IBM Plex Sans"'),
        document.fonts.load('600 24px "IBM Plex Sans"'),
      ]),
    ]);
    await document.fonts.ready;
    cancelled();
    if (loaded.some((faces) => !faces.length))
      throw new Error('Não foi possível preparar a tipografia da ficha.');
    // Fixed dimensions and density keep the output independent of viewport and device pixel ratio.
    let fits = false;
    for (const density of ['normal', 'compact', 'dense']) {
      node.dataset.density = density;
      const regions = [node, ...node.querySelectorAll<HTMLElement>('[data-export-region]')];
      fits = regions.every(
        (region) =>
          region.scrollHeight <= region.clientHeight + 1 &&
          region.scrollWidth <= region.clientWidth + 1,
      );
      if (fits) break;
    }
    if (!fits)
      throw new Error(
        'O conteúdo não coube na ficha visual com tamanho legível. A exportação foi interrompida para não cortar informações.',
      );
    const blob = await renderer.toBlob(node, {
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: 1,
      fontEmbedCSS,
      backgroundColor: '#111316',
    });
    cancelled();
    if (!blob || !blob.size || blob.type !== 'image/png')
      throw new Error('O navegador não conseguiu gerar o PNG. Tente novamente.');
    return blob;
  };
  try {
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('A geração demorou mais que o esperado. Tente novamente.')),
          20000,
        );
        abort = () => reject(new DOMException('Exportação cancelada.', 'AbortError'));
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
    if (abort) signal.removeEventListener('abort', abort);
  }
}
