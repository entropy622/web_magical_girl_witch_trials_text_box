import { create } from 'zustand';

export type LayoutType = 'text_box' | 'sketchbook' | 'lunpo';

export interface LunpoTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

export interface LunpoColorAdjust {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
}

interface AppState {
  selectedCharId: string;
  expressionIndex: number; // 1-based index (对应 Python (1)...(N))
  bgIndex: number; // 1-based index (1-16)
  textContent: string;
  isFontLoaded: boolean;

  textAlign: 'left' | 'center' | 'right';
  setTextAlign: (align: 'left' | 'center' | 'right') => void;

  layoutType: LayoutType;
  lunpoCharacterUrl: string;
  lunpoTransform: LunpoTransform;
  lunpoColorAdjust: LunpoColorAdjust;

  // Actions
  setCharacter: (id: string) => void;
  setExpression: (index: number) => void;
  setBackground: (index: number) => void;
  setText: (text: string) => void;
  setFontLoaded: (loaded: boolean) => void;

  setLayoutType: (mode: LayoutType) => void;
  setLunpoCharacterUrl: (url: string) => void;
  setLunpoTransform: (patch: Partial<LunpoTransform>) => void;
  setLunpoColorAdjust: (patch: Partial<LunpoColorAdjust>) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedCharId: 'sherri', // 默认橘雪莉
  expressionIndex: 1,
  bgIndex: 1,
  textContent: '',
  isFontLoaded: false,
  textAlign: 'left',

  layoutType: 'text_box',
  lunpoCharacterUrl: '/lunpo/assets-Ema/RefuteCutIn_Ema_001.png',
  lunpoTransform: {
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    rotation: 0,
    flipX: false,
    flipY: false,
  },
  lunpoColorAdjust: {
    hue: 0,
    saturation: 100,
    brightness: 100,
    contrast: 100,
  },

  setCharacter: (id) => set({ selectedCharId: id, expressionIndex: 1 }), // 切换角色重置表情
  setExpression: (index) => set({ expressionIndex: index }),
  setBackground: (index) => set({ bgIndex: index }),
  setText: (text) => set({ textContent: text }),
  setFontLoaded: (loaded) => set({ isFontLoaded: loaded }),
  setTextAlign: (align) => set({ textAlign: align }),

  setLayoutType: (type) => set({ layoutType: type, expressionIndex: 1 }),
  setLunpoCharacterUrl: (url) => set({ lunpoCharacterUrl: url }),
  setLunpoTransform: (patch) =>
    set((state) => ({ lunpoTransform: { ...state.lunpoTransform, ...patch } })),
  setLunpoColorAdjust: (patch) =>
    set((state) => ({ lunpoColorAdjust: { ...state.lunpoColorAdjust, ...patch } })),
}));
