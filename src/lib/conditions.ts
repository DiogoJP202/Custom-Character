import {
  getOption,
  isWheelAvailable,
  wheels,
  type WheelDefinition,
  type WheelOption,
} from '../data/wheels.ts';

export interface RuleContext {
  results: Record<string, string>;
  legacyBirth?: true;
}

export function birthCondition(state: RuleContext) {
  return state.results.nature === 'human' ? state.results['birth-condition'] : undefined;
}

export function isStageAvailable(wheel: WheelDefinition, state: RuleContext): boolean {
  if (wheel.id === 'birth-condition' && state.legacyBirth) return false;
  if (wheel.id === 'energy-reserve' && birthCondition(state) === 'physical-complete') return false;
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
  if (wheel.id !== 'energy-reserve') return wheel;
  const partial = birthCondition(state) === 'physical-partial';
  const simurian = state.results.nature === 'simurian';
  return {
    ...wheel,
    name: simurian ? 'Reserva de rolloluca' : wheel.name,
    description: partial
      ? 'A restrição limita a reserva a Muito baixa. O giro registra essa consequência (100%).'
      : simurian
        ? 'Sorteie uma reserva equivalente de rolloluca na escala do jogo.'
        : wheel.description,
    options: partial ? wheel.options.filter((option) => option.id === 'very-low') : wheel.options,
  };
}

export function resultDetails(stepId: string, state: RuleContext): WheelOption | undefined {
  const option = getOption(stepId, state.results[stepId]);
  if (!option) return automaticOutcome(stepId, state);
  const adjustment = physicalAdjustment(stepId, state);
  if (adjustment)
    return {
      ...option,
      adjustment,
      description: adjustment.description,
      notes: `Referência sorteada: ${option.name}. Descrição original para consulta: ${option.description} A capacidade efetiva acima prevalece sobre essa comparação.`,
    };
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
