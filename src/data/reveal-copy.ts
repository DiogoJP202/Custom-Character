// Presentation summaries of the existing catalog. Full rules and sources stay in resultDetails.
export const revealCopy: Record<string, Record<string, string>> = {
  nature: {
    human: 'Humano: a próxima etapa define sua linhagem.',
    'cursed-spirit':
      'Uma existência constituída de energia amaldiçoada, associada às emoções negativas humanas.',
    'independent-cursed-corpse': 'Um corpo artificial autônomo, animado por energia amaldiçoada.',
    simurian:
      'Integrante do povo extraterrestre de Modulo, com reserva equivalente de rolloluca nesta versão do jogo.',
  },
  lineage: {
    'no-known-clan': 'Nenhum vínculo familiar foi estabelecido nesta criação.',
    gojo: 'Sua linhagem permite participar do catálogo de técnicas do clã Gojo.',
    zenin: 'Sua linhagem permite participar do catálogo de técnicas do clã Zen’in.',
    kamo: 'Sua linhagem permite participar do catálogo de técnicas do clã Kamo.',
    inumaki: 'Sua linhagem permite participar do catálogo de técnicas da família Inumaki.',
  },
  'birth-condition': {
    none: 'Sua criação segue sem uma Restrição Celestial atribuída.',
    'physical-partial':
      'Físico ampliado, com energia residual extremamente limitada; não equivale ao físico de Toji.',
    'physical-complete': 'Físico extraordinário, sem energia amaldiçoada própria.',
    'body-limited': 'Corpo extremamente debilitado, com alcance e output favorecidos.',
  },
  strength: {
    megumi: 'Força de um feiticeiro treinado para bloquear, golpear e disputar o corpo a corpo.',
    panda:
      'Força de contato para pressionar a guarda, conter investidas e responder com golpes diretos.',
    'maki-goodwill':
      'Força corporal para controlar uma arma, disputar a guarda e desarmar no combate próximo.',
    todo: 'Força bruta para impor pressão a curta distância com golpes vigorosos.',
    'yuji-goodwill': 'Força para investir, agarrar e golpear com impacto corporal elevado.',
    toji: 'Força bruta para impor pressão a curta distância e aplicar golpes vigorosos com uma arma.',
  },
  speed: {
    megumi:
      'Mobilidade de um feiticeiro treinado para acompanhar trocas próximas e reposicionar-se.',
    'maki-goodwill': 'Deslocamentos e reações rápidos para disputar o alcance no combate próximo.',
    'yuji-goodwill':
      'Arrancadas e reações corporais para aproximar-se e acompanhar confrontos rápidos.',
    todo: 'Mobilidade e reação para acompanhar trocas físicas intensas, sem receber Boogie Woogie.',
    toji: 'Arrancadas e mudanças de posição que deixam pouco tempo para o adversário reagir.',
  },
  endurance: {
    megumi:
      'Tolerância para continuar uma troca física sob pressão, com limites diante de golpes intensos.',
    panda:
      'Referência de tolerância a impactos em confronto direto, sem receber núcleos ou formas de Panda.',
    todo: 'Resistência para suportar golpes e manter a pressão no combate próximo.',
    'yuji-goodwill':
      'Resistência para continuar em combate após impactos sucessivos, sem cura automática.',
    hanami:
      'Resistência para permanecer em combate após ofensivas sucessivas, sem adquirir a constituição da maldição.',
  },
  'energy-reserve': {
    'very-low': 'Pouca energia disponível; a precisão de uso continua dependendo do controle.',
    common:
      'Quantidade comum na escala do jogo, separada do controle e da potência de cada descarga.',
    high: 'Estoque elevado para aplicações compatíveis, sem aumentar o output automaticamente.',
    exceptional: 'Reserva excepcional e finita, independente da precisão de uso.',
    immense:
      'Estoque imenso e finito; a quantidade liberada de uma vez continua dependendo do output.',
  },
  'technique-presence': {
    yes: 'Uma técnica compatível será sorteada na próxima etapa.',
    no: 'Nenhuma técnica inata foi atribuída; os recursos gerais compatíveis de energia e equipamento continuam disponíveis.',
  },
  recovery: {
    'no-rct': 'Nenhuma capacidade de Técnica Reversa foi atribuída.',
    'self-limited': 'Capacidade de tentar reparos próprios limitados usando Técnica Reversa.',
    'self-advanced':
      'Repertório de reparos próprios mais amplos, condicionado à energia, controle e lesão.',
    'heal-others':
      'Capacidade de tentar tratar a si e outras pessoas compatíveis, consumindo energia.',
    'spirit-untrained': 'A recomposição do espírito ainda é pouco desenvolvida.',
    'spirit-limited':
      'Capacidade limitada de recompor o próprio corpo com energia amaldiçoada, sem RCT humana.',
    'spirit-developed':
      'Recomposição própria mais desenvolvida, sem recuperação ilimitada ou RCT humana.',
    'external-repair':
      'O corpo artificial exige reparação compatível com sua constituição, sem receber cura humana.',
    'natural-recovery': 'Nenhuma cura especial foi atribuída à fisiologia simuriana nesta versão.',
  },
  'anti-domain': {
    none: 'Nenhuma defesa especializada contra domínios foi atribuída.',
    'simple-domain':
      'Defesa aprendida contra o acerto garantido, sujeita a sustentação e às condições do domínio adversário.',
    'hollow-wicker-basket':
      'Recurso defensivo contra o acerto garantido, com ativação e sustentação pelo selo das mãos.',
    'falling-blossom':
      'Resposta de energia a ataques em contato; não é uma barreira nem defesa universal.',
  },
  equipment: {
    none: 'Nenhum equipamento foi atribuído.',
    conventional:
      'Arma física sem energia imbuída; a posse não permite presumir exorcismo de maldições.',
    'common-tool': 'Ferramenta já imbuída para atingir maldições, sem técnica especial concedida.',
    'high-tool': 'Ferramenta imbuída de grau elevado, sem dano garantido ou perícia automática.',
    'playful-cloud':
      'Arma articulada cujo aproveitamento depende da força física e do treinamento; não acrescenta uma técnica.',
    'inverted-spear':
      'A lâmina pode interromper uma técnica alcançada por contato, sem exigir energia própria do portador.',
    'soul-katana':
      'Lâmina disponível para uso físico compatível; o efeito pleno sobre almas permanece bloqueado nesta versão.',
  },
  'domain-expansion': {
    none: 'Não manifesta a expansão; a formação em barreiras e os demais recursos recebidos permanecem.',
    'chimera-shadow-garden':
      'Manifestação incompleta, sem barreira fechada convencional ou acerto garantido.',
    'self-embodiment-of-perfection':
      'Expansão completa documentada de Transfiguração Ociosa; suas interações e limites continuam valendo.',
    'coffin-of-the-iron-mountain':
      'Expansão completa documentada das chamas de Jogo, sem transferir a potência do personagem de referência.',
  },
};
