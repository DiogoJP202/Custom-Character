import type { WheelOption } from './wheels.ts';
import type { CharacterReference } from './references.ts';

export const masteryNotes =
  'Escalas qualitativas de gameplay. Controle é precisão do fluxo; output é liberação de energia de uma vez; proficiência é domínio das aplicações acessíveis da técnica. Nenhum resultado aumenta a reserva ou concede poderes adicionais.';

export const controlOptions: WheelOption[] = [
  {
    id: 'poor',
    name: 'Precário',
    shortLabel: 'PRECÁRIO',
    weight: 15,
    color: '#91313a',
    description:
      'O fluxo é instável: regular a energia e repetir uma aplicação com precisão ainda é difícil.',
  },
  {
    id: 'basic',
    name: 'Básico',
    shortLabel: 'BÁSICO',
    weight: 25,
    color: '#3d5663',
    description:
      'Consegue regular fluxos simples, mas ajustes rápidos ou precisos ainda são inconsistentes.',
  },
  {
    id: 'good',
    name: 'Bom',
    shortLabel: 'BOM',
    weight: 30,
    color: '#4c5c52',
    description:
      'Regula o fluxo com consistência nas aplicações básicas. Isso não garante domínio de uma técnica complexa.',
  },
  {
    id: 'advanced',
    name: 'Avançado',
    shortLabel: 'AVANÇADO',
    weight: 20,
    color: '#66584e',
    description:
      'Ajusta o fluxo com precisão em aplicações já conhecidas, inclusive ao variar a intensidade.',
  },
  {
    id: 'exceptional',
    name: 'Excepcional',
    shortLabel: 'EXCEPCIONAL',
    weight: 10,
    color: '#6e3d3f',
    description:
      'Regulação muito refinada do fluxo na escala do jogo. Não concede Seis Olhos, gasto quase nulo ou novas aplicações por si só.',
  },
];

export const outputOptions: WheelOption[] = [
  {
    id: 'very-low',
    name: 'Muito baixo',
    shortLabel: 'MUITO BAIXO',
    weight: 15,
    color: '#91313a',
    description:
      'Libera pouca energia de uma vez. Mesmo um estoque grande não remove esse limite de liberação.',
  },
  {
    id: 'low',
    name: 'Baixo',
    shortLabel: 'BAIXO',
    weight: 25,
    color: '#3d5663',
    description:
      'A quantidade liberada por aplicação é limitada, independentemente da energia que ainda resta.',
  },
  {
    id: 'moderate',
    name: 'Moderado',
    shortLabel: 'MODERADO',
    weight: 30,
    color: '#4c5c52',
    description:
      'Liberação intermediária na escala do jogo. Não define alcance, dano ou duração de uma aplicação.',
  },
  {
    id: 'high',
    name: 'Alto',
    shortLabel: 'ALTO',
    weight: 20,
    color: '#66584e',
    description:
      'Pode concentrar uma descarga relativamente intensa quando houver energia disponível e uma aplicação compatível.',
  },
  {
    id: 'extraordinary',
    name: 'Extraordinário',
    shortLabel: 'EXTRAORDINÁRIO',
    weight: 10,
    color: '#6e3d3f',
    description:
      'Grande capacidade de liberação instantânea na escala do jogo. Não cria energia, garante acerto ou entrega os ataques de Ryu Ishigori.',
  },
];

export const proficiencyOptions: WheelOption[] = [
  {
    id: 'beginner',
    name: 'Iniciante',
    shortLabel: 'INICIANTE',
    weight: 20,
    color: '#91313a',
    description:
      'Compreende as condições básicas, mas a execução ainda é instável e o repertório é inicial.',
  },
  {
    id: 'basic',
    name: 'Básica',
    shortLabel: 'BÁSICA',
    weight: 25,
    color: '#3d5663',
    description:
      'Executa aplicações simples nas condições corretas, sem explorar todo o repertório da técnica.',
  },
  {
    id: 'competent',
    name: 'Competente',
    shortLabel: 'COMPETENTE',
    weight: 25,
    color: '#4c5c52',
    description:
      'Usa com regularidade as aplicações acessíveis e começa a combiná-las; recursos ausentes continuam ausentes.',
  },
  {
    id: 'advanced',
    name: 'Avançada',
    shortLabel: 'AVANÇADA',
    weight: 20,
    color: '#66584e',
    description:
      'Explora com flexibilidade as aplicações viáveis da técnica, respeitando suas condições e os próprios recursos.',
  },
  {
    id: 'exceptional',
    name: 'Excepcional',
    shortLabel: 'EXCEPCIONAL',
    weight: 10,
    color: '#6e3d3f',
    description:
      'Refina profundamente as aplicações acessíveis. Não significa repertório completo, novos poderes ou ausência de limites.',
  },
];

// Illustrations of the concepts, not a ranking or an equivalence to a rolled tier.
export const masteryReferences: Record<string, CharacterReference> = {
  control: {
    topic: 'energy',
    character: 'Yuji Itadori',
    version: 'Exemplo de aprendizado · Intercâmbio',
    feats: [
      {
        description:
          'Todo identifica uma limitação na aplicação de energia de Yuji e o orienta durante o confronto.',
        context:
          'A cena ilustra que força corporal, fluxo de energia e execução não são a mesma coisa. Não posiciona Yuji em um nível desta escala.',
        source: { label: 'Anime · episódio 16', url: 'https://jujutsukaisen.jp/episodes/16.php' },
      },
    ],
    limitations:
      'A referência explica o aprendizado do fluxo. Não concede a força, a experiência ou habilidades de Yuji; controle elevado também não reproduz os recursos excepcionais de Gojo.',
  },
  output: {
    topic: 'energy',
    character: 'Ryu Ishigori',
    version: 'Exemplo de output · Colônia de Sendai',
    feats: [
      {
        description: 'Ryu demonstra liberação intensa de energia ao enfrentar Yuta em Sendai.',
        context:
          'Seu perfil oficial destaca o output; o confronto é apresentado no episódio 59. Isso contextualiza liberação, sem medir ou conceder a reserva de Ryu.',
        source: { label: 'Anime · episódio 59', url: 'https://jujutsukaisen.jp/episodes/59.php' },
      },
    ],
    limitations:
      'Ryu é um exemplo do conceito, não uma equivalência com este nível. Não concede seus disparos, técnica, reserva, precisão ou experiência.',
  },
  kokichi: {
    topic: 'energy',
    character: 'Kokichi Muta',
    version: 'Restrição corporal · antes da alteração do corpo',
    feats: [
      {
        description:
          'Opera Mechamaru à distância; seu perfil oficial relaciona a Restrição Celestial a alcance e output favorecidos.',
        context:
          'A vantagem energética não repara seu corpo e não corresponde a um estoque infinito ou a anos de energia acumulada.',
        source: {
          label: 'Anime · perfil oficial de Kokichi/Mechamaru',
          url: 'https://jujutsukaisen.jp/character/category2.php',
        },
      },
    ],
    limitations:
      'O piso Alto é uma adaptação de gameplay para preservar a vantagem, não uma classificação oficial de Kokichi. Alcance favorecido não ignora condições da técnica nem entrega Marionetes ou equipamentos.',
  },
  spirit: {
    topic: 'energy',
    character: 'Mahito',
    version: 'Exemplo de espírito · 1ª temporada',
    feats: [
      {
        description: 'Mahito altera a própria forma no confronto com Nanami.',
        context:
          'É um exemplo de aplicação de energia de um espírito com técnica própria, não uma fisiologia humana nem uma habilidade recebida pelo jogador.',
        source: { label: 'Anime · episódio 10', url: 'https://jujutsukaisen.jp/episodes/10.php' },
      },
    ],
    limitations:
      'A escala abstrai a regulação de uma existência constituída de energia. Não concede Transfiguração Ociosa, regeneração, resistência física ou a experiência de Mahito.',
  },
  spiritOutput: {
    topic: 'energy',
    character: 'Jogo',
    version: 'Exemplo de manifestação energética · 1ª temporada',
    feats: [
      {
        description: 'Jogo produz ataques de calor e chamas contra Gojo.',
        context:
          'As manifestações dependem de sua técnica; a cena não fornece uma medida isolada de output nem uma comparação entre espécies.',
        source: { label: 'Anime · episódio 7', url: 'https://jujutsukaisen.jp/episodes/07.php' },
      },
    ],
    limitations:
      'O output do personagem é uma abstração do jogo, sem equivalência com Jogo. Não concede fogo, sua técnica, regeneração ou potência idêntica.',
  },
};
