import { physicalReferences, type CharacterReference } from './references.ts';

export const chapters = [
  { id: 'origin', name: 'Origem', hubLabel: 'ORIGEM' },
  { id: 'physical', name: 'Atributos físicos', hubLabel: 'FÍSICO' },
] as const;

export interface WheelOption {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  weight: number;
  color: string;
  reference?: CharacterReference;
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
        weight: 70,
        color: '#91313a',
        description:
          'Ser humano. A próxima roleta define sua linhagem; esse resultado não determina uma técnica amaldiçoada.',
      },
      {
        id: 'cursed-spirit',
        name: 'Espírito amaldiçoado',
        shortLabel: 'ESPÍRITO',
        weight: 20,
        color: '#3d5663',
        description: 'Manifestação de energia amaldiçoada associada às emoções negativas humanas.',
      },
      {
        id: 'independent-cursed-corpse',
        name: 'Cadáver amaldiçoado independente',
        shortLabel: 'CADÁVER',
        weight: 8,
        color: '#4c5c52',
        description:
          'Um corpo artificial animado por energia amaldiçoada e capaz de agir de forma independente. Panda é um exemplo dessa existência na obra.',
      },
      {
        id: 'simurian',
        name: 'Simuriano',
        shortLabel: 'SIMURIANO',
        weight: 2,
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
        weight: 70,
        color: '#91313a',
        description:
          'Nenhuma ligação com os clãs listados foi estabelecida nesta criação. Isso não define seu potencial nem determina se você possui uma técnica.',
      },
      {
        id: 'gojo',
        name: 'Clã Gojo',
        shortLabel: 'GOJO',
        weight: 5,
        color: '#66584e',
        description:
          'Sua linhagem está ligada ao clã Gojo, uma das três grandes famílias do jujutsu. Esse vínculo não garante o Ilimitado ou os Seis Olhos.',
      },
      {
        id: 'zenin',
        name: 'Clã Zen’in',
        shortLabel: 'ZEN’IN',
        weight: 10,
        color: '#3d5663',
        description:
          'Sua linhagem está ligada ao clã Zen’in, uma das três grandes famílias do jujutsu. Pertencer ao clã não determina sua técnica amaldiçoada.',
      },
      {
        id: 'kamo',
        name: 'Clã Kamo',
        shortLabel: 'KAMO',
        weight: 10,
        color: '#4c5c52',
        description:
          'Sua linhagem está ligada ao clã Kamo, uma das três grandes famílias do jujutsu. Essa origem não concede automaticamente uma técnica hereditária.',
      },
      {
        id: 'inumaki',
        name: 'Família Inumaki',
        shortLabel: 'INUMAKI',
        weight: 5,
        color: '#6e3d3f',
        description:
          'Sua origem está ligada à família Inumaki, associada à técnica da Fala Amaldiçoada. A linhagem, sozinha, não atribui essa técnica ao personagem.',
      },
    ],
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
        weight: 30,
        color: '#91313a',
        description:
          'Força para disputar bloqueios e contra-ataques em combate próximo, tomando Megumi no Intercâmbio como referência. Não equivale à força de seus shikigamis nem à de Hanami.',
      },
      {
        id: 'panda',
        reference: physicalReferences['strength.panda'],
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 25,
        color: '#3d5663',
        description:
          'Força de contato para pressionar a guarda e desferir golpes diretos, com Panda contra Mechamaru como referência. Suas diferentes formas não são somadas em um único atributo.',
      },
      {
        id: 'maki-goodwill',
        reference: physicalReferences['strength.maki-goodwill'],
        name: 'Maki Zen’in',
        shortLabel: 'MAKI',
        weight: 20,
        color: '#4c5c52',
        description:
          'Força para controlar uma arma e sustentar a pressão em combate próximo, como Maki no Intercâmbio. O dano da ferramenta não é transferido para o corpo.',
      },
      {
        id: 'todo',
        reference: physicalReferences['strength.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 15,
        color: '#66584e',
        description:
          'Força para manter uma troca de golpes intensa e pressionar um adversário a curta distância, tomando Todo no Intercâmbio como referência. Não inclui as trocas de posição de sua técnica.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['strength.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 8,
        color: '#2e424f',
        description:
          'Força aplicada em socos, bloqueios e investidas sucessivas, com Yuji no Intercâmbio como referência. Não reproduz a potência de Black Flash ou Punho Divergente.',
      },
      {
        id: 'toji',
        reference: physicalReferences['strength.toji'],
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 2,
        color: '#6e3d3f',
        description:
          'Força para impor pressão em combate próximo e manejar uma arma com firmeza, tomando Toji em Shibuya como referência. Não é uma cópia do dano causado por sua ferramenta amaldiçoada.',
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
        weight: 35,
        color: '#91313a',
        description:
          'Mobilidade para ajustar a distância, reagir e recuar durante uma troca de ataques, com Megumi no Intercâmbio como referência. Não inclui deslocamento com shikigamis.',
      },
      {
        id: 'maki-goodwill',
        reference: physicalReferences['speed.maki-goodwill'],
        name: 'Maki Zen’in',
        shortLabel: 'MAKI',
        weight: 30,
        color: '#3d5663',
        description:
          'Agilidade para encurtar a distância e agir durante a abertura de um adversário, tomando o duelo de Maki com Miwa como referência. Considera apenas sua fase do Intercâmbio.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['speed.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 20,
        color: '#4c5c52',
        description:
          'Movimentação para alternar aproximações, esquivas e ataques em sequência, com Yuji no Intercâmbio como referência. Não inclui o reposicionamento provocado por Todo.',
      },
      {
        id: 'todo',
        reference: physicalReferences['speed.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 10,
        color: '#66584e',
        description:
          'Tempo de resposta para acompanhar uma troca corpo a corpo e ajustar a posição entre golpes, tomando Todo como referência. A troca instantânea de posições é uma técnica, não velocidade corporal.',
      },
      {
        id: 'toji',
        reference: physicalReferences['speed.toji'],
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 5,
        color: '#6e3d3f',
        description:
          'Deslocamento e reação para pressionar um adversário com aproximações rápidas, tomando Toji contra Megumi como referência. Não equivale a teletransporte.',
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
        weight: 35,
        color: '#91313a',
        description:
          'Capacidade de manter ações sob pressão e esforço em um combate difícil, com Megumi no Intercâmbio como referência. Ele é levado ao limite contra Hanami; isso não significa ignorar seus golpes.',
      },
      {
        id: 'panda',
        reference: physicalReferences['endurance.panda'],
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 25,
        color: '#3d5663',
        description:
          'Capacidade de continuar lutando após impactos e pressão prolongada, tomando Panda contra Mechamaru como referência. A estrutura de seus núcleos não é transferida ao personagem.',
      },
      {
        id: 'todo',
        reference: physicalReferences['endurance.todo'],
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 20,
        color: '#4c5c52',
        description:
          'Capacidade de sustentar o esforço e manter a participação em uma luta intensa, tomando Todo contra Hanami como referência. Não significa receber todos os ataques sem dano.',
      },
      {
        id: 'yuji-goodwill',
        reference: physicalReferences['endurance.yuji-goodwill'],
        name: 'Yuji Itadori',
        shortLabel: 'YUJI',
        weight: 15,
        color: '#66584e',
        description:
          'Capacidade de manter trocas e ataques sucessivos mesmo sob desgaste, com Yuji no Intercâmbio como referência. Não inclui cura ou intervenção de Sukuna.',
      },
      {
        id: 'hanami',
        reference: physicalReferences['endurance.hanami'],
        name: 'Hanami',
        shortLabel: 'HANAMI',
        weight: 5,
        color: '#6e3d3f',
        description:
          'Resistência a impactos inspirada em Hanami, que continua lutando contra sucessivos grupos no Intercâmbio. É uma abstração da cena, sem copiar sua regeneração ou natureza de maldição.',
      },
    ],
  },
];

export function isWheelAvailable(wheel: WheelDefinition, results: Record<string, string>): boolean {
  return (
    !wheel.availableWhen || results[wheel.availableWhen.stepId] === wheel.availableWhen.optionId
  );
}

export function getWheelProgress(wheel: WheelDefinition, results: Record<string, string>) {
  const chapterIndex = chapters.findIndex(({ id }) => id === wheel.chapterId);
  const chapterWheels = wheels.filter(
    (entry) =>
      entry.chapterId === wheel.chapterId &&
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
