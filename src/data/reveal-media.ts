export interface RevealMedia {
  videoId: string;
  title: string;
  source: string;
  context: string;
}
// Approved for the publisher's player only, not for downloading or rehosting.
// Verification and rejected/pending candidates: docs/media-research.md.
export const revealMedia: Record<string, RevealMedia> = {
  'innate-technique/boogie-woogie': {
    videoId: 'v-CpYSTDbek',
    title: 'Boogie Woogie | JUJUTSU KAISEN',
    source: 'Crunchyroll',
    context: 'Todo · Intercâmbio.',
  },
  'innate-technique/straw-doll': {
    videoId: 'CrOgGawQsOE',
    title: 'Nobara vs Momo | JUJUTSU KAISEN',
    source: 'Crunchyroll',
    context: 'Nobara · Intercâmbio.',
  },
  'domain-expansion/chimera-shadow-garden': {
    videoId: 'WFE9NUWAEec',
    title: 'Chimera Shadow Garden! | JUJUTSU KAISEN',
    source: 'Crunchyroll',
    context: 'Megumi · episódio 23.',
  },
  'domain-expansion/self-embodiment-of-perfection': {
    videoId: 'OrDzu_xveDo',
    title: 'Mahito’s Domain Expansion! | JUJUTSU KAISEN',
    source: 'Crunchyroll',
    context: 'Mahito · episódio 13.',
  },
};
export const mediaForResult = (stepId: string, resultId: string) =>
  revealMedia[`${stepId}/${resultId}`];
export const mediaSourceURL = (media: RevealMedia) =>
  `https://www.youtube.com/watch?v=${media.videoId}`;
export const mediaEmbedURL = (media: RevealMedia) =>
  `https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=0&mute=1&controls=1&playsinline=1&rel=0`;

export type MediaStatus = 'idle' | 'loading' | 'ready' | 'error';
export function mediaStatus(
  status: MediaStatus,
  event: 'open' | 'loaded' | 'failed' | 'close',
): MediaStatus {
  if (event === 'open') return 'loading';
  if (event === 'close') return 'idle';
  if (event === 'loaded') return status === 'loading' ? 'ready' : status;
  return status === 'loading' || status === 'ready' ? 'error' : status;
}
