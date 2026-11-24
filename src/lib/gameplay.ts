import { chapters, getOption, wheels, type WheelOption } from '../data/wheels.ts';
import { revealCopy } from '../data/reveal-copy.ts';
import { birthCondition, isStageAvailable, resultDetails, type RuleContext } from './conditions.ts';
import { domainExecutionLimits } from './domains.ts';
import { recoveryExecution } from './advanced.ts';
import type { GameState } from './game.ts';

export type SpinPace = 'standard' | 'fast';
export const PREFERENCES_KEY = 'jjk-spinner-preferences:v1';
export const spinDuration = (pace: SpinPace, reducedMotion: boolean) =>
  reducedMotion ? 0 : pace === 'fast' ? 800 : 2200;

export function loadSpinPace(): SpinPace {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null');
    return value?.version === 1 && value.pace === 'fast' ? 'fast' : 'standard';
  } catch {
    return 'standard';
  }
}
export function saveSpinPace(pace: SpinPace) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ version: 1, pace }));
  } catch {
    /* Visual preference remains usable in memory. */
  }
}

// Transition and timeout compete for the same completion; cleanup also invalidates it.
export function spinCompletion(onComplete: () => void) {
  let active = true;
  return {
    finish() {
      if (active) {
        active = false;
        onComplete();
      }
    },
    cancel() {
      active = false;
    },
  };
}

export function creationProgress(state: GameState) {
  const current = wheels.find((wheel) => wheel.id === state.stepId)!;
  const index = chapters.findIndex((chapter) => chapter.id === current.chapterId);
  const results = Object.fromEntries(
    Object.entries(state.results).filter(
      ([id]) => state.phase !== 'spinning' || id !== state.stepId,
    ),
  );
  const stages = wheels.filter(
    (wheel) =>
      wheel.chapterId === current.chapterId && isStageAvailable(wheel, { ...state, results }),
  );
  const fraction = stages.length
    ? stages.filter((wheel) => results[wheel.id]).length / stages.length
    : 0;
  const complete = state.phase === 'complete';
  const latest = [...wheels].reverse().find((wheel) => results[wheel.id]);
  return {
    chapters: chapters.map((chapter, i) => ({
      ...chapter,
      status:
        complete || i < index
          ? ('complete' as const)
          : i === index
            ? ('current' as const)
            : ('pending' as const),
    })),
    completed: complete ? chapters.length : index,
    percent: complete ? 100 : Math.floor(((index + fraction) / chapters.length) * 100),
    latest: latest
      ? {
          attribute: latest.name,
          name: resultDetails(latest.id, { ...state, results })?.name,
        }
      : undefined,
  };
}

export type RevealKind = 'common' | 'special' | 'exceptional';
export function revealPresentation(stepId: string, result: WheelOption, state: RuleContext) {
  const r = state.results;
  const condition = birthCondition(state);
  const base = getOption(stepId, result.id);
  const kind: RevealKind = result.domain
    ? 'exceptional'
    : result.technique ||
        (stepId === 'birth-condition' && result.id !== 'none') ||
        (stepId === 'equipment' &&
          ['playful-cloud', 'inverted-spear', 'soul-katana'].includes(result.id)) ||
        (stepId === 'anti-domain' && result.id !== 'none' && !!base) ||
        (stepId === 'recovery' &&
          [
            'self-limited',
            'self-advanced',
            'heal-others',
            'spirit-limited',
            'spirit-developed',
          ].includes(result.id))
      ? 'special'
      : 'common';
  let summary = revealCopy[stepId]?.[result.id] ?? base?.description ?? result.description;
  let consequence: string | undefined;
  if (stepId === 'lineage' && result.id !== 'no-known-clan')
    consequence = 'O vínculo familiar permite concorrer, mas não garante uma técnica hereditária.';
  if (result.adjustment) {
    summary =
      result.adjustment.capacity === 'extraordinary'
        ? 'A Restrição Celestial completa determina o físico extraordinário; a referência sorteada fica registrada para comparação.'
        : result.adjustment.capacity === 'enhanced'
          ? 'A restrição parcial determina o físico ampliado, sem elevar este corpo ao patamar de Toji.'
          : 'O corpo debilitado não executa os feitos da referência sorteada; a comparação permanece registrada.';
    consequence = result.adjustment.label;
  }
  if (stepId === 'birth-condition') {
    consequence =
      result.id === 'physical-complete'
        ? 'Recursos dependentes de energia própria ficam indisponíveis.'
        : result.id === 'physical-partial'
          ? 'Reserva e output efetivos permanecem muito baixos.'
          : result.id === 'body-limited'
            ? 'A vantagem energética não repara o corpo nem aumenta automaticamente a reserva.'
            : undefined;
  }
  if (stepId === 'energy-reserve') {
    if (r.nature === 'simurian')
      consequence = 'Rolloluca na escala equivalente do jogo; não pressupõe fisiologia humana.';
    else if (r.nature === 'independent-cursed-corpse')
      consequence = 'Reserva do corpo artificial; não concede núcleos extras.';
    else if (r.nature === 'cursed-spirit')
      consequence = 'Energia de um espírito; não determina regeneração ou grau.';
    if (condition === 'physical-partial')
      consequence = 'A restrição parcial fixa esta reserva; não houve sorteio.';
  }
  if (['energy-control', 'energy-output'].includes(stepId)) {
    consequence =
      condition === 'physical-partial'
        ? 'Precisão potencial sobre energia residual; estoque e liberação efetiva continuam muito limitados.'
        : condition === 'body-limited'
          ? 'Alcance e output favorecidos não reparam a debilidade corporal.'
          : ['high', 'exceptional', 'immense'].includes(r['energy-reserve']) &&
              ['very-low', 'low'].includes(r['energy-output'])
            ? 'Muita energia disponível, mas pouca pode ser liberada de uma vez.'
            : ['very-low', 'common'].includes(r['energy-reserve']) &&
                ['high', 'extraordinary'].includes(r['energy-output'])
              ? 'Descargas intensas dispõem de pouco estoque para sustentar aplicações repetidas.'
              : stepId === 'energy-control' &&
                  result.id === 'exceptional' &&
                  r['energy-reserve'] === 'very-low'
                ? 'Boa precisão; o estoque continua muito limitado.'
                : undefined;
  }
  if (result.technique || stepId === 'technique-proficiency') {
    const id = result.technique ? result.id : r['innate-technique'];
    consequence =
      id === 'limitless'
        ? 'Sem Seis Olhos; nenhum nível garante o uso pleno do Ilimitado.'
        : id === 'ten-shadows'
          ? 'Sem todos os shikigamis domesticados ou Mahoraga.'
          : id === 'boogie-woogie'
            ? 'Exige alvos e ativação válidos; não recebe a experiência tática de Todo.'
            : id === 'blood-manipulation'
              ? 'Aplicações dependem de sangue disponível e não eliminam limites fisiológicos.'
              : 'Receber a técnica não concede automaticamente suas aplicações complexas.';
    if (condition === 'physical-partial' || r['energy-reserve'] === 'very-low')
      consequence += ' O estoque extremamente limitado restringe o uso.';
    if (condition === 'body-limited') consequence += ' A debilidade corporal permanece.';
  }
  if (stepId === 'recovery' && kind === 'special') {
    const execution = recoveryExecution(state);
    consequence =
      execution === 'unreliable'
        ? 'Controle precário: execução ainda não confiável.'
        : execution === 'limited'
          ? 'Os recursos atuais limitam o uso a tentativas pontuais de reparos.'
          : 'Lesão, energia e controle limitam o tratamento; não há recuperação ilimitada.';
    if (condition === 'body-limited') consequence += ' Não remove a debilidade de nascimento.';
  }
  if (stepId === 'anti-domain' && result.id !== 'none' && base) {
    consequence =
      condition === 'body-limited'
        ? 'Aprendizado registrado; a debilidade pode impedir posturas e selos.'
        : result.id === 'simple-domain'
          ? 'Nesta configuração inicial, deslocar-se encerra a defesa.'
          : result.id === 'hollow-wicker-basket'
            ? 'Sustentar o selo ocupa as mãos.'
            : 'Não impede automaticamente ataques físicos diretos.';
    if (
      ['poor', 'basic'].includes(r['energy-control']) ||
      r['energy-reserve'] === 'very-low' ||
      ['very-low', 'low'].includes(r['energy-output'])
    )
      consequence += ' Energia ou precisão limitam a sustentação.';
  }
  if (stepId === 'equipment' && result.id !== 'none') {
    consequence =
      condition === 'body-limited'
        ? 'Em sua posse, mas sem empunhadura direta viável; nenhuma marionete é concedida.'
        : result.id === 'soul-katana'
          ? 'A percepção de almas exigida para o efeito pleno não foi atribuída.'
          : result.id === 'inverted-spear'
            ? 'Exige contato da lâmina; não anula automaticamente um domínio inteiro.'
            : 'A posse não concede treinamento com a arma.';
    if (r.nature !== 'human') consequence += ' Anatomia e pegada precisam ser compatíveis.';
  }
  if (stepId === 'barrier-knowledge')
    consequence =
      'Conhecimento de barreiras não concede defesa especializada ou expansão automaticamente.';
  if (result.domain) {
    const limits = domainExecutionLimits(state);
    consequence = limits.length
      ? `Ativação ainda não confiável: ${limits[0]}.`
      : 'Pode tentar a manifestação, sujeita a energia, sustentação e condições da técnica.';
    if (result.domain.manifestation === 'incomplete')
      consequence += ' Exige recinto compatível; não concede Mahoraga.';
    if (condition === 'body-limited') consequence += ' A debilidade corporal permanece.';
  }
  return { kind, summary, consequence };
}
