import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
import { getOption, wheels } from '../data/wheels.ts';
import { techniques } from '../data/techniques.ts';
import {
  mediaForResult,
  mediaEmbedURL,
  mediaSourceURL,
  mediaStatus,
  revealMedia,
} from '../data/reveal-media.ts';
import { gameReducer, initialState, parseSavedGame, type GameState, STORAGE_KEY } from './game.ts';
import { forcedOutcome, playableWheel, resultDetails } from './conditions.ts';
import { pickOption, getSegments, landingRotation } from './wheel.ts';
import { resultChance } from './rarity.ts';
import {
  creationProgress,
  loadSpinPace,
  PREFERENCES_KEY,
  revealPresentation,
  saveSpinPace,
  spinCompletion,
  spinDuration,
} from './gameplay.ts';

function path(changes: Record<string, string> = {}) {
  const choices = {
    nature: 'human',
    lineage: 'zenin',
    'birth-condition': 'none',
    'technique-presence': 'yes',
    'innate-technique': 'ten-shadows',
    'energy-reserve': 'immense',
    'energy-control': 'poor',
    'energy-output': 'low',
    'technique-proficiency': 'beginner',
    recovery: 'heal-others',
    equipment: 'soul-katana',
    'barrier-knowledge': 'untrained',
    'domain-expansion': 'chimera-shadow-garden',
    ...changes,
  };
  const states: GameState[] = [];
  let state = gameReducer(initialState, { type: 'start' });
  for (let i = 0; state.phase !== 'complete'; i++) {
    assert.ok(i < wheels.length);
    states.push(state);
    if (state.phase === 'ready') {
      const wheel = playableWheel(wheels.find((w) => w.id === state.stepId)!, state);
      const choice = choices[wheel.id as keyof typeof choices];
      state = gameReducer(state, {
        type: 'spin',
        optionId: wheel.options.some((o) => o.id === choice) ? choice : wheel.options[0].id,
      });
      states.push(state);
      state = gameReducer(state, { type: 'reveal' });
      states.push(state);
    }
    state = gameReducer(state, { type: 'continue' });
  }
  states.push(state);
  return states;
}
const at = (states: GameState[], id: string) =>
  states.find((s) => s.stepId === id && s.phase === 'revealed')!;
const present = (state: GameState) =>
  revealPresentation(state.stepId, resultDetails(state.stepId, state)!, state);

test('pace changes only duration, preserving weighted choices and landing with exactly one RNG call', () => {
  assert.equal(spinDuration('standard', false), 2200);
  assert.equal(spinDuration('fast', false), 800);
  for (const pace of ['standard', 'fast'] as const) {
    assert.equal(spinDuration(pace, true), 0);
    for (const wheel of wheels)
      for (const segment of getSegments(wheel.options)) {
        let calls = 0;
        const option = pickOption(wheel.options, () => {
          calls++;
          return segment.middle / 360;
        });
        assert.equal(option.id, segment.option.id);
        assert.equal(calls, 1);
        const angle = (landingRotation(segment) + segment.middle) % 360;
        assert.ok(Math.min(angle, 360 - angle) < 1e-8);
      }
  }
});

test('transition, timer, reduced-motion and stale cancelled runs complete at most once', () => {
  let calls = 0;
  const run = spinCompletion(() => calls++);
  run.finish();
  run.finish();
  run.cancel();
  run.finish();
  assert.equal(calls, 1);
  const cancelled = spinCompletion(() => assert.fail('old spin cannot reveal'));
  cancelled.cancel();
  cancelled.finish();
  const next = spinCompletion(() => calls++);
  next.finish();
  next.finish();
  assert.equal(calls, 2);
});

test('visual preference is separately versioned, restores safely and never overwrites game or gallery', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map([
    [STORAGE_KEY, 'active'],
    ['jjk-character-gallery:v1', 'collection'],
  ]);
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    assert.equal(loadSpinPace(), 'standard');
    saveSpinPace('fast');
    assert.equal(loadSpinPace(), 'fast');
    assert.equal(storage.get(STORAGE_KEY), 'active');
    assert.equal(storage.get('jjk-character-gallery:v1'), 'collection');
    for (const raw of [
      'bad',
      'null',
      '{"version":2,"pace":"fast"}',
      '{"version":1,"pace":"other"}',
    ]) {
      storage.set(PREFERENCES_KEY, raw);
      assert.equal(loadSpinPace(), 'standard');
    }
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    assert.equal(loadSpinPace(), 'standard');
    assert.doesNotThrow(() => saveSpinPace('fast'));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('chapter progress never exposes a spinning result or allows skipping stages; old saves follow the same path', () => {
  for (const nature of ['human', 'cursed-spirit', 'simurian', 'independent-cursed-corpse']) {
    const states = path({ nature });
    for (const state of states) {
      const progress = creationProgress(state);
      assert.equal(progress.chapters.length, 8);
      assert.ok(progress.percent >= 0 && progress.percent <= 100);
      if (state.phase === 'spinning') {
        const previous = {
          ...state,
          phase: 'ready' as const,
          results: Object.fromEntries(
            Object.entries(state.results).filter(([id]) => id !== state.stepId),
          ),
        };
        assert.deepEqual(creationProgress(previous), progress);
      }
      const restored = parseSavedGame(JSON.stringify(state));
      assert.deepEqual(restored.results, state.results);
      if (state.phase === 'revealed')
        assert.strictEqual(gameReducer(state, { type: 'reveal' }), state);
    }
    assert.equal(creationProgress(states.at(-1)!).percent, 100);
  }
});

test('presentation reads existing results deterministically without RNG or changing automatic-stage progression', () => {
  const states = [
    ...path(),
    ...path({ 'birth-condition': 'physical-partial' }),
    ...path({ 'birth-condition': 'physical-complete' }),
    ...path({ nature: 'simurian' }),
  ];
  const random = Math.random;
  Math.random = () => assert.fail('Presentation cannot draw');
  try {
    for (const state of states.filter((s) => s.phase === 'revealed')) {
      const original = JSON.stringify(state);
      const result = resultDetails(state.stepId, state)!;
      const first = revealPresentation(state.stepId, result, state);
      assert.ok(first.summary);
      assert.deepEqual(revealPresentation(state.stepId, result, state), first);
      assert.equal(JSON.stringify(state), original);
      const forced = forcedOutcome(wheels.find((w) => w.id === state.stepId)!, state);
      if (forced) assert.equal(state.results[state.stepId], forced.option.id);
      assert.notEqual(gameReducer(state, { type: 'continue' }).phase, 'spinning');
    }
  } finally {
    Math.random = random;
  }
});

test('compact reveals preserve restrictions, resource bottlenecks, possession and domain execution limits', () => {
  const normal = path();
  assert.equal(present(at(normal, 'strength')).kind, 'common');
  assert.equal(present(at(normal, 'innate-technique')).kind, 'special');
  assert.match(present(at(normal, 'innate-technique')).consequence!, /Mahoraga/);
  assert.match(present(at(normal, 'energy-output')).consequence!, /pouca pode ser liberada/);
  const domain = present(at(normal, 'domain-expansion'));
  assert.equal(domain.kind, 'exceptional');
  assert.match(domain.summary, /incompleta.*sem.*acerto garantido/);
  assert.match(domain.consequence!, /não confiável.*controle baixo.*recinto compatível/);
  const full = path({ 'birth-condition': 'physical-complete' });
  assert.match(present(at(full, 'birth-condition')).summary, /sem energia.*própria/);
  assert.match(present(at(full, 'strength')).summary, /referência sorteada fica registrada/);
  const partial = path({ 'birth-condition': 'physical-partial' });
  assert.match(present(at(partial, 'energy-reserve')).consequence!, /fixa.*não houve sorteio/);
  const body = path({ 'birth-condition': 'body-limited' });
  assert.match(present(at(body, 'equipment')).consequence!, /sem empunhadura direta/);
  const katana = present(at(normal, 'equipment'));
  assert.match(katana.summary, /efeito pleno.*bloqueado/);
  assert.match(katana.consequence!, /percepção de almas/);
  const limitless = path({ lineage: 'gojo', 'innate-technique': 'limitless' });
  assert.match(present(at(limitless, 'innate-technique')).consequence!, /Sem Seis Olhos/);
  const lowStock = path({
    'energy-reserve': 'very-low',
    'energy-output': 'high',
  });
  assert.match(present(at(lowStock, 'energy-output')).consequence!, /pouco estoque/);
});

test('media IDs resolve only to their matching catalog result, with no automatic technique/domain conflation', () => {
  for (const [key, media] of Object.entries(revealMedia)) {
    const [step, id] = key.split('/');
    assert.ok(getOption(step, id));
    assert.match(media.videoId, /^[\w-]{11}$/);
    assert.equal(new URL(mediaSourceURL(media)).hostname, 'www.youtube.com');
    const embed = new URL(mediaEmbedURL(media));
    assert.equal(embed.hostname, 'www.youtube-nocookie.com');
    assert.equal(embed.searchParams.get('autoplay'), '0');
    assert.equal(embed.searchParams.get('mute'), '1');
    assert.equal(embed.searchParams.get('controls'), '1');
  }
  assert.equal(mediaForResult('innate-technique', 'ten-shadows'), undefined);
  assert.equal(mediaForResult('innate-technique', 'idle-transfiguration'), undefined);
  assert.equal(mediaForResult('strength', 'boogie-woogie'), undefined);
});

test('a failed or closed media load cannot revive from late load events; retry is visual only', () => {
  const state = path().at(-1)!;
  const before = JSON.stringify(state);
  let status = mediaStatus('idle', 'open');
  status = mediaStatus(status, 'failed');
  assert.equal(status, 'error');
  assert.equal(mediaStatus(status, 'loaded'), 'error');
  status = mediaStatus(status, 'close');
  assert.equal(status, 'idle');
  assert.equal(mediaStatus(status, 'loaded'), 'idle');
  status = mediaStatus(status, 'open');
  status = mediaStatus(status, 'loaded');
  assert.equal(status, 'ready');
  assert.equal(JSON.stringify(state), before);
});

test('actual reveals keep full sourced content behind details, with no third-party iframe before interaction', async () => {
  const require = createRequire(import.meta.url);
  const externals = ['react', 'react/jsx-runtime'];
  const bundle = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('../components/ResultReveal.tsx', import.meta.url)),
        formats: ['es'],
      },
      rolldownOptions: {
        external: externals,
        output: {
          paths: Object.fromEntries(
            externals.map((id) => [id, pathToFileURL(require.resolve(id)).href]),
          ),
        },
      },
    },
  });
  const output = Array.isArray(bundle) ? bundle[0] : bundle;
  assert.ok('output' in output);
  const entry = output.output.find((item) => item.type === 'chunk' && item.isEntry);
  assert.ok(entry && entry.type === 'chunk');
  const { default: ResultReveal } = await import(
    `data:text/javascript;base64,${Buffer.from(entry.code).toString('base64')}`
  );
  for (const state of [
    at(path(), 'strength'),
    at(path(), 'innate-technique'),
    at(path({ 'innate-technique': 'boogie-woogie' }), 'innate-technique'),
    at(path(), 'technique-proficiency'),
    at(path(), 'domain-expansion'),
    at(path({ 'technique-presence': 'no' }), 'technique-presence'),
    at(path({ 'birth-condition': 'physical-partial' }), 'energy-reserve'),
    at(path({ 'birth-condition': 'physical-complete' }), 'strength'),
    ...techniques.map((option) =>
      at(
        path({
          nature: option.technique!.nature,
          lineage: option.technique!.lineage ?? 'no-known-clan',
          'innate-technique': option.id,
        }),
        'innate-technique',
      ),
    ),
    ...['playful-cloud', 'inverted-spear', 'soul-katana'].map((equipment) =>
      at(path({ equipment }), 'equipment'),
    ),
    at(
      path({
        nature: 'cursed-spirit',
        'innate-technique': 'jogo-flames',
        'domain-expansion': 'coffin-of-the-iron-mountain',
      }),
      'domain-expansion',
    ),
    at(
      path({
        nature: 'cursed-spirit',
        'innate-technique': 'idle-transfiguration',
        'domain-expansion': 'self-embodiment-of-perfection',
      }),
      'domain-expansion',
    ),
  ]) {
    const result = resultDetails(state.stepId, state)!;
    const html = renderToStaticMarkup(
      createElement(ResultReveal, {
        stepId: state.stepId,
        state,
        attribute: state.stepId,
        result,
        onContinue() {},
        automaticReason: forcedOutcome(wheels.find((w) => w.id === state.stepId)!, state)?.reason,
      }),
    );
    assert.match(html, /Continuar/);
    assert.doesNotMatch(html, /reveal-live|effect-live|rarity-particles/);
    assert.doesNotMatch(html, /<iframe/);
    const [main, details] = html.split('<details class="quick-details">');
    assert.doesNotMatch(main, /· ·/);
    assert.ok(details);
    assert.doesNotMatch(main, /reference-feats|reference-disclaimer/);
    if (result.reference) assert.match(details, /Feitos e contexto/);
    if (result.reference?.feats[0])
      assert.ok(details.includes(result.reference.feats[0].source.url));
    if (result.domain) assert.match(main, /reveal-exceptional/);
    if (state.stepId === 'technique-proficiency') assert.match(main, /Técnica das Dez Sombras/);
    if (mediaForResult(state.stepId, result.id)) {
      assert.match(main, /reveal-with-media/);
      assert.match(main, /Ver cena oficial/);
    }
    const automatic = forcedOutcome(wheels.find((w) => w.id === state.stepId)!, state)?.reason;
    const chance = resultChance(
      playableWheel(wheels.find((w) => w.id === state.stepId)!, state),
      result.id,
      !!automatic,
    );
    const render = (props: object) =>
      renderToStaticMarkup(
        createElement(ResultReveal, {
          stepId: state.stepId,
          state,
          attribute: state.stepId,
          result,
          onContinue() {},
          chance,
          automaticReason: automatic,
          ...props,
        }),
      );
    const live = render({ animate: true });
    assert.match(live, /reveal-live/);
    if (chance) assert.match(live, /Chance neste giro/);
    else assert.doesNotMatch(live, /rarity-(common|uncommon|rare|epic|legendary)/);
    assert.doesNotMatch(
      render({ animate: true, reducedMotion: true }),
      /reveal-live|effect-live|rarity-particles/,
    );
    if (chance) assert.match(render({ reconstructedChance: true }), /Recalculada.*histórica/);
  }
  assert.ok(techniques.length >= 14);
});
