import { getOption } from '../data/wheels.ts';
import { advancedSummary, recoveryExecution } from './advanced.ts';
import { domainExecutionLimits } from './domains.ts';
import {
  birthCondition,
  energySummary,
  physicalAdjustment,
  resultDetails,
  type RuleContext,
} from './conditions.ts';

interface ProfileCapability {
  id: string;
  title: string;
  paragraphs: string[];
  steps: string[];
}

// Only a display excerpt of the existing practical description. Rules always use IDs.
const firstSentence = (text: string) => text.split(/(?<=\.)\s/)[0];

/** Read-only interpretation of recorded results. No new stats, eligibility or random draws. */
export function characterProfile(state: RuleContext) {
  const r = state.results;
  const option = (id: string) => resultDetails(id, state);
  const name = (id: string) => option(id)?.name ?? 'Não registrado';
  const condition = birthCondition(state);
  const full = condition === 'physical-complete';
  const partial = condition === 'physical-partial';
  const limitedBody = condition === 'body-limited';
  const human = r.nature === 'human';
  const spirit = r.nature === 'cursed-spirit';
  const energyModeled = human || spirit;
  const reserveHigh = ['high', 'exceptional', 'immense'].includes(r['energy-reserve']);
  const reserveLow = r['energy-reserve'] === 'very-low';
  const outputLow = ['very-low', 'low'].includes(r['energy-output']);
  const controlPoor = r['energy-control'] === 'poor';
  const controlRefined = ['advanced', 'exceptional'].includes(r['energy-control']);
  const proficiencyInitial = ['beginner', 'basic'].includes(r['technique-proficiency']);
  const technique = r['technique-presence'] === 'yes' ? option('innate-technique') : undefined;
  const tool = getOption('equipment', r.equipment);
  const hasTool = !!tool && tool.id !== 'none';
  const cursedTool = hasTool && tool.id !== 'conventional';
  const defense = getOption('anti-domain', r['anti-domain']);
  const hasDefense = !!defense && defense.id !== 'none';
  const recovery = getOption('recovery', r.recovery);
  const hasRecovery =
    !!recovery &&
    ['self-limited', 'self-advanced', 'heal-others', 'spirit-limited', 'spirit-developed'].includes(
      recovery.id,
    );
  const domain = option('domain-expansion');
  const hasDomain = !!domain?.domain;
  const adjustment = physicalAdjustment('strength', state);
  const energy = energySummary(state);
  const resources = advancedSummary(state);
  const missingResources = [
    recovery && !hasRecovery && energyModeled ? recovery.name : '',
    defense?.id === 'none' ? defense.name : '',
  ]
    .filter(Boolean)
    .join(' · ');
  if (missingResources) resources.unshift(`${missingResources}.`);
  if (!energyModeled && r.recovery)
    resources.unshift(firstSentence(option('recovery')!.description));

  const title = full
    ? 'Combatente físico com Restrição Celestial'
    : partial
      ? 'Combatente físico com energia residual'
      : limitedBody
        ? 'Humano com restrição corporal'
        : spirit
          ? technique
            ? 'Espírito amaldiçoado com técnica própria'
            : 'Espírito amaldiçoado com recursos físicos'
          : r.nature === 'independent-cursed-corpse'
            ? hasTool
              ? 'Corpo artificial com equipamento'
              : 'Corpo artificial independente'
            : r.nature === 'simurian'
              ? hasTool
                ? 'Simuriano com equipamento'
                : 'Simuriano com referências físicas'
              : reserveHigh && outputLow
                ? 'Feiticeiro com reserva ampla e output limitado'
                : hasDefense && r['barrier-knowledge'] === 'advanced'
                  ? 'Feiticeiro com formação defensiva'
                  : technique
                    ? proficiencyInitial
                      ? 'Feiticeiro com técnica em desenvolvimento'
                      : 'Feiticeiro com foco em técnica inata'
                    : cursedTool
                      ? 'Usuário de ferramenta amaldiçoada'
                      : 'Feiticeiro sem técnica inata';

  const physical = adjustment
    ? adjustment.description
    : `Força referenciada em ${name('strength')}, mobilidade em ${name('speed')} e resistência em ${name('endurance')}. As referências descrevem desempenho; não transferem técnicas, armas, regeneração ou a constituição dos exemplos.`;
  const physicalStyle = limitedBody
    ? 'O corpo debilitado impede reproduzir as referências físicas sorteadas. Recursos energéticos não substituem locomoção, postura ou empunhadura viáveis.'
    : full
      ? 'A atuação se apoia na força, mobilidade e resistência extraordinárias da restrição, sem depender de energia própria e sem receber a experiência de Toji.'
      : partial
        ? 'A atuação se apoia no físico ampliado da restrição parcial. A energia residual não sustenta um repertório energético avançado e não equivale à condição de Toji.'
        : ['strength', 'speed', 'endurance']
            .map((id) => firstSentence(option(id)?.description ?? ''))
            .filter(Boolean)
            .join(' ');
  const toolStyle = !hasTool
    ? 'Nenhum equipamento foi atribuído.'
    : limitedBody
      ? `${tool.name} está em sua posse, mas a empunhadura direta é inviável; não recebe uma marionete para utilizá-la.`
      : !human
        ? `${tool.name} pode integrar a atuação somente com anatomia e pegada compatíveis; a posse não concede perícia.`
        : tool.id === 'conventional'
          ? 'A arma convencional oferece um recurso físico, sem energia imbuída ou exorcismo presumido.'
          : `Pode tentar incorporar ${tool.name} ao estilo físico. A energia já imbuída no item independe do estoque do portador; a posse não concede perícia ou ativa requisitos especiais ausentes.`;
  const techniqueStyle = technique
    ? `${technique.name} entra nas aplicações ${proficiencyInitial ? 'iniciais' : 'compatíveis com a proficiência registrada'}.${controlPoor ? ' O controle precário torna a execução instável; conhecimento da técnica não corrige o fluxo de energia.' : reserveLow || partial ? ' O estoque limitado restringe a sustentação dessas aplicações.' : ' Seu uso permanece sujeito às condições de ativação e aos recursos disponíveis.'}${technique.id === 'boogie-woogie' ? ' Trocas de posição exigem as condições da técnica; não recebe a experiência tática de Todo.' : ''}`
    : full
      ? ''
      : energyModeled
        ? 'Sem técnica inata, controle e output se referem às aplicações gerais de energia já compatíveis com esta criação.'
        : 'O estilo considera o físico, a reserva registrada e o equipamento disponível, sem pressupor técnicas ou fisiologia humanas.';
  const energeticStyle =
    !full && !partial && energyModeled && reserveHigh && outputLow
      ? 'O estoque amplo favorece a continuidade de aplicações compatíveis, mas o output baixo limita a energia liberada de uma vez.'
      : !full && !partial && energyModeled && reserveLow && controlRefined
        ? 'O controle refinado ajuda a regular aplicações precisas, mas a reserva muito baixa limita sua sustentação.'
        : '';
  const supportStyle = [
    hasDefense
      ? `${defense.name}: ${firstSentence(option('anti-domain')?.reference?.initialUse ?? '')}`
      : '',
    hasRecovery
      ? `${recovery.name}: ${firstSentence(option('recovery')?.reference?.initialUse ?? '')}`
      : '',
    hasDomain ? `${domain.name}: ${firstSentence(domain.reference!.initialUse!)}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const capabilities: ProfileCapability[] = [
    {
      id: 'physical',
      title: 'Físico efetivo',
      paragraphs: [physical],
      steps: ['strength', 'speed', 'endurance'],
    },
    {
      id: 'energy',
      title: r.nature === 'simurian' ? 'Reserva de rolloluca' : 'Energia',
      paragraphs: energyModeled
        ? energy.slice(0, 1)
        : [
            r.nature === 'simurian'
              ? `Reserva de rolloluca ${name('energy-reserve').toLowerCase()} na escala equivalente do jogo. O estoque não define output, precisão ou equivalência biológica com um humano.`
              : `Reserva ${name('energy-reserve').toLowerCase()} do corpo artificial. Não concede núcleos extras ou energia infinita; sua constituição permanece distinta da humana.`,
          ],
      steps: full
        ? ['energy-reserve']
        : energyModeled
          ? ['energy-reserve', 'energy-control', 'energy-output']
          : ['energy-reserve'],
    },
  ];
  if (energyModeled)
    capabilities.push({
      id: 'technique',
      title: 'Técnica e proficiência',
      paragraphs: [
        full
          ? 'Nenhuma técnica dependente de energia própria foi atribuída; proficiência não se aplica.'
          : technique
            ? `${energy[1] || technique.description}${technique.id === 'ten-shadows' ? ' Mahoraga não é concedido.' : ''}`
            : 'Não possui técnica inata nesta criação. Continua com os recursos gerais compatíveis de energia, treinamento registrado e equipamento.',
      ],
      steps: technique ? ['innate-technique', 'technique-proficiency'] : ['technique-presence'],
    });
  capabilities.push({
    id: 'resources',
    title: 'Recursos e equipamento',
    paragraphs: resources,
    steps: ['recovery', 'anti-domain', 'equipment'].filter((id) => energyModeled || !!r[id]),
  });
  if (energyModeled)
    capabilities.push({
      id: 'domain',
      title: 'Barreiras e domínio',
      paragraphs: [
        ...(r['barrier-knowledge']
          ? [
              `${name('barrier-knowledge')}. Esse conhecimento não concede uma defesa especializada ou expansão automaticamente.`,
            ]
          : []),
        hasDomain
          ? `${domain.name} · manifestação ${domain.domain!.manifestation === 'incomplete' ? 'incompleta' : 'completa'} documentada. ${domain.reference!.initialUse}`
          : full
            ? 'Sem barreira ou expansão dependentes de energia própria. Isso não presume imunidade universal a domínios.'
            : (domain?.description ?? 'Nenhuma expansão específica atribuída nesta versão.'),
      ],
      steps: ['barrier-knowledge', 'domain-expansion'],
    });

  const strengths: string[] = [];
  const limits: string[] = [];
  if (full) {
    strengths.push('Capacidade física extraordinária determinada pela Restrição Celestial.');
    limits.push('Sem energia própria: recursos que dependem dela permanecem indisponíveis.');
  } else if (partial) {
    strengths.push('Capacidade física ampliada pela restrição parcial.');
    limits.push('Energia residual: estoque e output efetivo muito limitados.');
  } else if (limitedBody) {
    strengths.push('Alcance e output favorecidos, sem ampliar automaticamente a reserva.');
    limits.push(
      hasTool
        ? 'Corpo debilitado: equipamento em posse, sem empunhadura direta viável.'
        : 'Força corporal, locomoção e tolerância física muito limitadas.',
    );
  } else if (r.strength === 'toji')
    strengths.push('Força bruta referenciada em Toji, sem conceder sua restrição ou treino.');
  else if (r.speed === 'toji')
    strengths.push('Arrancadas e mudanças de posição referenciadas em Toji.');
  else if (r.endurance === 'hanami')
    strengths.push('Persistência sob desgaste referenciada em Hanami, sem regeneração concedida.');
  else if (!limitedBody) strengths.push(firstSentence(option('strength')?.description ?? ''));
  if (!full && reserveHigh)
    strengths.push(
      `Reserva ${name('energy-reserve').toLowerCase()}${r.nature === 'simurian' ? ' de rolloluca' : ''}, ainda finita e separada da potência instantânea.`,
    );
  if (!full && !partial && controlRefined)
    strengths.push('Controle refinado do fluxo, sem multiplicar o estoque.');
  if (!full && !partial && !limitedBody && ['high', 'extraordinary'].includes(r['energy-output']))
    strengths.push(
      'Output elevado para aplicações compatíveis, sem garantir sustentação prolongada.',
    );
  if (hasDefense)
    strengths.push(`${defense.name}: aprendizado defensivo registrado, com condições de execução.`);
  if (technique && !proficiencyInitial)
    strengths.push(`Repertório de ${technique.name} desenvolvido dentro da proficiência recebida.`);
  if (hasDomain)
    strengths.push(`Acesso a ${domain.name}; ativação continua condicionada aos recursos.`);
  if (cursedTool && !limitedBody)
    strengths.push(
      'Posse de ferramenta imbuída, com uso condicionado à empunhadura e aos requisitos do item.',
    );
  if (hasRecovery)
    strengths.push(`${recovery.name}: capacidade recebida, sujeita à execução efetiva.`);

  if (tool?.id === 'soul-katana')
    limits.push('Efeito pleno da Katana bloqueado: percepção de almas exigida não foi atribuída.');
  if (technique?.id === 'limitless')
    limits.push('Ilimitado não concede Seis Olhos; utilização plena não é garantida.');
  if (hasDomain && domainExecutionLimits(state).length)
    limits.push('Acesso ao domínio recebido, mas ativação e manutenção ainda não confiáveis.');
  if (!full && !partial && (reserveLow || outputLow || controlPoor)) {
    const energyLimits = [
      reserveLow ? 'Reserva muito baixa' : '',
      outputLow ? 'output baixo' : '',
      controlPoor ? 'controle precário' : '',
    ].filter(Boolean);
    const label = energyLimits.join(', ');
    limits.push(
      `${label[0].toUpperCase()}${label.slice(1)} ${energyLimits.length === 1 ? 'limita' : 'limitam'} as aplicações de energia.`,
    );
  }
  if (hasRecovery && recoveryExecution(state) !== 'conditional')
    limits.push(
      recoveryExecution(state) === 'unreliable'
        ? 'Cura ou recomposição recebida, mas sem execução confiável com controle precário.'
        : 'Cura ou recomposição efetiva limitada a tentativas pontuais, sem regeneração contínua.',
    );
  if (technique?.id === 'ten-shadows')
    limits.push('Dez Sombras não concede todos os shikigamis domesticados ou Mahoraga.');
  else if (technique && proficiencyInitial)
    limits.push(
      'Proficiência inicial: a técnica recebida não inclui aplicações complexas dominadas.',
    );
  if (hasTool && !limitedBody)
    limits.push(
      'Possuir equipamento não concede perícia com armas; requisitos especiais continuam valendo.',
    );

  const identity = full
    ? 'O físico extraordinário é a base da atuação; a ausência de energia própria permanece.'
    : partial
      ? 'O físico ampliado convive com energia residual, sem assumir a capacidade de Toji.'
      : limitedBody
        ? 'Alcance e output favorecidos convivem com um corpo extremamente debilitado.'
        : !energyModeled
          ? `${name('nature')} com referências físicas próprias desta criação e reserva ${name('energy-reserve').toLowerCase()}${r.nature === 'simurian' ? ' de rolloluca' : ''}.`
          : reserveHigh && outputLow
            ? 'Há bastante energia disponível, mas pouca pode ser liberada de uma vez.'
            : reserveLow && controlRefined
              ? 'A precisão do controle ajuda a regular o fluxo, mas o estoque continua muito limitado.'
              : technique
                ? `${technique.name} é sua técnica; ${proficiencyInitial ? 'a atuação ainda se concentra em aplicações iniciais' : 'a exploração depende da proficiência e energia registradas'}.`
                : 'Sem técnica inata, a atuação combina o físico, aplicações gerais compatíveis de energia e os recursos recebidos.';
  const summary = `${identity} ${
    limitedBody && hasTool
      ? 'O equipamento permanece em posse, sem empunhadura direta.'
      : hasDomain
        ? `${domain.name} foi recebido como acesso, não como ativação garantida.`
        : cursedTool
          ? `${tool.name} oferece um recurso de equipamento sem conceder perícia.`
          : hasDefense
            ? `${defense.name} oferece uma defesa aprendida, sujeita às suas condições.`
            : ''
  }`.trim();

  return {
    title,
    summary,
    facts: [
      { label: 'Natureza', value: name('nature') },
      ...(human
        ? [
            { label: 'Linhagem', value: name('lineage') },
            { label: 'Condição de nascimento', value: name('birth-condition') },
          ]
        : []),
    ],
    capabilities,
    combatStyle: [
      `${physicalStyle} ${toolStyle}`,
      `${techniqueStyle} ${energeticStyle}`.trim(),
      supportStyle,
    ].filter(Boolean),
    strengths: strengths.slice(0, 4),
    limitations: limits.slice(0, 4),
    catalogNote: energyModeled
      ? undefined
      : 'Esta ficha destaca as capacidades atribuídas. Barreiras, técnicas e usos de energia específicos desta natureza ainda não estão suficientemente representados no catálogo; isso não significa incapacidade no cânone.',
  };
}
