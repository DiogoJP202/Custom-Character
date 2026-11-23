import type { WheelOption } from './wheels.ts';

const episode = (number: number) => ({
  label: `Anime · Episódio ${number}`,
  url: `https://jujutsukaisen.jp/episodes/${String(number).padStart(2, '0')}.php`,
});
const chapters = (label: string) => ({
  label: `Mangá · ${label} (catálogo oficial)`,
  url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen',
});

export const domainNotes =
  'Probabilidades, formação e capacidade efetiva são abstrações qualitativas do jogo. Acesso não transfere a perícia do personagem de referência. As fontes indicam cenas e capítulos oficiais; as sinopses não detalham todas as regras. Os nomes em português podem variar entre traduções.';

export const barrierOptions: WheelOption[] = [
  {
    id: 'untrained',
    name: 'Sem treinamento específico',
    shortLabel: 'SEM TREINO',
    weight: 25,
    color: '#3d5663',
    description:
      'Não recebeu formação específica em barreiras. Manipular energia ou possuir uma técnica não substitui esse conhecimento.',
  },
  {
    id: 'notions',
    name: 'Noções de barreiras',
    shortLabel: 'NOÇÕES',
    weight: 35,
    color: '#66584e',
    description:
      'Reconhece a função de delimitar um espaço e impor condições. Ainda não há execução independente confiável de uma barreira.',
  },
  {
    id: 'basic',
    name: 'Formação básica',
    shortLabel: 'BÁSICA',
    weight: 25,
    color: '#4c5c52',
    description:
      'Possui formação para tentar aplicações básicas de delimitação, conforme treinamento e energia disponíveis. Não recebe automaticamente uma Cortina com condições especiais.',
  },
  {
    id: 'advanced',
    name: 'Conhecimento avançado',
    shortLabel: 'AVANÇADO',
    weight: 15,
    color: '#91313a',
    description:
      'Compreende melhor a delimitação de espaços e as condições de barreiras. Esse conhecimento ajuda a execução, mas não concede perícia de Tengen, Domínio Simples ou uma Expansão de Domínio.',
  },
].map((option) => ({
  ...option,
  notes: `${domainNotes} Formação em barreiras e controle de energia são atributos distintos. Esta escala não garante resistência ou condições específicas de uma barreira.`,
  sources: [episode(58)],
}));

// Exactly one positive entry is eligible per technique. Filtering precedes normalization (65/35).
// These are the documented manifestations, never upgrade tiers created by the game.
export const domainOptions: WheelOption[] = [
  {
    id: 'none',
    name: 'Não consegue manifestar uma expansão',
    shortLabel: 'NÃO MANIFESTA',
    weight: 65,
    color: '#3d5663',
    description:
      'Nenhuma Expansão de Domínio foi desenvolvida nesta criação. Sua técnica, conhecimentos de barreira, recursos defensivos e equipamento continuam registrados.',
    notes: domainNotes,
  },
  {
    id: 'chimera-shadow-garden',
    name: 'Jardim da Sombra Quimérica',
    shortLabel: 'MANIFESTA',
    weight: 35,
    color: '#91313a',
    domain: {
      techniqueId: 'ten-shadows',
      relatedTechnique: 'Técnica das Dez Sombras',
      manifestation: 'incomplete',
    },
    description:
      'Acesso à manifestação incompleta das Dez Sombras demonstrada por Megumi: um espaço tomado por sombras que amplia as aplicações da técnica. Não cria uma barreira fechada convencional nem concede acerto garantido.',
    reference: {
      character: 'Megumi Fushiguro',
      version: 'Manifestação incompleta · confronto com Reggie',
      feats: [
        {
          description:
            'Usa o espaço de um ginásio como suporte para manifestar seu domínio incompleto contra Reggie.',
          context:
            'Megumi aproveita um recinto existente porque não completa sozinho uma barreira fechada. O ambiente continua sendo uma condição relevante, não um detalhe dispensável.',
          source: episode(58),
        },
        {
          description:
            'Manifesta pela primeira vez um domínio incompleto contra um portador de dedo.',
          context:
            'A manifestação aumenta as possibilidades das sombras, sem estabelecer uma versão completa da expansão.',
          source: episode(23),
        },
      ],
      limitations:
        'Manifestação sempre incompleta neste catálogo. Não possui acerto garantido convencional. Precisa de suporte espacial compatível para reproduzir a aplicação do ginásio. Não concede todos os shikigamis domesticados, Mahoraga, repertório irrestrito ou uma versão completa imaginária.',
    },
    sources: [chapters('caps. 58 e 170–172')],
    notes: domainNotes,
  },
  {
    id: 'self-embodiment-of-perfection',
    name: 'Autoencarnação da Perfeição',
    shortLabel: 'MANIFESTA',
    weight: 35,
    color: '#91313a',
    domain: {
      techniqueId: 'idle-transfiguration',
      relatedTechnique: 'Transfiguração Ociosa',
      manifestation: 'complete',
    },
    description:
      'Acesso à expansão de Mahito, que envolve os alvos na área da técnica e estabelece contato com suas almas por meio do domínio. Seu acerto garantido depende da expansão funcionando; não concede controle absoluto sobre qualquer alma.',
    reference: {
      character: 'Mahito',
      version: 'Primeira temporada · confronto com Nanami e Yuji',
      feats: [
        {
          description:
            'Aprisiona Nanami em seu domínio, colocando-o sob o alcance da Transfiguração Ociosa.',
          context:
            'A entrada de Yuji implica contato com a alma de Sukuna e expõe uma interação perigosa para Mahito. A cena não sustenta uma vitória automática contra qualquer alvo.',
          source: episode(13),
        },
      ],
      limitations:
        'Requer manifestação e manutenção efetivas da expansão. Interações entre almas, resistência à técnica e defesas continuam relevantes. Não concede onipotência sobre almas, imunidade a interferências ou a execução de 0,2 segundo demonstrada posteriormente.',
    },
    sources: [chapters('caps. 29–30')],
    notes: domainNotes,
  },
  {
    id: 'coffin-of-the-iron-mountain',
    name: 'Caixão da Montanha de Ferro',
    shortLabel: 'MANIFESTA',
    weight: 35,
    color: '#91313a',
    domain: {
      techniqueId: 'jogo-flames',
      relatedTechnique: 'Chamas de Jogo',
      manifestation: 'complete',
    },
    description:
      'Acesso à expansão de Jogo, com um interior vulcânico e a técnica imbuída no domínio. O acerto garantido pertence às condições da expansão ativa; ataques de fogo fora dela não passam a acertar automaticamente.',
    reference: {
      character: 'Jogo',
      version: 'Primeira temporada · confronto com Gojo',
      feats: [
        {
          description:
            'Envolve Gojo e Yuji em um ambiente vulcânico durante sua Expansão de Domínio.',
          context:
            'O confronto demonstra o ambiente da expansão e suas regras; a potência de Jogo e a resposta de Gojo não são transferidas ao personagem criado.',
          source: episode(7),
        },
      ],
      limitations:
        'A expansão precisa ser executada e sustentada. Não aumenta a reserva, output ou resistência recebidos, não garante a temperatura ou potência total de Jogo e não concede vitória contra qualquer defesa. Acerto garantido não equivale a dano inevitável ou ilimitado.',
    },
    sources: [chapters('caps. 15–16')],
    notes: domainNotes,
  },
];
