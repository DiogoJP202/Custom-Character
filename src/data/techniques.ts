import type { WheelOption } from './wheels.ts';
import type { ReferenceFeat } from './references.ts';

const scene = (number: number, description: string, context: string): ReferenceFeat => ({
  description,
  context,
  source: {
    label: `Anime · Episódio ${number}`,
    url: `https://jujutsukaisen.jp/episodes/${String(number).padStart(2, '0')}.php`,
  },
});

interface TechniqueEntry {
  id: string;
  name: string;
  shortLabel: string;
  character: string;
  version: string;
  description: string;
  initialUse: string;
  limitations: string;
  feats: ReferenceFeat[];
  nature: 'human' | 'cursed-spirit';
  lineage?: string;
  weight: number;
  color: string;
}

// Translation labels are those used by this fan game. Named episode sources are reading
// references, not a claim that their short web synopses explain every activation condition.
const entries: TechniqueEntry[] = [
  {
    id: 'boogie-woogie',
    name: 'Boogie Woogie',
    shortLabel: 'BOOGIE',
    character: 'Aoi Todo',
    version: 'Intercâmbio · antes das alterações de Shinjuku',
    nature: 'human',
    weight: 10,
    color: '#91313a',
    description:
      'Troca posições entre alvos válidos com energia amaldiçoada, usando palmas na versão de Todo do Intercâmbio.',
    initialUse:
      'Capacidade de tentar uma troca simples quando os alvos e a ativação forem válidos. Não ganha a leitura de combate, os reflexos ou a experiência de Todo.',
    limitations:
      'Exige alvos com energia suficiente e as condições de ativação dessa versão. Uma palma não obriga uma troca. Não concede a versão modificada de Shinjuku nem uma velocidade corporal maior.',
    feats: [
      scene(
        20,
        'Todo usa trocas de posição no combate conjunto com Yuji contra Hanami.',
        'A coordenação e a escolha dos alvos dependem da experiência de Todo; não acompanham automaticamente a técnica.',
      ),
    ],
  },
  {
    id: 'ratio',
    name: 'Técnica da Proporção',
    shortLabel: 'PROPORÇÃO',
    character: 'Kento Nanami',
    version: '1ª temporada · confronto com Mahito',
    nature: 'human',
    weight: 10,
    color: '#3d5663',
    description:
      'Cria um ponto fraco na proporção de sete para três do alvo, que precisa ser atingido para aproveitar a técnica.',
    initialUse:
      'Pode aplicar a proporção a um alvo e buscar acertar o ponto marcado. O resultado não garante precisão, acerto ou a força física de Nanami.',
    limitations:
      'Não é dano garantido: ainda exige aplicação, energia e um golpe no ponto correto. Não concede ferramentas, o voto de Hora Extra ou técnicas de extensão automaticamente.',
    feats: [
      scene(
        10,
        'Nanami aplica sua técnica ao enfrentar Mahito.',
        'Encontrar um ponto fraco não resolve sozinho a capacidade de Mahito de alterar seu corpo e preservar a alma.',
      ),
    ],
  },
  {
    id: 'straw-doll',
    name: 'Técnica do Boneco de Palha',
    shortLabel: 'BONECO',
    character: 'Nobara Kugisaki',
    version: '1ª temporada · Pinturas da Morte',
    nature: 'human',
    weight: 10,
    color: '#4c5c52',
    description:
      'Canaliza energia por instrumentos como pregos, martelo e boneco de palha. Aplicações por vínculo dependem de uma ligação válida com o alvo.',
    initialUse:
      'Pode imbuir e utilizar pregos preparados. Não recebe equipamentos nem uma ligação com qualquer inimigo apenas por possuir a técnica.',
    limitations:
      'O alcance de um efeito por vínculo depende da ligação e do material usado. Ressonância não é acesso irrestrito a qualquer alvo; a cena de referência exige condições específicas e não implica domínio inicial.',
    feats: [
      scene(
        24,
        'Nobara usa Ressonância durante o confronto com Eso e Kechizu.',
        'O sangue e a ligação estabelecida naquele confronto são parte do contexto; não se trata de acertar qualquer inimigo à distância.',
      ),
    ],
  },
  {
    id: 'puppet-manipulation',
    name: 'Manipulação de Marionetes',
    shortLabel: 'MARIONETES',
    character: 'Kokichi Muta',
    version: 'Intercâmbio · Mechamaru',
    nature: 'human',
    weight: 10,
    color: '#66584e',
    description:
      'Permite operar marionetes por meio de energia amaldiçoada, separando o corpo do usuário do instrumento que ele controla.',
    initialUse:
      'Pode operar uma marionete compatível quando ela estiver disponível e preparada. Nenhum robô, armamento ou corpo substituto é entregue pelo sorteio.',
    limitations:
      'Não concede a Restrição Celestial de Kokichi, sua extensão de alcance ou sua energia acumulada. Se o personagem já tiver a condição corporal correspondente, o corpo continua debilitado; a técnica não o cura.',
    feats: [
      scene(
        16,
        'Kokichi enfrenta Panda por meio de Mechamaru.',
        'Os golpes e disparos são ações da marionete, e não feitos físicos do corpo humano de Kokichi.',
      ),
    ],
  },
  {
    id: 'construction',
    name: 'Construção',
    shortLabel: 'CONSTRUÇÃO',
    character: 'Mai Zen’in',
    version: 'Intercâmbio · não inclui as aplicações de Yorozu',
    nature: 'human',
    weight: 10,
    color: '#2e424f',
    description:
      'Converte energia amaldiçoada em matéria. Criar algo exige energia e compreensão do objeto, sem fornecer um estoque gratuito de armas.',
    initialUse:
      'Capacidade de tentar construir um objeto simples, conforme energia e conhecimento disponíveis. O sorteio não garante que uma reserva baixa suporte a criação.',
    limitations:
      'O consumo é elevado; o limite demonstrado por Mai não é um limite numérico universal para todos os usuários. A técnica aparece também com Yorozu: não é tratada aqui como herança exclusiva Zen’in. Não concede metal líquido, Esfera Perfeita ou ferramentas especiais.',
    feats: [
      scene(
        17,
        'Mai cria uma bala para surpreender Maki.',
        'É uma aplicação pequena e custosa dessa versão; não demonstra criação irrestrita de qualquer objeto.',
      ),
    ],
  },
  {
    id: 'cursed-spirit-manipulation',
    name: 'Manipulação de Espíritos Amaldiçoados',
    shortLabel: 'ESPÍRITOS',
    character: 'Suguru Geto',
    version: 'Jujutsu Kaisen 0',
    nature: 'human',
    weight: 8,
    color: '#6e3d3f',
    description:
      'Permite absorver e comandar espíritos amaldiçoados quando as condições de captura são atendidas.',
    initialUse:
      'Possui a capacidade de capturar um espírito elegível. Começa sem maldições absorvidas e não recebe o exército de Geto.',
    limitations:
      'Não controla automaticamente qualquer maldição: captura e subjugação importam. Não concede maldições especiais, técnicas de extensão ou o conhecimento de Geto. A técnica fica no catálogo humano, sem presumir que todo espírito possa usá-la.',
    feats: [
      {
        description: 'Geto mobiliza espíritos no Desfile Noturno de Cem Demônios.',
        context:
          'O conjunto de maldições foi adquirido por Geto; não é parte do estoque inicial de quem recebe a técnica.',
        source: {
          label: 'Jujutsu Kaisen 0 · filme / mangá, capítulo 4',
          url: 'https://jujutsukaisen-movie.jp/',
        },
      },
    ],
  },
  {
    id: 'ten-shadows',
    name: 'Técnica das Dez Sombras',
    shortLabel: 'DEZ SOMBRAS',
    character: 'Megumi Fushiguro',
    version: '1ª temporada',
    nature: 'human',
    lineage: 'zenin',
    weight: 10,
    color: '#3d5663',
    description: 'Usa sombras como meio para invocar shikigamis da técnica hereditária Zen’in.',
    initialUse:
      'A referência inicial são os Cães Divinos da técnica. Não recebe todos os shikigamis dominados por Megumi nem vitória automática em rituais.',
    limitations:
      'Outros shikigamis exigem subjugação e obedecem às regras próprias da técnica. Não concede Mahoraga domesticado, fusões avançadas ou domínio. O sobrenome Fushiguro de Megumi não elimina sua ascendência Zen’in.',
    feats: [
      scene(
        1,
        'Megumi invoca os Cães Divinos na escola.',
        'O uso inicial dos shikigamis não equivale a dominar todo o repertório das Dez Sombras.',
      ),
    ],
  },
  {
    id: 'projection',
    name: 'Projeção Feiticeira',
    shortLabel: 'PROJEÇÃO',
    character: 'Naobito Zen’in',
    version: 'Incidente de Shibuya',
    nature: 'human',
    lineage: 'zenin',
    weight: 10,
    color: '#66584e',
    description:
      'Organiza o movimento em uma sequência de quadros predefinidos. A trajetória planejada precisa obedecer às regras da técnica.',
    initialUse:
      'Pode tentar executar uma sequência curta de movimento planejado. Não recebe automaticamente a velocidade, a experiência ou os acúmulos de Naobito.',
    limitations:
      'Violar as regras de movimento pode imobilizar o próprio usuário. A aplicação sobre outro alvo exige contato e suas condições específicas. Não ignora o estado físico do corpo. A forma de Naoya como espírito vingativo é uma exceção com história própria, não acesso universal para espíritos.',
    feats: [
      scene(
        38,
        'Naobito pressiona Dagon com sequências rápidas de movimento.',
        'A execução de um usuário experiente e as condições daquele confronto não são domínio inicial.',
      ),
    ],
  },
  {
    id: 'blood-manipulation',
    name: 'Manipulação de Sangue',
    shortLabel: 'SANGUE',
    character: 'Noritoshi Kamo',
    version: 'Intercâmbio · usuário humano',
    nature: 'human',
    lineage: 'kamo',
    weight: 10,
    color: '#91313a',
    description:
      'Controla o próprio sangue e suas propriedades dentro das aplicações da técnica hereditária Kamo.',
    initialUse:
      'Pode manipular sangue próprio disponível, com aplicações simples e sem estoque externo concedido. Técnicas avançadas não vêm dominadas.',
    limitations:
      'Perder sangue continua perigoso para um humano. Não concede a constituição de Choso nem a capacidade especial de repor sangue das Pinturas da Morte. Choso não justifica distribuir a técnica a todos os espíritos ou cadáveres artificiais.',
    feats: [
      scene(
        18,
        'Kamo combina Manipulação de Sangue e combate físico contra Megumi.',
        'O controle de sangue integra o confronto, mas não equivale a sangue ilimitado ou a uma fisiologia não humana.',
      ),
    ],
  },
  {
    id: 'cursed-speech',
    name: 'Fala Amaldiçoada',
    shortLabel: 'FALA',
    character: 'Toge Inumaki',
    version: '1ª temporada',
    nature: 'human',
    lineage: 'inumaki',
    weight: 10,
    color: '#4c5c52',
    description: 'Imbui palavras com energia para impor comandos a quem é afetado pela fala.',
    initialUse:
      'Pode tentar um comando simples contra um alvo válido. Possuir a técnica não garante obediência irrestrita nem proteção contra o próprio desgaste.',
    limitations:
      'A exigência do comando e a força do alvo influenciam o retorno sobre o usuário, inclusive dano à garganta. Não controla qualquer oponente sem consequências. A reprodução por Yuta via Cópia não torna esta herança livre para qualquer linhagem.',
    feats: [
      scene(
        19,
        'Inumaki usa comandos para deter Hanami durante a retirada do grupo.',
        'Conter uma maldição forte cobra um preço; a sequência não representa controle ilimitado sobre ela.',
      ),
    ],
  },
  {
    id: 'limitless',
    name: 'Ilimitado',
    shortLabel: 'ILIMITADO',
    character: 'Satoru Gojo',
    version: 'Técnica hereditária Gojo · sem Seis Olhos concedidos',
    nature: 'human',
    lineage: 'gojo',
    weight: 6,
    color: '#2e424f',
    description:
      'Técnica de manipulação espacial da família Gojo. Sua existência não entrega o conjunto de capacidades que Gojo demonstra.',
    initialUse:
      'Recebe a técnica como capacidade existente. Sem Seis Olhos, não se presume uma aplicação estável ou contínua do Infinito; o uso exige condições de controle e eficiência excepcionais.',
    limitations:
      'Seis Olhos não acompanha este resultado. Não concede defesa automática permanente, Azul dominado, Vermelho, Roxo ou domínio. Reserva grande, sozinha, não resolve os requisitos para utilização plena.',
    feats: [
      scene(
        7,
        'Gojo demonstra sua defesa espacial no confronto com Jogo.',
        'É uma demonstração de Gojo com seus recursos excepcionais, não uma aplicação inicial garantida a este personagem.',
      ),
    ],
  },
  {
    id: 'idle-transfiguration',
    name: 'Transfiguração Ociosa',
    shortLabel: 'TRANSFIGURAÇÃO',
    character: 'Mahito',
    version: '1ª temporada',
    nature: 'cursed-spirit',
    weight: 10,
    color: '#3d5663',
    description:
      'Altera a forma da alma e, por consequência, do corpo. Afetar outro ser exige contato e as condições de interação com sua alma.',
    initialUse:
      'Pode experimentar alterações simples da própria forma. A tentativa de afetar outro alvo não é uma vitória automática.',
    limitations:
      'Tocar não garante dominar qualquer alma; resistência e riscos do contato importam. Não concede humanos transfigurados previamente, domínio, cópia de técnicas ou uso como cura humana segura.',
    feats: [
      scene(
        10,
        'Mahito modifica a própria forma enquanto enfrenta Nanami.',
        'Sua técnica envolve alma e corpo; não deve ser confundida com resistência física ou regeneração comum.',
      ),
    ],
  },
  {
    id: 'jogo-flames',
    name: 'Chamas — Jogo',
    shortLabel: 'CHAMAS',
    character: 'Jogo',
    version: '1ª temporada',
    nature: 'cursed-spirit',
    weight: 10,
    color: '#91313a',
    description:
      'Produz ataques de calor e chamas como os demonstrados por Jogo. O título é descritivo, sem atribuir um nome oficial não confirmado à técnica.',
    initialUse:
      'Capacidade de produzir uma manifestação simples de chamas, condicionada à energia e ao controle disponíveis.',
    limitations:
      'Não concede a escala destrutiva de Jogo, meteoros, domínio ou controle perfeito do fogo. A existência dessa técnica não torna o corpo idêntico ao de Jogo.',
    feats: [
      scene(
        7,
        'Jogo ataca Gojo com manifestações de calor e fogo.',
        'A potência e a experiência de Jogo são referências de funcionamento, não valores transferidos ao jogador.',
      ),
    ],
  },
  {
    id: 'hanami-plants',
    name: 'Manipulação vegetal — Hanami',
    shortLabel: 'VEGETAÇÃO',
    character: 'Hanami',
    version: 'Intercâmbio',
    nature: 'cursed-spirit',
    weight: 10,
    color: '#4c5c52',
    description:
      'Manifesta e controla estruturas vegetais para atacar ou conter alvos. O nome é um rótulo descritivo usado pelo jogo.',
    initialUse:
      'Capacidade de manifestar uma estrutura vegetal simples. Não recebe a força do corpo, a resistência ou todo o repertório de Hanami.',
    limitations:
      'Volume, controle e gasto não são ilimitados. Não concede flores de efeito especial, brotos especializados ou domínio automaticamente.',
    feats: [
      scene(
        19,
        'Hanami pressiona o grupo de estudantes com ataques vegetais.',
        'O confronto envolve múltiplos recursos de uma maldição experiente, que não são entregues integralmente pelo sorteio.',
      ),
    ],
  },
];

export const techniques: WheelOption[] = entries.map(
  ({ character, version, initialUse, limitations, feats, nature, lineage, ...option }) => ({
    ...option,
    technique: { nature, lineage, requiresOwnEnergy: true },
    reference: { character, version, initialUse, limitations, feats },
  }),
);

export const humanTechniquePresence: WheelOption[] = [
  {
    id: 'yes',
    name: 'Possui técnica inata',
    shortLabel: 'POSSUI',
    weight: 80,
    color: '#91313a',
    description:
      'A próxima roleta sorteia uma técnica entre as opções compatíveis com sua natureza e linhagem. Não concede domínio completo de suas aplicações.',
  },
  {
    id: 'no',
    name: 'Não possui técnica inata',
    shortLabel: 'NÃO POSSUI',
    weight: 20,
    color: '#3d5663',
    description:
      'Nenhuma técnica inata foi atribuída. Isso não impede treinamento físico, uso de ferramentas disponíveis ou habilidades gerais de jujutsu compatíveis com sua energia.',
  },
];
export const spiritTechniquePresence: WheelOption[] = humanTechniquePresence.map((option) => ({
  ...option,
  weight: option.id === 'yes' ? 90 : 10,
  description:
    option.id === 'yes'
      ? 'A próxima roleta usa exclusivamente o catálogo de técnicas para espíritos amaldiçoados. A distribuição de 90/10 é uma escolha de gameplay.'
      : 'Nenhuma técnica inata foi atribuída a esta criação. A existência como espírito e sua reserva permanecem; este resultado não é uma classificação oficial das maldições.',
}));
