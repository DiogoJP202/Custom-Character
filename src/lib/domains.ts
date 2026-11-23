import { domainNotes, domainOptions } from '../data/domains.ts';
import { getOption, type WheelDefinition, type WheelOption } from '../data/wheels.ts';
import type { RuleContext } from './conditions.ts';

const condition = (state: RuleContext) =>
  state.results.nature === 'human' ? state.results['birth-condition'] : undefined;
const supportedNature = (state: RuleContext) =>
  ['human', 'cursed-spirit'].includes(state.results.nature);

export function documentedDomain(state: RuleContext): WheelOption | undefined {
  const r = state.results;
  const technique = getOption('innate-technique', r['innate-technique'])?.technique;
  if (
    r['technique-presence'] !== 'yes' ||
    !technique ||
    technique.nature !== r.nature ||
    (technique.lineage && technique.lineage !== r.lineage)
  )
    return undefined;
  return domainOptions.find((option) => option.domain?.techniqueId === r['innate-technique']);
}

export function domainStageAvailable(id: string, state: RuleContext): boolean {
  if (id === 'barrier-knowledge')
    return supportedNature(state) && condition(state) !== 'physical-complete';
  if (id === 'domain-expansion')
    return (
      supportedNature(state) &&
      !['physical-complete', 'physical-partial'].includes(condition(state) ?? '') &&
      !!documentedDomain(state)
    );
  return true;
}

export function domainWheel(wheel: WheelDefinition, state: RuleContext): WheelDefinition {
  if (wheel.id === 'domain-expansion') {
    const domain = documentedDomain(state);
    return {
      ...wheel,
      options:
        domainStageAvailable(wheel.id, state) && domain
          ? wheel.options.filter((option) => option.id === 'none' || option.id === domain.id)
          : [],
    };
  }
  return wheel;
}

function otherResources(state: RuleContext): string {
  const r = state.results;
  const parts: string[] = [];
  if (condition(state) === 'physical-complete')
    parts.push('Seu físico extraordinário permanece; não depende de uma expansão própria.');
  else if (condition(state) === 'body-limited')
    parts.push(
      'Alcance e output favorecidos não corrigem o corpo debilitado ou concedem uma expansão.',
    );
  else if (condition(state) === 'physical-partial')
    parts.push('O físico ampliado permanece, sem equivalência automática ao de Toji.');
  else if (r.strength === 'toji')
    parts.push(
      'A referência física de Toji continua registrada, sem transferir sua Restrição Celestial ou treinamento.',
    );
  const tool = getOption('equipment', r.equipment);
  if (tool && tool.id !== 'none')
    parts.push(
      `Equipamento: ${tool.name}; requisitos de empunhadura, perícia e ativação continuam valendo.`,
    );
  const defense = getOption('anti-domain', r['anti-domain']);
  if (defense && defense.id !== 'none')
    parts.push(
      `${defense.name} continua sendo uma defesa especializada, sem neutralização universal ou expansão própria.`,
    );
  const technique = getOption('innate-technique', r['innate-technique']);
  if (technique && r['technique-presence'] === 'yes')
    parts.push(`${technique.name} mantém as aplicações permitidas por sua proficiência e energia.`);
  else if (r['energy-control'])
    parts.push(
      'Seu controle e output continuam disponíveis para as aplicações compatíveis de energia, mesmo sem técnica inata.',
    );
  return parts.join(' ');
}

export function domainExecutionLimits(state: RuleContext): string[] {
  const r = state.results;
  const obstacles: string[] = [];
  if (['very-low', 'common'].includes(r['energy-reserve'])) obstacles.push('reserva limitada');
  if (['poor', 'basic'].includes(r['energy-control'])) obstacles.push('controle baixo');
  if (['very-low', 'low'].includes(r['energy-output'])) obstacles.push('output baixo');
  if (['untrained', 'notions'].includes(r['barrier-knowledge']))
    obstacles.push('formação inicial em barreiras');
  if (['beginner', 'basic'].includes(r['technique-proficiency']))
    obstacles.push('proficiência inicial');
  return obstacles;
}

function executionStatus(state: RuleContext): string {
  const obstacles = domainExecutionLimits(state);
  return obstacles.length
    ? `Acesso desenvolvido, mas ativação e manutenção ainda não são confiáveis nesta interpretação do jogo: ${obstacles.join('; ')}.`
    : 'Seus recursos permitem tentar uma manifestação mais consistente nesta escala do jogo, sem garantir ativação, duração ou sucesso.';
}

export function domainUse(option: WheelOption, state: RuleContext): string {
  if (!option.domain) return otherResources(state);
  return `${executionStatus(state)} ${
    option.domain.manifestation === 'incomplete'
      ? 'A manifestação permanece incompleta, sem barreira fechada convencional ou acerto garantido. A aplicação documentada utiliza um recinto compatível; o cenário não é garantido pelo sorteio.'
      : 'A manifestação documentada é completa; dificuldades de execução não a transformam em outra versão incompleta inventada. Sua técnica imbuída e acerto garantido dependem do domínio efetivamente estabelecido.'
  }${condition(state) === 'body-limited' ? ' A debilidade corporal permanece: alcance e output não concedem um corpo substituto nem removem as condições de ativação.' : ''}`;
}

export function domainResult(id: string, option: WheelOption, state: RuleContext): WheelOption {
  if (id === 'barrier-knowledge')
    return {
      ...option,
      description: `${option.description} ${
        state.results.nature === 'cursed-spirit'
          ? 'A formação aqui se refere à construção de espaços e condições por um espírito, não à reprodução automática do treinamento ou da fisiologia humana.'
          : condition(state) === 'physical-partial'
            ? 'Este resultado representa conhecimento: a energia residual continua impedindo aplicações avançadas efetivas neste modelo.'
            : 'A execução continua dependendo da energia disponível; nenhum nível concede uma defesa ant domínio ou expansão automaticamente.'
      }`,
    };
  if (id !== 'domain-expansion') return option;
  if (!option.domain) return { ...option, notes: `${domainNotes} ${otherResources(state)}` };
  return { ...option, reference: { ...option.reference!, initialUse: domainUse(option, state) } };
}

export function domainAutomatic(id: string, state: RuleContext): WheelOption | undefined {
  if (
    !['barrier-knowledge', 'domain-expansion'].includes(id) ||
    !state.results.nature ||
    domainStageAvailable(id, state)
  )
    return undefined;
  let name: string;
  let description: string;
  if (condition(state) === 'physical-complete') {
    name = 'Não se aplica — energia própria ausente';
    description =
      'A Restrição Celestial completa bloqueia estas aplicações dependentes de energia própria. Não concede imunidade universal a domínios: cada domínio mantém suas condições e interações.';
  } else if (!supportedNature(state)) {
    name =
      id === 'barrier-knowledge'
        ? 'Formação não atribuída nesta versão'
        : 'Nenhuma expansão específica atribuída';
    description =
      state.results.nature === 'simurian'
        ? 'O catálogo não estabelece formação em barreiras ou expansões compatíveis com rolloluca. Não aplicamos regras humanas por equivalência. Seus resultados físicos e equipamento permanecem; isso não afirma incapacidade canônica.'
        : 'O catálogo não estabelece barreiras ou expansões próprias para esta constituição artificial. Seus recursos físicos e equipamento permanecem; isso não afirma incapacidade canônica.';
  } else if (condition(state) === 'physical-partial') {
    name = 'Sem expansão efetiva — energia residual';
    description =
      'A energia residual extremamente limitada da restrição parcial impede atribuir uma expansão utilizável neste modelo. Conhecimento de barreiras não remove a condição e não cria um domínio físico alternativo.';
  } else {
    // Do not pre-announce a missing domain before the technique stage is resolved.
    if (!state.results['technique-presence']) return undefined;
    if (state.results['technique-presence'] === 'yes' && !state.results['innate-technique'])
      return undefined;
    name = 'Nenhuma expansão específica atribuída';
    const technique = state.results['innate-technique'];
    description =
      state.results['technique-presence'] === 'no'
        ? 'Sem técnica inata nesta criação, nenhuma expansão específica foi atribuída. Formação em barreiras, energia e recursos gerais continuam sendo capacidades distintas.'
        : technique === 'limitless'
          ? 'Vazio Infinito não é atribuído: o jogo não modela os Seis Olhos ou os requisitos para reproduzir essa manifestação. Ilimitado e conhecimento de barreiras não a concedem automaticamente.'
          : technique === 'construction'
            ? 'A Construção cadastrada usa Mai em sua fase inicial. Não transfere o domínio e o repertório de Yorozu.'
            : technique === 'projection'
              ? 'A Projeção cadastrada usa Naobito humano. Não transfere o domínio de Naoya como espírito amaldiçoado.'
              : technique === 'cursed-spirit-manipulation'
                ? 'Manipulação de Espíritos Amaldiçoados não concede a expansão demonstrada por Kenjaku como capacidade universal de Geto.'
                : 'Não há expansão suficientemente documentada e compatível com esta versão da técnica no catálogo. Isso não afirma que uma expansão seja impossível no universo.';
  }
  return {
    id: 'not-assigned',
    name,
    shortLabel: 'SEM ATRIBUIÇÃO',
    description,
    weight: 1,
    color: '#3d5663',
    notes: domainNotes,
  };
}

export function domainSummary(state: RuleContext): string[] {
  const r = state.results;
  if (!r.equipment) return [];
  const paragraphs: string[] = [];
  const barrier = getOption('barrier-knowledge', r['barrier-knowledge']);
  if (barrier)
    paragraphs.push(
      `${barrier.name}. Formação em barreiras não concede defesa especializada ou expansão automaticamente.`,
    );
  const domain = domainOptions.find((option) => option.id === r['domain-expansion']);
  if (domain?.domain)
    paragraphs.push(
      `${domain.name} · ${domain.domain.relatedTechnique}. ${executionStatus(state)} ${domain.domain.manifestation === 'incomplete' ? 'Permanece incompleto, sem acerto garantido convencional e com necessidade de suporte espacial compatível.' : 'Manifestação completa documentada; suas propriedades exigem uma expansão efetivamente estabelecida.'}`,
    );
  else {
    const automatic = domainAutomatic('domain-expansion', state);
    if (domain || automatic)
      paragraphs.push(`${domain?.description ?? automatic!.description} ${otherResources(state)}`);
  }
  return paragraphs;
}
