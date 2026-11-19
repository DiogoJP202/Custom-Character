export const chapters = [
  { id: 'origin', name: 'Origem', hubLabel: 'ORIGEM', symbols: ['起', '源'] },
  { id: 'physical', name: 'Atributos Físicos', hubLabel: 'FÍSICO', symbols: ['身', '体'] },
] as const;

export interface WheelOption {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  weight: number;
  color: string;
}

export interface WheelDefinition {
  id: string;
  chapterId: (typeof chapters)[number]['id'];
  name: string;
  title: string;
  titleAccent: string;
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
    title: 'Qual é a sua',
    titleAccent: 'natureza?',
    description: 'Toda história tem uma origem. Descubra a sua.',
    options: [
      {
        id: 'human',
        name: 'Humano',
        shortLabel: 'HUMANO',
        weight: 70,
        color: '#65558f',
        description:
          'Você é humano. Sua origem familiar será revelada na próxima roleta; sua natureza, por si só, não determina uma técnica amaldiçoada.',
      },
      {
        id: 'cursed-spirit',
        name: 'Espírito amaldiçoado',
        shortLabel: 'ESPÍRITO',
        weight: 20,
        color: '#355e5e',
        description:
          'Uma existência formada por energia amaldiçoada, associada às emoções negativas humanas. Sua origem começa do outro lado do mundo das maldições.',
      },
      {
        id: 'independent-cursed-corpse',
        name: 'Cadáver amaldiçoado independente',
        shortLabel: 'CADÁVER',
        weight: 8,
        color: '#87665e',
        description:
          'Um corpo artificial animado por energia amaldiçoada e capaz de agir de forma independente. Panda é um exemplo dessa existência na obra.',
      },
      {
        id: 'simurian',
        name: 'Simuriano',
        shortLabel: 'SIMURIANO',
        weight: 2,
        color: '#a58c56',
        description:
          'Você pertence ao povo extraterrestre apresentado em Jujutsu Kaisen Modulo. Essa natureza não concede automaticamente habilidades específicas nesta criação.',
      },
    ],
  },
  {
    id: 'lineage',
    chapterId: 'origin',
    name: 'Linhagem',
    title: 'De onde',
    titleAccent: 'você vem?',
    description: 'Alguns nomes carregam uma história. Outros começam a própria.',
    availableWhen: { stepId: 'nature', optionId: 'human' },
    unavailableLabel: 'Exclusiva para humanos',
    options: [
      {
        id: 'no-known-clan',
        name: 'Sem clã conhecido',
        shortLabel: 'SEM CLÃ',
        weight: 70,
        color: '#65558f',
        description:
          'Nenhuma ligação com os clãs listados foi estabelecida nesta criação. Isso não define seu potencial nem determina se você possui uma técnica.',
      },
      {
        id: 'gojo',
        name: 'Clã Gojo',
        shortLabel: 'GOJO',
        weight: 5,
        color: '#476c80',
        description:
          'Sua linhagem está ligada ao clã Gojo, uma das três grandes famílias do jujutsu. Esse vínculo não garante o Ilimitado ou os Seis Olhos.',
      },
      {
        id: 'zenin',
        name: 'Clã Zen’in',
        shortLabel: 'ZEN’IN',
        weight: 10,
        color: '#355e5e',
        description:
          'Sua linhagem está ligada ao clã Zen’in, uma das três grandes famílias do jujutsu. Pertencer ao clã não determina sua técnica amaldiçoada.',
      },
      {
        id: 'kamo',
        name: 'Clã Kamo',
        shortLabel: 'KAMO',
        weight: 10,
        color: '#87665e',
        description:
          'Sua linhagem está ligada ao clã Kamo, uma das três grandes famílias do jujutsu. Essa origem não concede automaticamente uma técnica hereditária.',
      },
      {
        id: 'inumaki',
        name: 'Família Inumaki',
        shortLabel: 'INUMAKI',
        weight: 5,
        color: '#a58c56',
        description:
          'Sua origem está ligada à família Inumaki, associada à técnica da Fala Amaldiçoada. A linhagem, sozinha, não atribui essa técnica ao personagem.',
      },
    ],
  },
  {
    id: 'strength',
    chapterId: 'physical',
    name: 'Força física',
    title: 'Qual é a sua',
    titleAccent: 'força?',
    description: 'Descubra sua referência de força no combate corpo a corpo.',
    options: [
      {
        id: 'megumi',
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 30,
        color: '#65558f',
        description:
          'Força inspirada no combate corporal de Megumi durante o Intercâmbio. A referência considera seus movimentos físicos, sem conceder shikigamis.',
      },
      {
        id: 'panda',
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 25,
        color: '#355e5e',
        description:
          'Força inspirada nos golpes de Panda contra Mechamaru, no Intercâmbio. É uma referência de impacto físico, sem conceder seus núcleos ou formas.',
      },
      {
        id: 'maki-goodwill',
        name: 'Maki Zen’in (Intercâmbio)',
        shortLabel: 'MAKI',
        weight: 20,
        color: '#87665e',
        description:
          'Força inspirada em Maki no arco do Intercâmbio, quando enfrenta Miwa e participa do combate a Hanami. Não representa sua versão posterior no mangá.',
      },
      {
        id: 'todo',
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 15,
        color: '#476c80',
        description:
          'Força inspirada no combate corpo a corpo de Todo durante o Intercâmbio. A comparação é física e não inclui a troca de posições de sua técnica.',
      },
      {
        id: 'yuji-goodwill',
        name: 'Yuji Itadori (Intercâmbio)',
        shortLabel: 'YUJI',
        weight: 8,
        color: '#82607c',
        description:
          'Força inspirada na capacidade corporal de Yuji durante o Intercâmbio. O resultado não concede o Black Flash nem qualquer poder de Sukuna.',
      },
      {
        id: 'toji',
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 2,
        color: '#a58c56',
        description:
          'Força inspirada nos movimentos de Toji em seu confronto com Dagon, em Shibuya. Uma referência física rara no jogo, sem conceder armas ou Restrição Celestial.',
      },
    ],
  },
  {
    id: 'speed',
    chapterId: 'physical',
    name: 'Velocidade',
    title: 'Qual é o seu',
    titleAccent: 'ritmo?',
    description: 'Descubra sua referência de deslocamento e reação em combate.',
    options: [
      {
        id: 'megumi',
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 35,
        color: '#65558f',
        description:
          'Mobilidade inspirada nas esquivas e nos deslocamentos de Megumi no Intercâmbio. A referência não inclui transporte ou auxílio de shikigamis.',
      },
      {
        id: 'maki-goodwill',
        name: 'Maki Zen’in (Intercâmbio)',
        shortLabel: 'MAKI',
        weight: 30,
        color: '#355e5e',
        description:
          'Agilidade inspirada em Maki durante o Intercâmbio, especialmente no combate a Miwa. Considera essa fase da personagem, sem importar sua evolução posterior.',
      },
      {
        id: 'yuji-goodwill',
        name: 'Yuji Itadori (Intercâmbio)',
        shortLabel: 'YUJI',
        weight: 20,
        color: '#87665e',
        description:
          'Velocidade inspirada nas investidas e reações físicas de Yuji no Intercâmbio. Não envolve troca de posições, teletransporte ou poderes de Sukuna.',
      },
      {
        id: 'todo',
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 10,
        color: '#476c80',
        description:
          'Reação inspirada na movimentação corporal de Todo durante o Intercâmbio. Sua técnica de troca de posições fica fora desta comparação.',
      },
      {
        id: 'toji',
        name: 'Toji Fushiguro',
        shortLabel: 'TOJI',
        weight: 5,
        color: '#a58c56',
        description:
          'Velocidade inspirada na pressão física de Toji ao enfrentar Megumi em Shibuya. É uma comparação de desempenho, sem atribuir a origem de suas capacidades.',
      },
    ],
  },
  {
    id: 'endurance',
    chapterId: 'physical',
    name: 'Resistência',
    title: 'Quanto você',
    titleAccent: 'aguenta?',
    description: 'Descubra sua referência para suportar impactos e esforço físico.',
    options: [
      {
        id: 'megumi',
        name: 'Megumi Fushiguro',
        shortLabel: 'MEGUMI',
        weight: 35,
        color: '#65558f',
        description:
          'Resistência inspirada no esforço de Megumi durante o confronto com Hanami, no Intercâmbio. A comparação não concede proteção de shikigamis.',
      },
      {
        id: 'panda',
        name: 'Panda',
        shortLabel: 'PANDA',
        weight: 25,
        color: '#355e5e',
        description:
          'Resistência inspirada no confronto de Panda com Mechamaru. O resultado abstrai sua capacidade de suportar o combate, sem criar núcleos extras ou mudar sua natureza.',
      },
      {
        id: 'todo',
        name: 'Aoi Todo',
        shortLabel: 'TODO',
        weight: 20,
        color: '#87665e',
        description:
          'Resistência inspirada na participação de Todo no combate a Hanami. É uma referência para manter o esforço físico, sem conceder técnicas.',
      },
      {
        id: 'yuji-goodwill',
        name: 'Yuji Itadori (Intercâmbio)',
        shortLabel: 'YUJI',
        weight: 15,
        color: '#476c80',
        description:
          'Resistência inspirada no esforço contínuo de Yuji durante o Intercâmbio. Não inclui cura, regeneração ou intervenção de Sukuna.',
      },
      {
        id: 'hanami',
        name: 'Hanami',
        shortLabel: 'HANAMI',
        weight: 5,
        color: '#a58c56',
        description:
          'Resistência inspirada no confronto de Hanami com os alunos durante o Intercâmbio. O resultado não concede corpo de maldição, regeneração ou técnicas de Hanami.',
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
