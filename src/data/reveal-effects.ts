export type EffectMotif =
  | 'swap'
  | 'shadows'
  | 'blood'
  | 'limit'
  | 'voice'
  | 'ratio'
  | 'straw'
  | 'heat'
  | 'morph'
  | 'growth'
  | 'threads'
  | 'forge'
  | 'orbs'
  | 'frames'
  | 'cloud-tool'
  | 'spear-tool'
  | 'katana-tool'
  | 'equipment';
export interface RevealVisual {
  motif: EffectMotif;
  caption: string;
  domain?: true;
}

// Presentation only: abstract diagrams do not grant applications, summons or equipment.
export const revealEffects: Record<string, RevealVisual> = {
  'innate-technique/boogie-woogie': { motif: 'swap', caption: 'Troca de posições' },
  'innate-technique/ten-shadows': { motif: 'shadows', caption: 'Manipulação de sombras' },
  'innate-technique/blood-manipulation': { motif: 'blood', caption: 'Fluxo e direcionamento' },
  'innate-technique/limitless': { motif: 'limit', caption: 'Aproximação de um limite' },
  'innate-technique/cursed-speech': { motif: 'voice', caption: 'Propagação da voz' },
  'innate-technique/ratio': { motif: 'ratio', caption: 'Ponto de sete para três' },
  'innate-technique/straw-doll': { motif: 'straw', caption: 'Instrumentos e vínculos' },
  'innate-technique/jogo-flames': { motif: 'heat', caption: 'Chamas e calor' },
  'innate-technique/idle-transfiguration': { motif: 'morph', caption: 'Transformação de formas' },
  'innate-technique/hanami-plants': { motif: 'growth', caption: 'Crescimento vegetal' },
  'innate-technique/puppet-manipulation': { motif: 'threads', caption: 'Controle à distância' },
  'innate-technique/construction': { motif: 'forge', caption: 'Construção de matéria' },
  'innate-technique/cursed-spirit-manipulation': { motif: 'orbs', caption: 'Absorção e liberação' },
  'innate-technique/projection': { motif: 'frames', caption: 'Movimento em quadros' },
  'equipment/playful-cloud': { motif: 'cloud-tool', caption: 'Três seções articuladas' },
  'equipment/inverted-spear': { motif: 'spear-tool', caption: 'Lâmina de contato' },
  'equipment/soul-katana': { motif: 'katana-tool', caption: 'Percepção de almas não atribuída' },
  'equipment/conventional': { motif: 'equipment', caption: 'Equipamento em sua posse' },
  'equipment/common-tool': { motif: 'equipment', caption: 'Equipamento em sua posse' },
  'equipment/high-tool': { motif: 'equipment', caption: 'Equipamento em sua posse' },
  'domain-expansion/chimera-shadow-garden': {
    motif: 'shadows',
    caption: 'Manifestação incompleta · sem acerto garantido convencional',
    domain: true,
  },
  'domain-expansion/self-embodiment-of-perfection': {
    motif: 'morph',
    caption: 'Barreira e técnica imbuída · condições de ativação preservadas',
    domain: true,
  },
  'domain-expansion/coffin-of-the-iron-mountain': {
    motif: 'heat',
    caption: 'Ambiente vulcânico · energia e output permanecem os sorteados',
    domain: true,
  },
};
export const effectForResult = (stepId: string, resultId: string) =>
  revealEffects[`${stepId}/${resultId}`];
