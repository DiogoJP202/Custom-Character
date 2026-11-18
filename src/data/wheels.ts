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
  name: string;
  title: string;
  titleAccent: string;
  description: string;
  options: WheelOption[];
  availableWhen?: { stepId: string; optionId: string };
}

// Weights are gameplay choices, not official frequencies in Jujutsu Kaisen.
// Canon references and the deliberately limited descriptions are documented in README.md.
export const wheels: WheelDefinition[] = [
  {
    id: 'nature',
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
        shortLabel: '04',
        weight: 2,
        color: '#a58c56',
        description:
          'Você pertence ao povo extraterrestre apresentado em Jujutsu Kaisen Modulo. Essa natureza não concede automaticamente habilidades específicas nesta criação.',
      },
    ],
  },
  {
    id: 'lineage',
    name: 'Linhagem',
    title: 'De onde',
    titleAccent: 'você vem?',
    description: 'Alguns nomes carregam uma história. Outros começam a própria.',
    availableWhen: { stepId: 'nature', optionId: 'human' },
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
];

export function getOption(stepId: string, optionId?: string): WheelOption | undefined {
  return wheels
    .find((wheel) => wheel.id === stepId)
    ?.options.find((option) => option.id === optionId);
}
