import { getOption, type WheelDefinition, type WheelOption } from '../data/wheels.ts';
import { advancedNotes } from '../data/advanced.ts';
import type { RuleContext } from './conditions.ts';

const condition = (state: RuleContext) =>
  state.results.nature === 'human' ? state.results['birth-condition'] : undefined;
export function advancedStageAvailable(id: string, state: RuleContext): boolean {
  if (id === 'anti-domain')
    return state.results.nature === 'human' && condition(state) !== 'physical-complete';
  if (id === 'recovery') return condition(state) !== 'physical-complete';
  return true;
}

export function advancedWheel(wheel: WheelDefinition, state: RuleContext): WheelDefinition {
  const nature = state.results.nature;
  const partial = condition(state) === 'physical-partial';
  if (wheel.id === 'recovery') {
    const ids =
      nature === 'cursed-spirit'
        ? ['spirit-untrained', 'spirit-limited', 'spirit-developed']
        : nature === 'independent-cursed-corpse'
          ? ['external-repair']
          : nature === 'simurian'
            ? ['natural-recovery']
            : partial
              ? ['no-rct']
              : ['no-rct', 'self-limited', 'self-advanced', 'heal-others'];
    return {
      ...wheel,
      name:
        nature === 'cursed-spirit'
          ? 'Recomposição do espírito'
          : nature === 'independent-cursed-corpse'
            ? 'Reparação do corpo artificial'
            : nature === 'simurian'
              ? 'Recuperação'
              : wheel.name,
      description:
        nature === 'human'
          ? partial
            ? 'A energia residual não sustenta RCT neste modelo. A consequência é registrada sem sorteio.'
            : wheel.description
          : 'A recuperação respeita sua natureza; esta etapa não transfere o modelo de cura humana.',
      options: wheel.options.filter((option) => ids.includes(option.id)),
    };
  }
  if (wheel.id === 'anti-domain')
    return {
      ...wheel,
      description: partial
        ? 'A energia residual não sustenta estas defesas no modelo atual. Nenhuma defesa especializada será registrada automaticamente.'
        : wheel.description,
      options: wheel.options.filter((option) =>
        partial
          ? option.id === 'none'
          : option.id !== 'falling-blossom' ||
            ['gojo', 'zenin', 'kamo'].includes(state.results.lineage),
      ),
    };
  return wheel;
}

export function advancedForcedReason(id: string, state: RuleContext): string | undefined {
  if (condition(state) === 'physical-partial')
    return id === 'recovery'
      ? 'A energia residual limita esta criação: o jogo não atribui Técnica Reversa sob a restrição parcial.'
      : id === 'anti-domain'
        ? 'A restrição parcial não fornece energia efetiva para sustentar estas defesas na escala atual do jogo.'
        : undefined;
  if (id === 'recovery' && state.results.nature === 'independent-cursed-corpse')
    return 'Um corpo artificial requer reparação compatível com sua constituição; não recebe cura humana por sorteio.';
  if (id === 'recovery' && state.results.nature === 'simurian')
    return 'Não presumimos um mecanismo humano de cura para simurianos. O equipamento físico continua disponível.';
  return undefined;
}

export function advancedAutomatic(id: string, state: RuleContext): WheelOption | undefined {
  if (!['recovery', 'anti-domain'].includes(id)) return undefined;
  if (condition(state) === 'physical-complete')
    return {
      id: 'energy-absent',
      name: 'Não se aplica — energia própria ausente',
      shortLabel: 'SEM ENERGIA',
      weight: 1,
      color: '#3d5663',
      description:
        'A Restrição Celestial completa bloqueia RCT e estas defesas dependentes de energia própria. O equipamento continua disponível. Isso não declara imunidade a todo domínio.',
    };
  if (id === 'anti-domain' && state.results.nature && state.results.nature !== 'human')
    return {
      id: 'no-human-defense',
      name: 'Nenhuma defesa humana atribuída',
      shortLabel: 'SEM DEFESA ATRIBUÍDA',
      weight: 1,
      color: '#3d5663',
      description:
        'Esta criação não recebe automaticamente a formação e as defesas do catálogo humano. Isso não afirma incapacidade canônica de sua natureza. Recuperação compatível e equipamentos são tratados separadamente.',
    };
  return undefined;
}

function recoveryUse(option: WheelOption, state: RuleContext): string {
  const r = state.results;
  if (['no-rct', 'external-repair', 'natural-recovery', 'spirit-untrained'].includes(option.id))
    return option.description;
  const spirit = r.nature === 'cursed-spirit';
  const scarce = r['energy-reserve'] === 'very-low';
  const poor = r['energy-control'] === 'poor';
  const basic = r['energy-control'] === 'basic';
  const lowOutput = ['very-low', 'low'].includes(r['energy-output']);
  const base = poor
    ? 'Capacidade efetiva: execução instável, sem recuperação confiável nesta criação. O resultado aprendido permanece registrado; controle precário não sustenta uma aplicação segura.'
    : scarce || basic || lowOutput
      ? 'Capacidade efetiva: no máximo tentativas pontuais de reparos limitados, sem garantir tratar lesões graves. Estoque, precisão ou liberação baixos impedem interpretar o resultado como regeneração contínua.'
      : option.id === 'heal-others'
        ? 'Pode tentar tratamentos próprios e em outra pessoa compatível, consumindo energia. Não há cura garantida, compatibilidade universal ou recuperação de qualquer ferimento.'
        : option.id === 'self-advanced' || option.id === 'spirit-developed'
          ? 'Pode explorar reparos próprios mais amplos dentro do repertório recebido, enquanto houver energia e controle suficientes. Não é restauração ilimitada ou proteção contra dano fatal.'
          : 'Pode tentar reparos próprios limitados, interrompendo-os quando o estoque ou a execução não sustentarem a aplicação. Não recebe cura de terceiros.';
  return `${base}${option.id === 'heal-others' && (poor || scarce || basic || lowOutput) ? ' Curar terceiros foi sorteado, mas não é uma aplicação confiável com seus recursos atuais.' : ''}${spirit ? ' A recomposição usa energia amaldiçoada, não energia positiva de RCT.' : ' RCT não concede Reversão da Técnica Amaldiçoada.'}${condition(state) === 'body-limited' ? ' Não remove a Restrição Celestial ou corrige a debilidade de nascimento de Kokichi; só se refere a lesões tratáveis.' : ''}`;
}

function defenseUse(option: WheelOption, state: RuleContext): string {
  if (option.id === 'none')
    return 'Nenhuma defesa especializada foi concedida. Controle excepcional ou uma técnica inata não substituem o aprendizado deste recurso.';
  const r = state.results;
  if (condition(state) === 'body-limited')
    return 'Conhecimento registrado, mas execução corporal não garantida: a debilidade permanece. Postura e selos precisam ser viáveis; nenhuma cápsula, marionete ou mecanismo de Mechamaru é concedido para contornar isso.';
  const strained =
    ['poor', 'basic'].includes(r['energy-control']) ||
    r['energy-reserve'] === 'very-low' ||
    ['very-low', 'low'].includes(r['energy-output']);
  const limits =
    option.id === 'hollow-wicker-basket'
      ? 'A ativação e a sustentação ocupam as mãos com o selo; não pressupõe lutar livremente ao mesmo tempo.'
      : option.id === 'simple-domain'
        ? 'Esta configuração inicial exige manter a posição de ativação; deslocar-se encerra a defesa.'
        : 'Reage a ataques em contato; não substitui uma barreira nem impede ataques físicos diretos.';
  return `${strained ? 'Capacidade efetiva: ativação instável ou breve, sem proteção confiável contra um domínio forte.' : 'Pode tentar ativar a defesa aprendida, respeitando suas condições e consumindo energia; ela ainda pode ser superada.'} ${limits}`;
}

function equipmentUse(option: WheelOption, state: RuleContext): string {
  if (option.id === 'none')
    return 'Sem equipamento concedido. Não altera força, reserva ou técnica.';
  const r = state.results;
  if (condition(state) === 'body-limited')
    return 'Posse: equipamento registrado. Empunhadura direta: inviável com o corpo extremamente debilitado desta condição. Domínio: não avaliado. Propriedades especiais: não ativadas; não recebe um operador, marionete ou corpo reparado.';
  const body = ['independent-cursed-corpse', 'simurian', 'cursed-spirit'].includes(r.nature)
    ? 'A pegada, a anatomia e a postura precisam ser compatíveis com o equipamento; a posse não presume uma fisiologia humana. '
    : 'A condição corporal permite tentar empunhar, sem garantir acerto ou treinamento. ';
  const effect =
    option.id === 'soul-katana'
      ? 'Efeito pleno: bloqueado, pois a percepção exigida não é um atributo registrado nesta versão. Apenas uso físico compatível da lâmina.'
      : option.id === 'inverted-spear'
        ? 'Efeito: pode interromper uma técnica alcançada por contato da lâmina, sem exigir energia própria. É preciso obter esse contato; não anula um domínio inteiro automaticamente.'
        : option.id === 'playful-cloud'
          ? `Aproveitamento: depende do físico efetivo${condition(state) === 'physical-complete' ? ' extraordinário da restrição completa' : condition(state) === 'physical-partial' ? ' ampliado, limitado pela restrição parcial' : ` registrado (referência de força: ${getOption('strength', r.strength)?.name ?? 'a já sorteada'})`} e do treinamento com a arma articulada; ela não acrescenta uma técnica.`
          : option.id === 'conventional'
            ? 'Efeito: arma física, sem energia imbuída; não presume exorcismo de maldições. Reforçá-la com energia própria exigiria aplicação e treino que este sorteio não entrega.'
            : 'Efeito: a energia já imbuída permite atingir maldições sem energia própria do portador. Não há técnica especial ou dano garantido.';
  return `Posse: equipamento disponível. ${body}Domínio: perícia em armas não foi sorteada nem concedida. ${effect}`;
}

export function advancedResult(id: string, option: WheelOption, state: RuleContext): WheelOption {
  if (!['recovery', 'anti-domain', 'equipment'].includes(id)) return option;
  const usage =
    id === 'recovery'
      ? recoveryUse(option, state)
      : id === 'anti-domain'
        ? defenseUse(option, state)
        : equipmentUse(option, state);
  return {
    ...option,
    description: option.reference
      ? option.description
      : `${option.description} ${usage === option.description ? '' : usage}`.trim(),
    reference: option.reference ? { ...option.reference, initialUse: usage } : undefined,
    notes: [
      option.notes,
      advancedNotes,
      id === 'anti-domain' && option.id !== 'none'
        ? 'O resultado inclui aprendizado do recurso por treino, não uma técnica inata retroativa. Nenhum domínio foi concedido.'
        : '',
      usage,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function advancedSummary(state: RuleContext): string[] {
  const r = state.results;
  const recovery = getOption('recovery', r.recovery);
  const defense = getOption('anti-domain', r['anti-domain']);
  const tool = getOption('equipment', r.equipment);
  const physical =
    condition(state) === 'physical-complete'
      ? 'o físico extraordinário, sem energia própria'
      : condition(state) === 'physical-partial'
        ? 'o físico ampliado da restrição parcial'
        : `a força referenciada em ${getOption('strength', r.strength)?.name ?? 'seus resultados físicos'}`;
  const lines: string[] = [];
  if (
    recovery &&
    !['no-rct', 'external-repair', 'natural-recovery', 'spirit-untrained'].includes(recovery.id)
  )
    lines.push(
      `${recovery.name}: ${r['energy-control'] === 'poor' ? 'controle precário impede execução confiável' : r['energy-reserve'] === 'very-low' || ['very-low', 'low'].includes(r['energy-output']) || r['energy-control'] === 'basic' ? 'os recursos atuais limitam a reparos pontuais; o repertório sorteado permanece' : 'aplicações sujeitas a energia, controle e lesão, sem recuperação ilimitada'}.${condition(state) === 'body-limited' ? ' A cura não remove a debilidade de nascimento.' : ''}`,
    );
  if (defense && defense.id !== 'none')
    lines.push(
      `${defense.name}: aprendizado registrado, sem vitória garantida contra domínios.${condition(state) === 'body-limited' ? ' A execução corporal continua limitada.' : ['poor', 'basic'].includes(r['energy-control']) || r['energy-reserve'] === 'very-low' ? ' Sua energia ou precisão limitam a sustentação.' : ''}`,
    );
  if (tool && tool.id !== 'none')
    lines.push(
      condition(state) === 'body-limited'
        ? `${tool.name} está em sua posse, mas não pode ser empunhada diretamente por este corpo. Nenhuma marionete foi concedida.`
        : `Combina ${tool.name} com ${physical}, sem conceder perícia.${r['technique-presence'] === 'no' ? ' É um caminho de equipamento sem receber técnica inata.' : ''}${tool.id === 'soul-katana' ? ' O efeito pleno exige percepção ainda não registrada e fica bloqueado.' : tool.id === 'conventional' ? ' Não é uma ferramenta já imbuída para exorcismo.' : ' O aproveitamento depende da empunhadura, do treino e dos requisitos do item.'}`,
    );
  if (tool?.id === 'none')
    lines.push('Nenhum equipamento foi atribuído; os demais recursos continuam registrados.');
  return lines;
}
