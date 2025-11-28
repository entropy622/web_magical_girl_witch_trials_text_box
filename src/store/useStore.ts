import { create } from 'zustand';

export type LayoutType = 'text_box' | 'sketchbook';

interface AppState {
  selectedCharId: string;
  expressionIndex: number; // 1-based index (对应 Python (1)...(N))
  bgIndex: number; // 1-based index (1-16)
  textContent: string;
  isFontLoaded: boolean;

  textAlign: 'left' | 'center' | 'right';
  setTextAlign: (align: 'left' | 'center' | 'right') => void;

  layoutType: LayoutType;

  // Actions
  setCharacter: (id: string) => void;
  setExpression: (index: number) => void;
  setBackground: (index: number) => void;
  setText: (text: string) => void;
  setFontLoaded: (loaded: boolean) => void;

  setLayoutType: (mode: LayoutType) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedCharId: 'sherri', // 默认橘雪莉
  expressionIndex: 1,
  bgIndex: 1,
  textContent: '',
  isFontLoaded: false,
  textAlign: 'left',

  layoutType: 'text_box',

  setCharacter: (id) => set({ selectedCharId: id, expressionIndex: 1 }), // 切换角色重置表情
  setExpression: (index) => set({ expressionIndex: index }),
  setBackground: (index) => set({ bgIndex: index }),
  setText: (text) => set({ textContent: text }),
  setFontLoaded: (loaded) => set({ isFontLoaded: loaded }),
  setTextAlign: (align) => set({ textAlign: align }),

  setLayoutType: (type) => set({ layoutType: type }),
}));
