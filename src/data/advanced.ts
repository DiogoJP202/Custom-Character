import type { WheelOption } from './wheels.ts';
import type { CharacterReference, ReferenceSource } from './references.ts';

const episode = (number: number): ReferenceSource => ({
  label: `Anime · episódio ${number}`,
  url: `https://jujutsukaisen.jp/episodes/${String(number).padStart(2, '0')}.php`,
});
const manga = (chapter: number): ReferenceSource => ({
  label: `Mangá · capítulo ${chapter} (catálogo oficial)`,
  url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen',
});
const example = (
  character: string,
  version: string,
  description: string,
  context: string,
  source: ReferenceSource,
  limitations: string,
): CharacterReference => ({
  topic: 'resource',
  character,
  version,
  feats: [{ description, context, source }],
  limitations,
});

export const advancedNotes =
  'As probabilidades e categorias de capacidade são escolhas do jogo. Aprendizado, posse, execução e domínio são coisas distintas. As fontes indicam cenas e capítulos de leitura; sinopses online não detalham todos os requisitos.';

export const recoveryOptions: WheelOption[] = [
  {
    id: 'no-rct',
    name: 'Não domina Técnica Reversa',
    shortLabel: 'NÃO DOMINA',
    weight: 65,
    color: '#91313a',
    description:
      'Nenhuma Técnica Reversa foi atribuída. Isso não elimina sua técnica inata, seu uso geral de energia ou a possibilidade de receber tratamento de outra pessoa.',
    notes: advancedNotes,
  },
  {
    id: 'self-limited',
    name: 'Regeneração própria limitada',
    shortLabel: 'PRÓPRIA LIMITADA',
    weight: 22,
    color: '#3d5663',
    description:
      'Aprendizado de Técnica Reversa para reparos limitados no próprio corpo, produzindo energia positiva a partir de energia amaldiçoada. Não permite curar terceiros.',
    reference: example(
      'Satoru Gojo',
      'Despertar · Inventário Oculto',
      'Gojo compreende a Técnica Reversa e recupera o próprio corpo depois do ataque de Toji.',
      'É um exemplo do mecanismo de cura própria; a escala dos ferimentos e os recursos de Gojo não são transferidos.',
      episode(28),
      'Cura custa energia e exige execução adequada. Não restaura qualquer lesão, revive mortos ou fornece regeneração ilimitada. Técnica Reversa não é Reversão de Técnica Amaldiçoada.',
    ),
  },
  {
    id: 'self-advanced',
    name: 'Regeneração própria avançada',
    shortLabel: 'PRÓPRIA AVANÇADA',
    weight: 10,
    color: '#4c5c52',
    description:
      'Repertório mais amplo de reparação do próprio corpo por Técnica Reversa. A capacidade efetiva continua limitada pela energia e pelo controle registrados; curar a si mesmo não concede cura de terceiros.',
    reference: example(
      'Satoru Gojo',
      'Inventário Oculto',
      'Gojo usa energia positiva para recuperar o próprio corpo.',
      'O exemplo ilustra cura própria, sem copiar sua eficiência excepcional ou demais características.',
      episode(28),
      'Não concede cura de terceiros, reversão da técnica inata, cura de qualquer veneno, reparação automática da alma ou ressurreição. Lesões fatais e esgotamento continuam perigosos.',
    ),
  },
  {
    id: 'heal-others',
    name: 'Capacidade de curar terceiros',
    shortLabel: 'CURAR TERCEIROS',
    weight: 3,
    color: '#66584e',
    description:
      'Aprendizado para aplicar energia positiva no próprio corpo e transmiti-la para tratar outra pessoa. Essa transmissão é uma capacidade adicional, não uma consequência automática da cura própria.',
    sources: [
      {
        label: 'Shoko · perfil oficial de cura de terceiros',
        url: 'https://jujutsukaisen.jp/character/shibuyajihen.php',
      },
    ],
    reference: example(
      'Shoko Ieiri',
      'Médica do Colégio Jujutsu',
      'O perfil oficial de Shoko descreve a reparação do corpo de outras pessoas por Técnica Reversa.',
      'Tratamento humano, sem transplante de sua experiência médica para o jogador.',
      {
        label: 'Shoko · perfil oficial',
        url: 'https://jujutsukaisen.jp/character/shibuyajihen.php',
      },
      'Exige energia positiva, controle e contato/aplicação apropriados. Não garante salvar todo paciente ou recuperar qualquer parte perdida. Não é cura universal para espíritos, corpos artificiais ou simurianos.',
    ),
  },
  {
    id: 'spirit-untrained',
    name: 'Recomposição pouco desenvolvida',
    shortLabel: 'POUCO DESENV.',
    weight: 20,
    color: '#91313a',
    description:
      'Seu corpo é constituído de energia amaldiçoada, mas esta criação não recebe domínio de recomposição em situações difíceis. Isso não declara incapacidade biológica de todos os espíritos.',
    notes: 'Não é RCT: nenhuma produção de energia positiva ou cura de humanos foi concedida.',
  },
  {
    id: 'spirit-limited',
    name: 'Recomposição limitada do espírito',
    shortLabel: 'RECOMPOR LIMITADA',
    weight: 60,
    color: '#3d5663',
    description:
      'Pode tentar recompor danos limitados no próprio corpo usando energia amaldiçoada. É um mecanismo de espírito, distinto da Técnica Reversa humana.',
    reference: example(
      'Hanami',
      'Intercâmbio',
      'Hanami recompõe danos durante o confronto com os estudantes.',
      'Seu corpo de maldição usa energia amaldiçoada; isso não é demonstração de RCT humana.',
      episode(19),
      'A recomposição depende de energia disponível e do tipo de dano. Não concede cura de outras pessoas, imortalidade, imunidade ou reparação irrestrita da alma.',
    ),
  },
  {
    id: 'spirit-developed',
    name: 'Recomposição desenvolvida do espírito',
    shortLabel: 'RECOMPOR AMPLIADA',
    weight: 20,
    color: '#4c5c52',
    description:
      'Maior domínio de recomposição do próprio corpo de energia, sujeito à reserva, ao controle e ao dano sofrido. Não recebe energia positiva ou cura humana.',
    reference: example(
      'Hanami',
      'Intercâmbio',
      'Hanami se recompõe e permanece no combate após sofrer danos.',
      'O feito contextualiza o mecanismo; não concede resistência ou um corpo idêntico ao de Hanami.',
      episode(19),
      'Não reverte exorcismo ou destruição fatal, não garante regenerar qualquer dano e não transfere essa capacidade a outros seres.',
    ),
  },
  {
    id: 'external-repair',
    name: 'Corpo artificial — reparação específica',
    shortLabel: 'REPARAÇÃO',
    weight: 1,
    color: '#3d5663',
    description:
      'Seu corpo artificial não recebe o modelo de cura humana. Reparação e manutenção dependem de sua constituição; nenhum núcleo extra, reparo automático ou técnico de manutenção é concedido.',
    sources: [
      {
        label: 'Panda e Yaga · perfis oficiais',
        url: 'https://jujutsukaisen.jp/character/index_1st.php',
      },
    ],
  },
  {
    id: 'natural-recovery',
    name: 'Sem cura especial atribuída',
    shortLabel: 'SEM CURA ESPECIAL',
    weight: 1,
    color: '#3d5663',
    description:
      'Esta versão não atribui RCT humana ou recomposição de maldições à fisiologia simuriana. A reserva de rolloluca permanece; o próximo recurso disponível é equipamento físico, com requisitos próprios.',
    sources: [
      {
        label: 'Jujutsu Kaisen Modulo · edição oficial',
        url: 'https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo',
      },
    ],
  },
];

export const antiDomainOptions: WheelOption[] = [
  {
    id: 'none',
    name: 'Nenhuma defesa especializada',
    shortLabel: 'NENHUMA',
    weight: 60,
    color: '#91313a',
    description:
      'Não recebeu uma técnica ant domínio. Isso não concede uma expansão própria nem significa derrota automática; o resultado não simula um combate.',
  },
  {
    id: 'simple-domain',
    name: 'Domínio Simples',
    shortLabel: 'DOMÍNIO SIMPLES',
    weight: 23,
    color: '#3d5663',
    description:
      'Uma barreira local que pode neutralizar o acerto garantido de um domínio dentro de seu alcance. Não apaga a técnica adversária nem oferece proteção indefinida.',
    sources: [manga(269)],
    reference: example(
      'Ui Ui',
      'Incidente de Shibuya',
      'Ui Ui emprega Domínio Simples contra o domínio da Divindade da Varíola.',
      'A defesa funciona dentro das condições da cena, sem conceder o voto pessoal de Ui Ui com Mei Mei.',
      episode(38),
      'Exige aprendizado e manutenção da barreira. O resultado inclui formação básica na Nova Escola das Sombras após a liberação da transmissão descrita no cap. 269; não pressupõe violar os votos históricos. Usa uma configuração inicial com posição fixa, como a de Miwa, não uma limitação universal de todos os usuários. Não recebe a experiência de Kusakabe, programas de espada ou cápsulas de Mechamaru. Pode ser rompido por domínios superiores.',
    ),
  },
  {
    id: 'hollow-wicker-basket',
    name: 'Cesto de Vime Oco',
    shortLabel: 'CESTO DE VIME',
    weight: 12,
    color: '#4c5c52',
    description:
      'Técnica de barreira ant domínio que neutraliza o acerto garantido de uma barreira com técnica imbuída. Não neutraliza diretamente toda técnica ou todo ataque.',
    sources: [manga(171), manga(266)],
    reference: example(
      'Reggie Star',
      'Colônia de Tóquio nº 1',
      'Reggie usa Cesto de Vime Oco contra o domínio incompleto de Megumi, sem obter a proteção esperada.',
      'O exemplo mostra por que anular acerto garantido não elimina recursos que não dependem dele.',
      episode(58),
      'O aprendizado é atribuído pelo resultado, sem inventar uma linhagem ou escola de transmissão. A ativação exige selo com as mãos; sua manutenção ocupa as mãos para sustentar a barreira, como no exemplo de Sukuna no cap. 266. Não concede braços extras, proteção eterna ou vitória contra um domínio.',
    ),
  },
  {
    id: 'falling-blossom',
    name: 'Emoção da Flor Cadente',
    shortLabel: 'FLOR CADENTE',
    weight: 5,
    color: '#66584e',
    description:
      'Envolve o usuário em energia que reage ao contato dos ataques de acerto garantido. Diferente do Domínio Simples, não cria uma barreira para neutralizar o acerto garantido.',
    sources: [manga(108)],
    reference: example(
      'Naobito Zen’in',
      'Incidente de Shibuya',
      'Naobito usa Emoção da Flor Cadente para responder aos ataques do domínio de Dagon.',
      'A resposta não o protege de todas as ações de Dagon, inclusive ataques físicos diretos.',
      episode(38),
      'Arte transmitida pelas três grandes famílias. O resultado registra acesso ao ensinamento pela linhagem Gojo, Zen’in ou Kamo, seguido de treinamento; pertencer ao clã não garante obtê-la. Exige fluxo e reação de energia, não anula domínios ou ataques abstratos indiscriminadamente. Não concede perícia de Naobito.',
    ),
  },
];

// Named artifacts represent custody of the original in one independent fan scenario,
// never manufacturing another canonical unit. No shared world or item duplication system.
const custody =
  'A posse é uma hipótese deste cenário independente de fã: acesso ao próprio artefato, não fabricação de réplica, exemplar novo ou afirmação de disponibilidade na cronologia oficial.';
export const equipmentOptions: WheelOption[] = [
  {
    id: 'none',
    name: 'Sem ferramenta',
    shortLabel: 'SEM FERRAMENTA',
    weight: 20,
    color: '#91313a',
    description:
      'Nenhuma arma ou ferramenta foi atribuída. Seus atributos, técnicas e outros recursos permanecem.',
  },
  {
    id: 'conventional',
    name: 'Arma convencional',
    shortLabel: 'CONVENCIONAL',
    weight: 20,
    color: '#3d5663',
    description:
      'Uma arma física convencional está disponível. Ela não recebe energia amaldiçoada ou propriedades especiais por este sorteio.',
    reference: example(
      'Toji Fushiguro',
      'Inventário Oculto',
      'Toji utiliza uma arma de fogo convencional no incidente de Inventário Oculto.',
      'Arma convencional não se torna ferramenta amaldiçoada por estar nas mãos de Toji.',
      episode(28),
      'Empunhar exige condições corporais e treino. Sem energia imbuída, não presume capacidade de exorcizar maldições. O sorteio não determina modelo, munição ilimitada ou perícia.',
    ),
  },
  {
    id: 'common-tool',
    name: 'Ferramenta amaldiçoada comum',
    shortLabel: 'FERRAMENTA COMUM',
    weight: 30,
    color: '#4c5c52',
    description:
      'Uma ferramenta de combate já imbuída de energia está disponível. Pode atingir maldições sem exigir que o portador forneça energia própria; nenhum poder especial foi acrescentado.',
    reference: example(
      'Yuji Itadori',
      'Início da 1ª temporada',
      'Yuji usa a ferramenta emprestada por Gojo contra maldições no prédio abandonado.',
      'A ferramenta da cena contextualiza energia no equipamento; não é uma segunda unidade da arma emprestada a Yuji.',
      episode(3),
      'Comum é uma categoria de disponibilidade do jogo, não um novo grau oficial. O item é genérico, sem técnica embutida catalogada. Posse não garante exorcismo, acerto ou domínio de armas.',
    ),
  },
  {
    id: 'high-tool',
    name: 'Ferramenta amaldiçoada de grau elevado',
    shortLabel: 'GRAU ELEVADO',
    weight: 20,
    color: '#66584e',
    description:
      'Uma ferramenta de categoria elevada na escala do jogo está disponível, com energia imbuída para combate físico. Não recebe uma técnica especial inventada.',
    reference: example(
      'Maki Zen’in',
      'Intercâmbio',
      'Maki usa ferramentas amaldiçoadas ao enfrentar os estudantes e Hanami.',
      'As cenas mostram a importância do equipamento e da capacidade de quem o empunha, sem estabelecer equivalência com este item genérico.',
      episode(19),
      'Grau elevado aqui é uma faixa de gameplay, não atribuição de grau 1 a uma arma sem classificação confirmada. Não copia Nuvem Brincalhona, não entrega uma técnica embutida e não garante dano maior em qualquer situação.',
    ),
  },
  {
    id: 'playful-cloud',
    name: 'Nuvem Brincalhona',
    shortLabel: 'NUVEM',
    weight: 5,
    color: '#6e3d3f',
    description:
      'Ferramenta amaldiçoada de grau especial, articulada em três seções. Não tem técnica imbuída: seu aproveitamento depende da força física de quem a usa.',
    notes: custody,
    reference: example(
      'Toji Fushiguro',
      'Reanimado · Shibuya',
      'Toji toma Nuvem Brincalhona de Maki e a utiliza contra Dagon.',
      'Seu físico extraordinário e sua experiência são parte do feito, não propriedades concedidas pela arma.',
      episode(39),
      'Posse não entrega os golpes, a força ou o domínio de Toji/Maki. A articulação exige treinamento. A energia da ferramenta não transforma sua reserva ou remove limitações corporais.',
    ),
  },
  {
    id: 'inverted-spear',
    name: 'Lança Invertida do Céu',
    shortLabel: 'LANÇA INVERTIDA',
    weight: 3,
    color: '#2e424f',
    description:
      'Ferramenta de grau especial cuja técnica imbuída interrompe técnicas amaldiçoadas com as quais entra em contato. Não é um apagamento de poderes à distância.',
    notes: custody,
    reference: example(
      'Toji Fushiguro',
      'Inventário Oculto',
      'Toji usa a ferramenta para atravessar a defesa do Ilimitado no confronto com Gojo.',
      'O contato foi obtido por Toji com preparação e capacidade física próprias.',
      episode(27),
      'A energia e a técnica estão no artefato, não são concedidas ao portador. É preciso alcançar o efeito com a lâmina: não garante tocar qualquer alvo, neutralizar um domínio inteiro ou vencer Gojo. Não recebe corrente, maldição de inventário ou treinamento.',
    ),
  },
  {
    id: 'soul-katana',
    name: 'Katana Divisora de Almas',
    shortLabel: 'KATANA DE ALMAS',
    weight: 2,
    color: '#66584e',
    description:
      'Ferramenta cuja aplicação plena corta a alma ignorando dureza, sob requisitos específicos de percepção. Possuir a lâmina não satisfaz esses requisitos.',
    notes: custody,
    sources: [manga(198)],
    reference: example(
      'Toji / Maki Zen’in',
      'Artefato e requisitos · mangá, cap. 198',
      'O capítulo 198 explicita o requisito de perceber até a alma de matéria inanimada para explorar plenamente a lâmina.',
      'A réplica feita por Mai é um acontecimento específico da obra, não uma habilidade de criar cópias concedida ao jogador.',
      manga(198),
      'Este jogo ainda não registra a percepção exigida: o corte pleno de almas fica bloqueado. A posse permite apenas uso físico compatível da ferramenta. Restrição Celestial, força ou controle excepcional não desbloqueiam essa percepção automaticamente.',
    ),
  },
];
