export interface ReferenceSource {
  label: string;
  url: string;
}

export interface ReferenceFeat {
  description: string;
  context: string;
  source: ReferenceSource;
}

export interface CharacterReference {
  character?: string;
  initialUse?: string;
  version: string;
  feats: ReferenceFeat[];
  limitations: string;
}

const episode = (number: number): ReferenceSource => ({
  label: `Anime · Episódio ${number}`,
  url: `https://jujutsukaisen.jp/episodes/${String(number).padStart(2, '0')}.php`,
});

// These are scene references, not official numerical measurements or rankings.
// Shared scenes retain their context when used for different physical attributes.
const scenes = {
  megumiKamo: {
    description: 'Enfrenta Noritoshi Kamo combinando taijutsu e shikigamis.',
    context: 'Intercâmbio: a troca corporal faz parte de uma luta que também envolve técnicas.',
    source: episode(18),
  },
  megumiHanami: {
    description: 'Luta ao lado de Maki contra Hanami, mas a dupla é superada.',
    context: 'Após a retirada com Inumaki e Kamo, volta ao confronto usando armas e sua técnica.',
    source: episode(19),
  },
  megumiRetreat: {
    description: 'Recua com Inumaki e Kamo enquanto o grupo evita os ataques de Hanami.',
    context:
      'O objetivo é alcançar o lado de fora da cortina; isso não demonstra vantagem de velocidade sobre Hanami.',
    source: episode(19),
  },
  pandaCombat: {
    description: 'Enfrenta Mechamaru em combate próximo após ser atacado à distância.',
    context: 'Intercâmbio: o confronto também mostra os diferentes núcleos e formas de Panda.',
    source: episode(16),
  },
  pandaEndurance: {
    description: 'Continua o confronto com Mechamaru após sofrer ataques.',
    context:
      'A continuidade da luta envolve a estrutura de cadáver amaldiçoado de Panda, não apenas a dureza de seu corpo.',
    source: episode(16),
  },
  makiMiwa: {
    description: 'Pressiona Miwa no combate próximo e toma sua espada.',
    context:
      'Maki ainda está na fase do Intercâmbio. A movimentação e o manejo de armas são parte do feito.',
    source: episode(17),
  },
  makiHanami: {
    description: 'Combate Hanami em coordenação com Megumi.',
    context:
      'O confronto inclui ferramentas amaldiçoadas; seu dano não é uma medida isolada de força corporal.',
    source: episode(19),
  },
  todoYuji: {
    description: 'Acompanha Yuji em trocas corpo a corpo enquanto corrige sua forma de lutar.',
    context: 'Primeiro dia do Intercâmbio: Todo passa a orientar Yuji durante o próprio combate.',
    source: episode(16),
  },
  todoHanami: {
    description: 'Ataca Hanami em conjunto com Yuji.',
    context:
      'A sequência combina golpes corporais e Boogie Woogie; os efeitos da técnica precisam ser separados da capacidade física.',
    source: episode(20),
  },
  yujiTodo: {
    description: 'Mantém o combate corpo a corpo com Todo durante o Intercâmbio.',
    context: 'A troca começa antes da cooperação entre os dois e continua com orientações de Todo.',
    source: episode(15),
  },
  yujiHanami: {
    description: 'Sustenta uma sequência de ataques coordenados com Todo contra Hanami.',
    context:
      'A cena inclui Black Flash e trocas de posição. Esses efeitos não são força ou velocidade corporal isoladas.',
    source: episode(20),
  },
  tojiDagon: {
    description: 'Enfrenta Dagon a curta distância usando Nuvem Brincalhona.',
    context:
      'Toji reanimado, em Shibuya. A ferramenta amaldiçoada participa diretamente do dano causado.',
    source: episode(39),
  },
  tojiMegumi: {
    description: 'Pressiona Megumi em um confronto no qual ele sobrevive com dificuldade.',
    context:
      'Shibuya: Megumi precisa reagir às investidas de Toji e buscar oportunidades no ambiente.',
    source: episode(40),
  },
  hanamiStudents: {
    description: 'Continua lutando após os ataques de Megumi e Maki.',
    context: 'Intercâmbio: a dupla usa armas e técnicas, mas não consegue equilibrar o confronto.',
    source: episode(19),
  },
  hanamiYujiTodo: {
    description: 'Segue em combate durante a ofensiva conjunta de Yuji e Todo.',
    context:
      'A luta inclui Black Flash. Sobreviver à sequência não permite separar toda a resistência dos demais recursos da maldição.',
    source: episode(20),
  },
} satisfies Record<string, ReferenceFeat>;

const goodwill = 'Arco do Intercâmbio · 1ª temporada';
const shibuya = 'Incidente de Shibuya · Toji reanimado';

export const physicalReferences = {
  'strength.megumi': {
    version: goodwill,
    feats: [scenes.megumiKamo, scenes.megumiHanami],
    limitations:
      'Não inclui a força dos shikigamis nem a Técnica das Dez Sombras. As cenas misturam taijutsu, armas e técnicas; não estabelecem uma medida de força pura.',
  },
  'strength.panda': {
    version: goodwill,
    feats: [scenes.pandaCombat],
    limitations:
      'Não concede núcleos extras ou a transformação em gorila. Os golpes de formas diferentes não devem ser somados como se fossem uma capacidade corporal única.',
  },
  'strength.maki-goodwill': {
    version: goodwill,
    feats: [scenes.makiMiwa, scenes.makiHanami],
    limitations:
      'Considera apenas Maki no Intercâmbio. Não concede armas nem transfere o dano de uma ferramenta para a força do corpo; não representa sua evolução posterior.',
  },
  'strength.todo': {
    version: goodwill,
    feats: [scenes.todoYuji, scenes.todoHanami],
    limitations:
      'Não inclui Boogie Woogie, reforço de energia amaldiçoada como recurso jogável ou uma equivalência exata com Yuji e Hanami.',
  },
  'strength.yuji-goodwill': {
    version: goodwill,
    feats: [scenes.yujiTodo, scenes.yujiHanami],
    limitations:
      'Black Flash e Punho Divergente não são força corporal pura. O resultado não concede esses recursos nem poderes de Sukuna.',
  },
  'strength.toji': {
    version: shibuya,
    feats: [scenes.tojiDagon],
    limitations:
      'A arma contribui para o dano da cena. Não concede Nuvem Brincalhona, Restrição Celestial ou reanimação, nem fixa um valor de força física isolada.',
  },
  'speed.megumi': {
    version: goodwill,
    feats: [scenes.megumiKamo, scenes.megumiRetreat],
    limitations:
      'Não inclui transporte ou distrações causadas por shikigamis. Conseguir reagir em uma troca não equivale a ser mais rápido que o adversário.',
  },
  'speed.maki-goodwill': {
    version: goodwill,
    feats: [scenes.makiMiwa],
    limitations:
      'O feito mistura movimento, tempo de reação e manejo de armas. Considera Maki do Intercâmbio, sem antecipar suas capacidades posteriores.',
  },
  'speed.yuji-goodwill': {
    version: goodwill,
    feats: [scenes.yujiTodo, scenes.yujiHanami],
    limitations:
      'Não transforma as trocas de posição de Todo em velocidade de corrida. Não inclui teletransporte, Black Flash ou habilidades de Sukuna.',
  },
  'speed.todo': {
    version: goodwill,
    feats: [scenes.todoYuji, scenes.todoHanami],
    limitations:
      'Boogie Woogie troca posições; não mede velocidade corporal. A leitura tática da luta também não é uma medida de inteligência geral.',
  },
  'speed.toji': {
    version: shibuya,
    feats: [scenes.tojiMegumi],
    limitations:
      'É uma referência de deslocamento e reação, não de teletransporte. Não atribui uma velocidade numérica nem concede Restrição Celestial.',
  },
  'endurance.megumi': {
    version: goodwill,
    feats: [scenes.megumiHanami],
    limitations:
      'A participação no confronto não significa suportar qualquer golpe de Hanami. A defesa usa armas, técnica e cooperação; Megumi é levado ao limite.',
  },
  'endurance.panda': {
    version: goodwill,
    feats: [scenes.pandaEndurance],
    limitations:
      'Os núcleos de Panda ajudam a explicar sua continuidade na luta. A comparação não concede vidas extras, reparação do corpo ou regeneração.',
  },
  'endurance.todo': {
    version: goodwill,
    feats: [scenes.todoHanami],
    limitations:
      'Manter a ofensiva não é o mesmo que absorver todos os ataques. Esquiva, cooperação e técnica influenciam a duração do combate; não há invulnerabilidade.',
  },
  'endurance.yuji-goodwill': {
    version: goodwill,
    feats: [scenes.yujiTodo, scenes.yujiHanami],
    limitations:
      'Considera a capacidade de continuar lutando nessa fase, sem cura de Sukuna, regeneração ou resistência automática a técnicas.',
  },
  'endurance.hanami': {
    version: goodwill,
    feats: [scenes.hanamiStudents, scenes.hanamiYujiTodo],
    limitations:
      'Hanami é um espírito amaldiçoado. A referência abstrai a resistência demonstrada, sem conceder seu corpo, sua regeneração, suas técnicas ou imunidade a golpes.',
  },
} satisfies Record<string, CharacterReference>;
