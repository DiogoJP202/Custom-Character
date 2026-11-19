import type { WheelOption } from './wheels.ts';

const characters = {
  label: 'Anime · perfis oficiais de Maki e Mechamaru',
  url: 'https://jujutsukaisen.jp/character/index_1st.php',
};
const toji = {
  label: 'Anime · episódio 39 (Toji reanimado)',
  url: 'https://jujutsukaisen.jp/episodes/39.php',
};

// Names distinguish the canonical examples; probabilities and effective scales belong to the game.
export const birthOptions: WheelOption[] = [
  {
    id: 'none',
    name: 'Sem Restrição Celestial',
    shortLabel: 'SEM RESTRIÇÃO',
    weight: 65,
    color: '#91313a',
    description:
      'Nenhuma Restrição Celestial foi atribuída. Os atributos físicos e a reserva seguem seus sorteios normais.',
    notes: 'Não determina técnica inata, talento, controle ou grau de feiticeiro.',
  },
  {
    id: 'physical-partial',
    name: 'Restrição física parcial',
    shortLabel: 'PARCIAL',
    weight: 15,
    color: '#4c5c52',
    description:
      'Corpo ampliado e energia residual muito limitada, usando Maki antes do despertar como exemplo. Não é a condição de ausência total de energia de Toji.',
    notes:
      'No jogo, os três atributos recebem uma capacidade efetiva ampliada, limitada à referência de Maki no Intercâmbio. A reserva só pode ser Muito baixa. Essa limitação qualitativa é uma adaptação de gameplay, não uma medida oficial.',
    sources: [characters],
  },
  {
    id: 'physical-complete',
    name: 'Restrição física completa',
    shortLabel: 'COMPLETA',
    weight: 10,
    color: '#3d5663',
    description:
      'Ausência total de energia amaldiçoada própria e capacidades físicas extraordinárias, como Toji. A etapa de reserva será pulada e a ficha registrará energia ausente.',
    notes:
      'A condição prevalece sobre as referências físicas sorteadas. Recursos que exigem energia própria ficam indisponíveis. Não concede armas, treinamento, técnicas ou reanimação.',
    sources: [toji],
  },
  {
    id: 'body-limited',
    name: 'Restrição corporal — Kokichi Muta',
    shortLabel: 'CORPORAL',
    weight: 10,
    color: '#66584e',
    description:
      'Corpo extremamente debilitado, compensado por vantagens de alcance e produção de energia, como Kokichi antes da alteração de seu corpo. Os feitos de Mechamaru não são capacidades do corpo humano.',
    notes:
      'Força, locomoção e tolerância corporal ficam muito limitadas. Alcance e output favorecidos são consequências qualitativas; não concedem uma técnica ou um robô. A reserva continua sendo sorteada: alcance e produção não significam estoque infinito.',
    sources: [
      characters,
      { label: 'Anime · episódio 16', url: 'https://jujutsukaisen.jp/episodes/16.php' },
    ],
  },
];

export const energyOptions: WheelOption[] = [
  {
    id: 'very-low',
    name: 'Muito baixa',
    shortLabel: 'MUITO BAIXA',
    weight: 15,
    color: '#91313a',
    description:
      'Estoque muito limitado na escala do jogo. Há pouca energia disponível; isso não determina a precisão com que ela é usada.',
  },
  {
    id: 'common',
    name: 'Comum',
    shortLabel: 'COMUM',
    weight: 25,
    color: '#3d5663',
    description:
      'Estoque de referência da escala do jogo. Comum não é uma média oficial da população nem define aptidão para usar jujutsu.',
  },
  {
    id: 'high',
    name: 'Elevada',
    shortLabel: 'ELEVADA',
    weight: 25,
    color: '#4c5c52',
    description:
      'Estoque acima da referência comum do jogo. Mais energia disponível não garante maior potência por golpe ou melhor controle.',
  },
  {
    id: 'exceptional',
    name: 'Excepcional',
    shortLabel: 'EXCEPCIONAL',
    weight: 20,
    color: '#66584e',
    description:
      'Estoque especialmente amplo na escala do jogo. A quantidade não concede regeneração, eficiência ou uma técnica inata.',
  },
  {
    id: 'immense',
    name: 'Imensa',
    shortLabel: 'IMENSA',
    weight: 15,
    color: '#6e3d3f',
    description:
      'Um dos maiores estoques possíveis nesta escala de gameplay. Continua finito e não determina a quantidade liberada de uma só vez.',
  },
];

export const energyNotes =
  'Escala qualitativa própria do jogo. Reserva é quantidade disponível; output é produção instantânea, e controle e eficiência são outros atributos. Nenhum deles é concedido por este sorteio.';
