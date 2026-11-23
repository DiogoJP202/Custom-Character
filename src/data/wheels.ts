import { physicalReferences, type CharacterReference } from './references.ts';
import type { ReferenceSource } from './references.ts';
import { birthOptions, energyOptions, energyNotes } from './special.ts';
import { techniques, humanTechniquePresence } from './techniques.ts';
import { controlOptions, outputOptions, proficiencyOptions, masteryNotes } from './mastery.ts';
import { recoveryOptions, antiDomainOptions, equipmentOptions } from './advanced.ts';
import { barrierOptions, domainOptions } from './domains.ts';

export const chapters = [
  { id: 'origin', name: 'Origem', hubLabel: 'ORIGEM' },
  { id: 'birth', name: 'Condições especiais', hubLabel: 'CONDIÇÃO' },
  { id: 'physical', name: 'Atributos físicos', hubLabel: 'FÍSICO' },
  { id: 'energy', name: 'Energia', hubLabel: 'ENERGIA' },
  { id: 'techniques', name: 'Técnicas amaldiçoadas', hubLabel: 'TÉCNICA' },
  { id: 'mastery', name: 'Controle, output e proficiência', hubLabel: 'USO' },
  { id: 'advanced', name: 'Recursos avançados', hubLabel: 'RECURSOS' },
  { id: 'domains', name: 'Expansão de Domínio', hubLabel: 'DOMÍNIO' },
] as const;

export interface WheelOption {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  weight: number;
  color: string;
  reference?: CharacterReference;
  notes?: string;
  sources?: ReferenceSource[];
  domain?: {
    techniqueId: string;
    relatedTechnique: string;
    manifestation: 'incomplete' | 'complete';
  };
  technique?: {
    nature: 'human' | 'cursed-spirit';
    lineage?: string;
    requiresOwnEnergy: boolean;
    practicedUse: string;
  };
  adjustment?: {
    capacity: 'enhanced' | 'extraordinary' | 'severely-limited';
    label: string;
    description: string;
  };
}

export interface WheelDefinition {
  id: string;
  chapterId: (typeof chapters)[number]['id'];
  name: string;
  description: string;
  options: WheelOption[];
  availableWhen?: { stepId: string; optionId: string };
  unavailableLabel?: string;
}

// Weights are gameplay choices, not official frequencies in Jujutsu Kaisen.
// Canon references and the deliberately limited descriptions are documented in README.md.
export const wheels: WheelDefinition[] = [
  {
    id: 'nature',
    chapterId: 'origin',
    name: 'Natureza',
    description: 'Sorteie a natureza do personagem.',
    options: [
      {
        id: 'human',
        name: 'Humano',
        shortLabel: 'HUMANO',
        weight: 45,
        color: '#91313a',
        description:
          'Ser humano. A próxima roleta define sua linhagem; esse resultado não determina uma técnica amaldiçoada.',
      },
      {
        id: 'cursed-spirit',
        name: 'Espírito amaldiçoado',
        shortLabel: 'ESPÍRITO',
        weight: 30,
        color: '#3d5663',
        description: 'Manifestação de energia amaldiçoada associada às emoções negativas humanas.',
      },
      {
        id: 'independent-cursed-corpse',
        name: 'Cadáver amaldiçoado independente',
        shortLabel: 'CADÁVER',
        weight: 17,
        color: '#4c5c52',
        description:
          'Um corpo artificial animado por energia amaldiçoada e capaz de agir de forma independente. Panda é um exemplo dessa existência na obra.',
      },
      {
        id: 'simurian',
        name: 'Simuriano',
        shortLabel: 'SIMURIANO',
        weight: 8,
        color: '#6e3d3f',
        description:
          'Integrante do povo extraterrestre apresentado em Jujutsu Kaisen Modulo. Não define habilidades específicas.',
      },
    ],
  },
  {
    id: 'lineage',
    chapterId: 'origin',
    name: 'Linhagem',
    description: 'Sorteie a linhagem do personagem humano.',
    availableWhen: { stepId: 'nature', optionId: 'human' },
    unavailableLabel: 'Exclusiva para humanos',
    options: [
      {
        id: 'no-known-clan',
        name: 'Sem clã conhecido',
        shortLabel: 'SEM CLÃ',
        weight: 40,
        color: '#91313a',
        description:
          'Nenhuma ligação com os clãs listados foi estabelecida nesta criação. Isso não define seu potencial nem determina se você possui uma técnica.',
      },
      {
        id: 'gojo',
        name: 'Clã Gojo',
        shortLabel: 'GOJO',
        weight: 15,
        color: '#66584e',
        description:
          'Sua linhagem está ligada ao clã Gojo, uma das três grandes famílias do jujutsu. Esse vínculo não garante o Ilimitado ou os Seis Olhos.',
      },
      {
        id: 'zenin',
        name: 'Clã Zen’in',
        shortLabel: 'ZEN’IN',
        weight: 18,
        color: '#3d5663',
        description:
          'Sua linhagem está ligada ao clã Zen’in, uma das três grandes famílias do jujutsu. Pertencer ao clã não determina sua técnica amaldiçoada.',
      },
      {
        id: 'kamo',
        name: 'Clã Kamo',
        shortLabel: 'KAMO',
        weight: 17,
        color: '#4c5c52',
        description:
          'Sua linhagem está ligada ao clã Kamo, uma das três grandes famílias do jujutsu. Essa origem não concede automaticamente uma técnica hereditária.',
      },
      {
        id: 'inumaki',
        name: 'Família Inumaki',
        shortLabel: 'INUMAKI',
        weight: 10,
        color: '#6e3d3f',
        description:
          'Sua origem está ligada à família Inumaki, associada à técnica da Fala Amaldiçoada. A linhagem, sozinha, não atribui essa técnica ao personagem.',
      },
    ],
  },
  {
    id: 'birth-condition',
    chapterId: 'birth',
    name: 'Condição especial',
    description: 'Sorteie a condição de nascimento do personagem humano.',
    availableWhen: { stepId: 'nature', optionId: 'human' },
    unavailableLabel: 'Exclusiva para humanos',
    options: birthOptions,
  },
  {
    id: 'strength',
    chapterId: 'physical',
    name: 'Força física',
    description: 'Sorteie a referência de força em combate corpo a corpo.',
    options: [
      {
        id: 'megumi',
        reference: physicalReferences['strength.megumi'],
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 21,
        color: '#91313a',
        description:
          'Força de um feiticeiro treinado para bloquear, golpear e disputar o corpo a corpo. Megumi enfrenta Kamo assim, mas combina o físico com shikigamis e estratégia. A referência é essa capacidade de troca, sem copiar a força das invocações.',
      },
      {
        id: 'panda',
        reference: physicalReferences['strength.panda'],
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 19,
        color: '#3d5663',
        description:
          'Força de contato para pressionar a guarda, conter investidas e responder com golpes diretos. Panda leva esse tipo de disputa ao combate com Mechamaru. A referência não soma suas formas nem concede o modo gorila.',
      },
      {
        id: 'maki-goodwill',
        reference: physicalReferences['strength.maki-goodwill'],
        name: 'Maki Zen’in',
        shortLabel: 'MAKI',
        weight: 18,
        color: '#4c5c52',
        description:
          'Força para controlar uma arma, disputar a guarda e desarmar no combate próximo. Maki impõe essa pressão a Miwa no Intercâmbio. O resultado representa o esforço corporal, sem conceder a arma ou copiar seu dano.',
      },
      {
        id: 'todo',
        reference: physicalReferences['strength.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 17,
        color: '#66584e',
        description:
          'Golpes pesados e força para manter pressão numa disputa corpo a corpo. Todo exige que Yuji se defenda e ajuste sua forma de lutar durante o Intercâmbio. A comparação não concede seu reforço de energia ou Boogie Woogie.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['strength.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 15,
        color: '#2e424f',
        description:
          'Força para responder com socos e investidas mesmo numa troca física intensa. Yuji consegue enfrentar Todo corpo a corpo, embora ainda precise corrigir sua execução. O resultado não reproduz Black Flash, Punho Divergente ou poderes de Sukuna.',
      },
      {
        id: 'toji',
        reference: physicalReferences['strength.toji'],
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 10,
        color: '#6e3d3f',
        description:
          'Força bruta para impor pressão a curta distância e aplicar golpes vigorosos com uma arma. Toji reanimado demonstra isso ao atacar Dagon em Shibuya. O dano da Nuvem Brincalhona não é convertido em força desarmada, e a arma não é concedida.',
      },
    ],
  },
  {
    id: 'speed',
    chapterId: 'physical',
    name: 'Velocidade',
    description: 'Sorteie a referência de deslocamento e reação corporal.',
    options: [
      {
        id: 'megumi',
        reference: physicalReferences['speed.megumi'],
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 26,
        color: '#91313a',
        description:
          'Mobilidade para ajustar a distância, reagir a golpes e recuar sem abandonar a defesa. Megumi troca ataques com Kamo e tenta escapar de Hanami com o grupo. Isso não garante superar esses adversários em velocidade nem inclui transporte por shikigamis.',
      },
      {
        id: 'maki-goodwill',
        reference: physicalReferences['speed.maki-goodwill'],
        name: 'Maki Zen’in',
        shortLabel: 'MAKI',
        weight: 23,
        color: '#3d5663',
        description:
          'Agilidade para encurtar a distância e agir antes que uma abertura se feche. Maki usa movimentação e reação para pressionar Miwa no Intercâmbio. A referência não separa completamente o movimento da habilidade com armas e não inclui sua evolução posterior.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['speed.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 20,
        color: '#4c5c52',
        description:
          'Movimentação para alternar aproximações, esquivas e ataques sem interromper a troca. Yuji acompanha o ritmo do confronto com Todo durante o Intercâmbio. Os saltos de posição provocados por Boogie Woogie não contam como deslocamento do corpo.',
      },
      {
        id: 'todo',
        reference: physicalReferences['speed.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 18,
        color: '#66584e',
        description:
          'Reação para acompanhar os ataques de Yuji e ajustar a posição entre golpes. Todo mantém a troca enquanto observa e corrige o adversário. Isso representa resposta corporal, sem copiar a troca instantânea de posições de Boogie Woogie.',
      },
      {
        id: 'toji',
        reference: physicalReferences['speed.toji'],
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 13,
        color: '#6e3d3f',
        description:
          'Arrancadas e mudanças de posição que deixam pouco tempo para o adversário reagir. Toji reanimado pressiona Megumi com suas investidas em Shibuya. É uma referência de movimento corporal, sem teletransporte ou concessão de Restrição Celestial.',
      },
    ],
  },
  {
    id: 'endurance',
    chapterId: 'physical',
    name: 'Resistência',
    description: 'Sorteie a referência de resistência a impactos e esforço físico.',
    options: [
      {
        id: 'megumi',
        reference: physicalReferences['endurance.megumi'],
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 26,
        color: '#91313a',
        description:
          'Fôlego para continuar se movendo, defendendo e buscando uma resposta sob desgaste. Megumi ainda participa do confronto com Hanami, mas é levado ao limite. A referência não permite absorver os golpes da maldição sem consequências.',
      },
      {
        id: 'panda',
        reference: physicalReferences['endurance.panda'],
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 22,
        color: '#3d5663',
        description:
          'Capacidade de retomar a luta depois de impactos e manter o esforço sob pressão. Panda continua enfrentando Mechamaru após ser atingido. Seus núcleos influenciam essa continuidade; a comparação não concede núcleos extras, reparação ou regeneração.',
      },
      {
        id: 'todo',
        reference: physicalReferences['endurance.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 20,
        color: '#4c5c52',
        description:
          'Fôlego para manter ataques, defesas e movimentação durante uma luta intensa. Todo sustenta a ação ao lado de Yuji contra Hanami. Sua técnica e a cooperação reduzem a exposição aos golpes; isso não equivale a aguentar todos eles no corpo.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['endurance.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 18,
        color: '#66584e',
        description:
          'Capacidade de seguir trocando golpes e partir para novas investidas mesmo sob desgaste. Yuji continua no confronto com Todo e depois enfrenta Hanami. O resultado não inclui cura de Sukuna, regeneração ou resistência automática a técnicas.',
      },
      {
        id: 'hanami',
        reference: physicalReferences['endurance.hanami'],
        name: 'Hanami',
        shortLabel: 'HANAMI',
        weight: 14,
        color: '#6e3d3f',
        description:
          'Resistência para permanecer em combate após ofensivas sucessivas. Hanami enfrenta Megumi e Maki e depois continua contra Yuji e Todo. A cena envolve um corpo de maldição; o jogo usa sua persistência como referência, sem conceder regeneração ou imunidade.',
      },
    ],
  },
  {
    id: 'energy-reserve',
    chapterId: 'energy',
    name: 'Reserva de energia amaldiçoada',
    description: 'Sorteie a quantidade de energia disponível, sem definir controle ou output.',
    options: energyOptions.map((option) => ({ ...option, notes: energyNotes })),
  },
  {
    id: 'technique-presence',
    chapterId: 'techniques',
    name: 'Possui técnica inata?',
    description:
      'Sorteie a presença de uma técnica. A linhagem não garante uma técnica hereditária.',
    options: humanTechniquePresence,
  },
  {
    id: 'innate-technique',
    chapterId: 'techniques',
    name: 'Técnica inata',
    description: 'Sorteie uma técnica entre as opções compatíveis com este personagem.',
    availableWhen: { stepId: 'technique-presence', optionId: 'yes' },
    unavailableLabel: 'Sem técnica sorteada',
    options: techniques,
  },
  {
    id: 'energy-control',
    chapterId: 'mastery',
    name: 'Controle de energia amaldiçoada',
    description: 'Sorteie a precisão com que o personagem regula seu fluxo de energia.',
    options: controlOptions.map((option) => ({ ...option, notes: masteryNotes })),
  },
  {
    id: 'energy-output',
    chapterId: 'mastery',
    name: 'Output de energia',
    description: 'Sorteie quanta energia pode liberar de uma vez, sem aumentar sua reserva.',
    options: outputOptions.map((option) => ({ ...option, notes: masteryNotes })),
  },
  {
    id: 'technique-proficiency',
    chapterId: 'mastery',
    name: 'Proficiência na técnica inata',
    description: 'Sorteie o domínio das aplicações compatíveis da técnica recebida.',
    availableWhen: { stepId: 'technique-presence', optionId: 'yes' },
    unavailableLabel: 'Não se aplica — sem técnica inata',
    options: proficiencyOptions.map((option) => ({ ...option, notes: masteryNotes })),
  },
  {
    id: 'recovery',
    chapterId: 'advanced',
    name: 'Técnica Reversa (RCT)',
    description:
      'Sorteie o aprendizado de cura por energia positiva. Não é Reversão da Técnica Amaldiçoada.',
    options: recoveryOptions,
  },
  {
    id: 'anti-domain',
    chapterId: 'advanced',
    name: 'Defesa ant domínio',
    description: 'Sorteie um recurso defensivo aprendido, sem receber Expansão de Domínio.',
    options: antiDomainOptions,
  },
  {
    id: 'equipment',
    chapterId: 'advanced',
    name: 'Equipamento',
    description:
      'Sorteie o equipamento disponível. Posse, empunhadura, domínio e efeitos são avaliados separadamente.',
    options: equipmentOptions,
  },
  {
    id: 'barrier-knowledge',
    chapterId: 'domains',
    name: 'Conhecimento de barreiras',
    description:
      'Sorteie sua formação em barreiras. Conhecimento não concede uma expansão ou defesa especializada.',
    options: barrierOptions,
  },
  {
    id: 'domain-expansion',
    chapterId: 'domains',
    name: 'Expansão de Domínio',
    description:
      'Sorteie o acesso à expansão documentada da sua técnica: 65% sem manifestação, 35% com acesso. A execução depende dos seus recursos.',
    options: domainOptions,
  },
];

export function isWheelAvailable(wheel: WheelDefinition, results: Record<string, string>): boolean {
  return (
    !wheel.availableWhen || results[wheel.availableWhen.stepId] === wheel.availableWhen.optionId
  );
}

export function getWheelProgress(
  wheel: WheelDefinition,
  results: Record<string, string>,
  available?: (entry: WheelDefinition) => boolean,
) {
  const chapterIndex = chapters.findIndex(({ id }) => id === wheel.chapterId);
  const chapterWheels = wheels.filter(
    (entry) =>
      entry.chapterId === wheel.chapterId &&
      (!available || available(entry)) &&
      (!entry.availableWhen ||
        !results[entry.availableWhen.stepId] ||
        isWheelAvailable(entry, results)),
  );
  return {
    chapter: chapters[chapterIndex],
    chapterNumber: chapterIndex + 1,
    stepNumber: chapterWheels.findIndex(({ id }) => id === wheel.id) + 1,
    totalSteps: chapterWheels.length,
  };
}

export function getOption(stepId: string, optionId?: string): WheelOption | undefined {
  return wheels
    .find((wheel) => wheel.id === stepId)
    ?.options.find((option) => option.id === optionId);
}
