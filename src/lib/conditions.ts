import {
  getOption,
  isWheelAvailable,
  wheels,
  type WheelDefinition,
  type WheelOption,
} from '../data/wheels.ts';
import { techniques, spiritTechniquePresence } from '../data/techniques.ts';
import { masteryNotes, masteryReferences } from '../data/mastery.ts';
import {
  advancedAutomatic,
  advancedForcedReason,
  advancedResult,
  advancedStageAvailable,
  advancedWheel,
} from './advanced.ts';

export interface RuleContext {
  results: Record<string, string>;
  legacyBirth?: true;
}

export function birthCondition(state: RuleContext) {
  return state.results.nature === 'human' ? state.results['birth-condition'] : undefined;
}

export function eligibleTechniques(state: RuleContext): WheelOption[] {
  const { nature, lineage } = state.results;
  const energyAbsent = birthCondition(state) === 'physical-complete';
  return techniques.filter(
    ({ technique }) =>
      technique &&
      technique.nature === nature &&
      (!technique.lineage || technique.lineage === lineage) &&
      (!technique.requiresOwnEnergy || !energyAbsent),
  );
}

export function isStageAvailable(wheel: WheelDefinition, state: RuleContext): boolean {
  if (wheel.chapterId === 'advanced')
    return advancedStageAvailable(wheel.id, state) && isWheelAvailable(wheel, state.results);
  if (['energy-control', 'energy-output', 'technique-proficiency'].includes(wheel.id)) {
    if (birthCondition(state) === 'physical-complete') return false;
    if (!['human', 'cursed-spirit'].includes(state.results.nature)) return false;
    if (
      wheel.id === 'technique-proficiency' &&
      !eligibleTechniques(state).some((option) => option.id === state.results['innate-technique'])
    )
      return false;
  }
  if (wheel.id === 'birth-condition' && state.legacyBirth) return false;
  if (wheel.id === 'energy-reserve' && birthCondition(state) === 'physical-complete') return false;
  if (
    ['technique-presence', 'innate-technique'].includes(wheel.id) &&
    !eligibleTechniques(state).length
  )
    return false;
  return isWheelAvailable(wheel, state.results);
}

export function physicalAdjustment(stepId: string, state: RuleContext): WheelOption['adjustment'] {
  if (!['strength', 'speed', 'endurance'].includes(stepId)) return undefined;
  const condition = birthCondition(state);
  if (condition === 'physical-partial')
    return {
      capacity: 'enhanced',
      label: 'Capacidade efetiva: físico ampliado (parcial)',
      description:
        'A condição fixa uma capacidade corporal ampliada, usando Maki no Intercâmbio como referência qualitativa. A referência sorteada fica registrada para comparação, mas não transfere seus feitos ou eleva este corpo ao patamar de Toji. Não há soma de poderes.',
    };
  if (condition === 'physical-complete')
    return {
      capacity: 'extraordinary',
      label: 'Capacidade efetiva: físico extraordinário',
      description:
        'A Restrição Celestial completa determina a capacidade corporal extraordinária, com Toji como exemplo. A referência sorteada é preservada como comparação e não reduz esse patamar. Não concede o treinamento, as armas ou os poderes do personagem de referência.',
    };
  if (condition === 'body-limited')
    return {
      capacity: 'severely-limited',
      label: `Capacidade efetiva: ${stepId === 'speed' ? 'locomoção' : stepId === 'strength' ? 'força corporal' : 'tolerância corporal'} muito limitada`,
      description:
        'O corpo extremamente debilitado prevalece sobre a referência sorteada: ele não executa os feitos físicos exibidos abaixo. Os feitos de Mechamaru pertencem a um corpo artificial operado por Kokichi, não ao corpo humano. Alcance e produção de energia favorecidos não removem esta limitação.',
    };
  return undefined;
}

export function playableWheel(wheel: WheelDefinition, state: RuleContext): WheelDefinition {
  if (wheel.chapterId === 'advanced') return advancedWheel(wheel, state);
  if (['energy-control', 'energy-output', 'technique-proficiency'].includes(wheel.id)) {
    const condition = birthCondition(state);
    const partial = condition === 'physical-partial';
    const simurian = state.results.nature === 'simurian';
    return {
      ...wheel,
      name:
        simurian && wheel.id !== 'technique-proficiency'
          ? wheel.id === 'energy-control'
            ? 'Controle de rolloluca'
            : 'Output de rolloluca'
          : wheel.name,
      description:
        wheel.id === 'energy-output' && partial
          ? 'A energia residual da Restrição Celestial parcial determina output Muito baixo, sem sorteio.'
          : wheel.id === 'energy-output' && condition === 'body-limited'
            ? 'A restrição corporal preserva output favorecido. Alto e Extraordinário são os níveis elegíveis desta escala de jogo.'
            : wheel.id === 'technique-proficiency' && partial
              ? 'A energia residual limita a proficiência efetiva a aplicações iniciais. Iniciante e Básica são as opções elegíveis do jogo.'
              : wheel.description,
      options:
        wheel.id === 'energy-output' && partial
          ? wheel.options.filter((option) => option.id === 'very-low')
          : wheel.id === 'energy-output' && condition === 'body-limited'
            ? wheel.options.filter((option) => ['high', 'extraordinary'].includes(option.id))
            : wheel.id === 'technique-proficiency' && partial
              ? wheel.options.filter((option) => ['beginner', 'basic'].includes(option.id))
              : wheel.options,
    };
  }
  if (wheel.id === 'technique-presence')
    return {
      ...wheel,
      description:
        state.results.nature === 'cursed-spirit'
          ? 'Sorteie a presença de uma técnica no catálogo de espíritos. Distribuição própria do jogo: 90% possui, 10% não possui.'
          : wheel.description,
      options: state.results.nature === 'cursed-spirit' ? spiritTechniquePresence : wheel.options,
    };
  if (wheel.id === 'innate-technique') return { ...wheel, options: eligibleTechniques(state) };
  if (wheel.id !== 'energy-reserve') return wheel;
  const partial = birthCondition(state) === 'physical-partial';
  const simurian = state.results.nature === 'simurian';
  return {
    ...wheel,
    name: simurian ? 'Reserva de rolloluca' : wheel.name,
    description: partial
      ? 'A Restrição Celestial física parcial determina uma reserva Muito baixa. Esta consequência é registrada automaticamente.'
      : simurian
        ? 'Sorteie uma reserva equivalente de rolloluca na escala do jogo.'
        : wheel.description,
    options: partial ? wheel.options.filter((option) => option.id === 'very-low') : wheel.options,
  };
}

export function forcedOutcome(wheel: WheelDefinition, state: RuleContext) {
  if (!isStageAvailable(wheel, state)) return undefined;
  const options = playableWheel(wheel, state).options;
  if (options.length !== 1) return undefined;
  const option = options[0];
  if (state.results[wheel.id] && state.results[wheel.id] !== option.id) return undefined;
  const reason =
    advancedForcedReason(wheel.id, state) ??
    (wheel.id === 'energy-reserve' && birthCondition(state) === 'physical-partial'
      ? 'A Restrição Celestial física parcial limita a reserva a Muito baixa.'
      : wheel.id === 'energy-output' && birthCondition(state) === 'physical-partial'
        ? 'A energia residual da Restrição Celestial física parcial fixa o output efetivo em Muito baixo, na escala do jogo.'
        : 'As condições anteriores deixam apenas uma opção compatível para esta etapa.');
  return { option, reason };
}

export function resultDetails(stepId: string, state: RuleContext): WheelOption | undefined {
  const definition = wheels.find((wheel) => wheel.id === stepId);
  const option =
    definition &&
    playableWheel(definition, state).options.find((option) => option.id === state.results[stepId]);
  if (!option) return automaticOutcome(stepId, state);
  if (definition?.chapterId === 'advanced') return advancedResult(stepId, option, state);
  if (['energy-control', 'energy-output', 'technique-proficiency'].includes(stepId)) {
    const partial = birthCondition(state) === 'physical-partial';
    const kokichi = birthCondition(state) === 'body-limited';
    const spirit = state.results.nature === 'cursed-spirit';
    if (stepId === 'technique-proficiency') {
      const technique = getOption('innate-technique', state.results['innate-technique']);
      if (!technique?.reference) return undefined;
      return {
        ...option,
        description: option.description,
        reference: {
          ...technique.reference,
          topic: 'proficiency',
          version: `${technique.name} · ${technique.reference.version}`,
          initialUse: techniquePractice(state),
        },
        sources: technique.sources,
        notes: [
          masteryNotes,
          ...energySummary(state),
          'Os feitos são exemplos da técnica original; não são concedidos integralmente por este nível.',
        ].join(' '),
      };
    }
    return {
      ...option,
      description: `${option.description} ${
        spirit
          ? 'Aqui o resultado descreve a regulação ou liberação da energia de um espírito, sem pressupor corpo ou metabolismo humano. Não determina regeneração.'
          : partial
            ? stepId === 'energy-control'
              ? 'O controle representa precisão potencial sobre energia residual. A reserva continua Muito baixa e o output efetivo Muito baixo; não habilita aplicações avançadas.'
              : 'A energia residual fixa este limite, independentemente da precisão sorteada. Não habilita aplicações avançadas.'
            : kokichi
              ? 'A vantagem de alcance permanece sujeita às condições da técnica. Seu corpo continua extremamente debilitado; nenhum equipamento ou técnica é concedido.'
              : 'Sua reserva permanece a mesma; precisão, liberação e domínio da técnica são capacidades distintas.'
      }`,
      reference: spirit
        ? stepId === 'energy-output'
          ? masteryReferences.spiritOutput
          : masteryReferences.spirit
        : stepId === 'energy-control'
          ? masteryReferences.control
          : kokichi
            ? masteryReferences.kokichi
            : masteryReferences.output,
      sources:
        stepId === 'energy-output' && !spirit && !kokichi
          ? [
              {
                label: 'Ryu Ishigori · perfil oficial sobre output',
                url: 'https://jujutsukaisen.jp/character/',
              },
            ]
          : undefined,
      notes: [
        masteryNotes,
        ...energySummary(state),
        partial
          ? 'O limite de output e o teto de proficiência são adaptações explícitas do jogo para preservar a condição parcial, não categorias oficiais de Maki.'
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }
  const adjustment = physicalAdjustment(stepId, state);
  if (adjustment)
    return {
      ...option,
      adjustment,
      description: adjustment.description,
      notes: `Referência sorteada: ${option.name}. Descrição original para consulta: ${option.description} A capacidade efetiva acima prevalece sobre essa comparação.`,
    };
  if (option.technique) {
    const lineage = option.technique.lineage;
    const lowEnergy = state.results['energy-reserve'] === 'very-low';
    const partial = birthCondition(state) === 'physical-partial';
    const limitedBody = birthCondition(state) === 'body-limited';
    return {
      ...option,
      notes: [
        lineage
          ? `É elegível pela linhagem registrada (${getOption('lineage', lineage)?.name}). O clã permite participar do sorteio; não garante esta técnica.`
          : 'Opção sem requisito de linhagem neste catálogo. Sua atribuição é uma combinação de gameplay, não uma frequência oficial.',
        partial
          ? 'Energia residual: a técnica é registrada como capacidade existente, mas sua aplicação não é garantida por este estoque. Não concede energia adicional nem remove a Restrição Celestial.'
          : lowEnergy
            ? 'A reserva registrada limita as aplicações possíveis. Receber a técnica não aumenta o estoque nem garante um uso contínuo.'
            : 'Reserva, controle e domínio da técnica são atributos distintos. O estoque sorteado não concede perícia.',
        limitedBody
          ? 'O corpo continua extremamente debilitado. A técnica não remove essa condição nem concede marionetes, equipamentos ou capacidade física extra.'
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }
  if (stepId !== 'energy-reserve') return option;
  const nature = state.results.nature;
  const context =
    nature === 'simurian'
      ? 'Rolloluca: usamos uma escala equivalente de gameplay para o conceito simuriano de Modulo. Não presumimos uma biologia humana nem uma equivalência canônica de quantidades entre espécies.'
      : nature === 'cursed-spirit'
        ? 'Espírito amaldiçoado: a escala abstrai energia de uma existência constituída de energia amaldiçoada, não o estoque de um corpo humano. Não determina regeneração ou grau.'
        : nature === 'independent-cursed-corpse'
          ? 'Cadáver amaldiçoado independente: a escala abstrai a reserva de um corpo artificial autônomo. Não concede núcleos extras, energia infinita ou uma fisiologia humana.'
          : 'Humano: quantidade de energia disponível; a reserva não determina uma técnica ou o domínio de jujutsu.';
  const kokichi =
    birthCondition(state) === 'body-limited'
      ? ' A condição favorece alcance e output, mas não altera o estoque sorteado nem concede energia armazenada por anos.'
      : '';
  const yuta =
    nature === 'human' && option.id === 'immense'
      ? ' Yuta é um exemplo narrativo de grandes reservas (mangá, cap. 140), sem equivalência exata. Não concede Rika ou sua técnica.'
      : '';
  return {
    ...option,
    description: `${option.description} ${context}${kokichi}${yuta}`,
    sources:
      nature === 'simurian'
        ? [
            {
              label: 'Jujutsu Kaisen Modulo · edição oficial (terminologia)',
              url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo',
            },
          ]
        : yuta
          ? [
              {
                label: 'Jujutsu Kaisen · cap. 140 (catálogo oficial)',
                url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen',
              },
            ]
          : undefined,
  };
}

export function automaticOutcome(stepId: string, state: RuleContext): WheelOption | undefined {
  const advanced = advancedAutomatic(stepId, state);
  if (advanced) return advanced;
  if (['energy-control', 'energy-output', 'technique-proficiency'].includes(stepId)) {
    const base = { id: 'not-applicable', shortLabel: 'NÃO SORTEADO', weight: 1, color: '#3d5663' };
    if (birthCondition(state) === 'physical-complete')
      return {
        ...base,
        name: 'Não se aplica — energia própria ausente',
        description:
          'A Restrição Celestial completa elimina energia amaldiçoada própria. Controle, output e proficiência em técnicas dependentes dessa energia não são sorteados; a condição física permanece.',
      };
    if (state.results.nature === 'independent-cursed-corpse')
      return {
        ...base,
        name:
          stepId === 'technique-proficiency'
            ? 'Proficiência não catalogada nesta versão'
            : `${stepId === 'energy-control' ? 'Controle' : 'Output'} não catalogado nesta versão`,
        description:
          'O corpo artificial autônomo e sua reserva permanecem. Esta versão não extrapola a constituição de Panda para um modelo humano de controle, output ou proficiência. É uma limitação do catálogo, não incapacidade canônica.',
        sources: [
          {
            label: 'Panda · perfil oficial',
            url: 'https://jujutsukaisen.jp/character/index_1st.php',
          },
        ],
      };
    if (state.results.nature === 'simurian')
      return {
        ...base,
        name: 'Capacidade de rolloluca não catalogada nesta versão',
        description:
          'A reserva equivalente de rolloluca continua registrada. Sem fundamentação suficiente para modelar controle, output e proficiência simurianos, esta versão não aplica as regras humanas a essa natureza. Isso não declara uma incapacidade no cânone.',
        sources: [
          {
            label: 'Jujutsu Kaisen Modulo · catálogo oficial',
            url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo',
          },
        ],
      };
    if (stepId === 'technique-proficiency' && state.results['technique-presence'] === 'no')
      return {
        ...base,
        name: 'Não se aplica — sem técnica inata',
        description:
          'Nenhuma técnica inata foi atribuída, portanto não há uma técnica para dominar. Controle e output continuam disponíveis quando a natureza e a condição permitem.',
      };
  }
  if (stepId === 'technique-presence') {
    const base = { id: 'not-rolled', shortLabel: 'NÃO SORTEADA', weight: 1, color: '#3d5663' };
    if (birthCondition(state) === 'physical-complete')
      return {
        ...base,
        name: 'Etapa bloqueada — energia própria ausente',
        description:
          'A Restrição Celestial completa impede este sorteio de técnicas que exigem energia própria. Nenhuma técnica foi atribuída. Isso não impede treinamento ou ferramentas que possam ser utilizadas sem essa energia.',
      };
    if (state.results.nature === 'independent-cursed-corpse')
      return {
        ...base,
        name: 'Técnica não catalogada nesta versão',
        description:
          'Seu corpo artificial independente permanece registrado. Panda é um exemplo de constituição com núcleos; isso não torna seus núcleos ou formas uma técnica inata universal, e não atribui núcleos extras ao personagem. Esta versão não sorteia técnicas humanas para essa natureza; isso não é uma incapacidade definitiva do cânone.',
        sources: [
          {
            label: 'Anime · episódio 16 (Panda e Mechamaru)',
            url: 'https://jujutsukaisen.jp/episodes/16.php',
          },
        ],
      };
    if (state.results.nature === 'simurian')
      return {
        ...base,
        name: 'Técnica não catalogada nesta versão',
        description:
          'A reserva de rolloluca permanece. Esta versão ainda não tem um catálogo fundamentado de habilidades simurianas para sortear, portanto não atribui técnicas humanas. A ausência de opções no jogo não significa ausência de habilidades no cânone.',
        sources: [
          {
            label: 'Jujutsu Kaisen Modulo · catálogo oficial',
            url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo',
          },
        ],
      };
  }
  if (stepId === 'energy-reserve' && birthCondition(state) === 'physical-complete')
    return {
      id: 'absent',
      name: 'Ausente — Restrição Celestial completa',
      shortLabel: 'AUSENTE',
      weight: 1,
      color: '#3d5663',
      description:
        'Nenhuma energia amaldiçoada própria. A reserva não é sorteada: é uma consequência da condição de nascimento. Recursos que dependem de energia própria estão bloqueados.',
    };
  if (stepId === 'birth-condition' && state.legacyBirth)
    return {
      id: 'not-recorded',
      name: 'Não registrada — partida anterior',
      shortLabel: 'NÃO REGISTRADA',
      weight: 1,
      color: '#3d5663',
      description:
        'Esta partida já tinha atributos físicos antes da inclusão das condições de nascimento. Nenhuma condição foi atribuída retroativamente; os resultados existentes permanecem. Uma nova criação inclui a roleta na ordem correta.',
    };
  return undefined;
}

export function wheelForStep(stepId: string, state: RuleContext) {
  const wheel = wheels.find((entry) => entry.id === stepId);
  return wheel && playableWheel(wheel, state);
}

function techniquePractice(state: RuleContext): string {
  const technique = getOption('innate-technique', state.results['innate-technique']);
  const proficiency = state.results['technique-proficiency'];
  if (!technique || !proficiency) return '';
  const initial = ['beginner', 'basic'].includes(proficiency);
  const application = initial ? technique.reference?.initialUse : technique.technique?.practicedUse;
  const limitation =
    birthCondition(state) === 'physical-partial'
      ? ' Com energia residual, mesmo estas aplicações não são garantidas e permanecem iniciais.'
      : state.results['energy-control'] === 'poor'
        ? ' O controle precário torna a execução instável, mesmo com conhecimento da técnica.'
        : state.results['energy-reserve'] === 'very-low'
          ? ' A reserva muito baixa limita a sustentação; proficiência não aumenta esse estoque.'
          : '';
  return `${application ?? 'Aplicações sujeitas às condições da técnica.'}${limitation}`;
}

// Short, derived explanations; no hidden points, damage formula or rewritten rolls.
export function energySummary(state: RuleContext): string[] {
  if (birthCondition(state) === 'physical-complete')
    return [
      'Sem energia própria: controle, output e proficiência não se aplicam. A capacidade física extraordinária permanece.',
    ];
  if (['independent-cursed-corpse', 'simurian'].includes(state.results.nature)) {
    if (!state.results['energy-reserve']) return [];
    return [
      state.results.nature === 'simurian'
        ? 'A reserva de rolloluca foi preservada. Controle, output e proficiência simurianos ainda não são modelados neste catálogo; isso não indica incapacidade canônica.'
        : 'A reserva do corpo artificial foi preservada. O catálogo ainda não modela seu controle, output ou proficiência como os de um humano.',
    ];
  }
  const r = state.results;
  const control = getOption('energy-control', r['energy-control']);
  const output = getOption('energy-output', r['energy-output']);
  const reserve = getOption('energy-reserve', r['energy-reserve']);
  let energy = '';
  if (control || output) {
    if (birthCondition(state) === 'physical-partial')
      energy =
        'Energia residual: a precisão sorteada é potencial; o estoque e a liberação efetiva continuam muito limitados.';
    else if (output && reserve) {
      const lowOutput = ['very-low', 'low'].includes(output.id);
      const highOutput = ['high', 'extraordinary'].includes(output.id);
      const highReserve = ['high', 'exceptional', 'immense'].includes(reserve.id);
      energy =
        highReserve && lowOutput
          ? `Reserva ${reserve.name.toLowerCase()}, mas output ${output.name.toLowerCase()}: há estoque para mais aplicações compatíveis, com pouca energia liberada de uma vez.`
          : reserve.id === 'very-low' && highOutput
            ? `Reserva muito baixa com output ${output.name.toLowerCase()}: descargas relativamente intensas podem consumir rapidamente a energia disponível.`
            : `Reserva ${reserve.name.toLowerCase()} e output ${output.name.toLowerCase()}: a liberação de cada aplicação continua limitada pelo estoque disponível.`;
    }
    if (control)
      energy += `${energy ? ' ' : ''}${control.id === 'poor' ? 'Controle precário: o fluxo é instável, independentemente do estoque.' : `Controle ${control.name.toLowerCase()} regula a precisão do fluxo, sem multiplicar a reserva.`}`;
    if (birthCondition(state) === 'body-limited')
      energy +=
        ' Alcance e output favorecidos não reparam o corpo nem ignoram as condições da técnica.';
  }
  const technique = getOption('innate-technique', r['innate-technique']);
  const proficiency = getOption('technique-proficiency', r['technique-proficiency']);
  const practice =
    technique && proficiency
      ? `${technique.name} · proficiência ${proficiency.name.toLowerCase()}: ${techniquePractice(state)}`
      : r['technique-presence'] === 'no' && (control || output)
        ? 'Sem técnica inata: o controle e o output se referem às aplicações gerais compatíveis, sem criar uma técnica.'
        : '';
  return [energy, practice].filter(Boolean);
}
