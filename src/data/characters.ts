// 移植自 main.py 和 text_configs_dict
// 颜色格式转换辅助
import { LayoutType } from '../store/useStore.ts';

const rgb = (r: number, g: number, b: number) => `rgb(${r},${g},${b})`;

export const TEXT_BOX_CANVAS_BASE = {
  width: 2560,
  height: 834,
};
export const SKETCHBOOK_CANVAS_BASE = {
  width: 514,
  height: 648,
};

export function getCanvasBase(layoutType: LayoutType) {
  switch (layoutType) {
    case 'text_box':
      return TEXT_BOX_CANVAS_BASE;
    case 'sketchbook':
      return SKETCHBOOK_CANVAS_BASE;
  }
}

export interface CharacterConfig {
  id: string;
  name: string;
  emotionCount: number;
  overlays: {
    text: string;
    position: [number, number]; // x, y
    color: string;
    fontSize: number;
  }[];
}

// 文本框区域 (移植自 main.py mahoshojo_postion 和 mahoshojo_over)
// Start: [728, 355], End: [2339, 800]
// Canvas 原始尺寸假设基于背景图，通常是 1920x1080 或更大，这里根据坐标推算
export const TEXT_BOX_CONFIG = {
  x: 728,
  y: 355,
  width: 2339 - 728, // 1611
  height: 800 - 355, // 445
};

export const CHARACTERS: Record<string, CharacterConfig> = {
  ema: {
    id: 'ema',
    name: '樱羽艾玛',
    emotionCount: 8,
    overlays: [
      { text: '樱', position: [759, 73], color: rgb(253, 145, 175), fontSize: 186 },
      { text: '羽', position: [949, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '艾', position: [1039, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '玛', position: [1183, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  hiro: {
    id: 'hiro',
    name: '二阶堂希罗',
    emotionCount: 6,
    overlays: [
      { text: '二', position: [759, 63], color: rgb(239, 79, 84), fontSize: 196 },
      { text: '阶堂', position: [955, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '希', position: [1143, 110], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '罗', position: [1283, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  sherri: {
    id: 'sherri',
    name: '橘雪莉',
    emotionCount: 7,
    overlays: [
      { text: '橘', position: [759, 73], color: rgb(137, 177, 251), fontSize: 186 },
      { text: '雪', position: [943, 110], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '莉', position: [1093, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  hanna: {
    id: 'hanna',
    name: '远野汉娜',
    emotionCount: 5,
    overlays: [
      { text: '远', position: [759, 73], color: rgb(169, 199, 30), fontSize: 186 },
      { text: '野', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '汉', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '娜', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  anan: {
    id: 'anan',
    name: '夏目安安',
    emotionCount: 9,
    overlays: [
      { text: '夏', position: [759, 73], color: rgb(159, 145, 251), fontSize: 186 },
      { text: '目', position: [949, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '安', position: [1039, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '安', position: [1183, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  yuki: {
    id: 'yuki',
    name: '月代雪',
    emotionCount: 18,
    overlays: [
      { text: '月', position: [759, 63], color: rgb(195, 209, 231), fontSize: 196 },
      { text: '代', position: [948, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '雪', position: [1053, 117], color: rgb(255, 255, 255), fontSize: 147 },
    ],
  },
  meruru: {
    id: 'meruru',
    name: '冰上梅露露',
    emotionCount: 6,
    overlays: [
      { text: '冰', position: [759, 73], color: rgb(227, 185, 175), fontSize: 186 },
      { text: '上', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '梅', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '露露', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  noa: {
    id: 'noa',
    name: '城崎诺亚',
    emotionCount: 6,
    overlays: [
      { text: '城', position: [759, 73], color: rgb(104, 223, 231), fontSize: 186 },
      { text: '崎', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '诺', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '亚', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  reia: {
    id: 'reia',
    name: '莲见蕾雅',
    emotionCount: 7,
    overlays: [
      { text: '莲', position: [759, 73], color: rgb(253, 177, 88), fontSize: 186 },
      { text: '见', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '蕾', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '雅', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  miria: {
    id: 'miria',
    name: '佐伯米莉亚',
    emotionCount: 4,
    overlays: [
      { text: '佐', position: [759, 73], color: rgb(235, 207, 139), fontSize: 186 },
      { text: '伯', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '米', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '莉亚', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  nanoka: {
    id: 'nanoka',
    name: '黑部奈叶香',
    emotionCount: 5,
    overlays: [
      { text: '黑', position: [759, 63], color: rgb(131, 143, 147), fontSize: 196 },
      { text: '部', position: [955, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '奈', position: [1053, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '叶香', position: [1197, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  mago: {
    id: 'mago',
    name: '宝生玛格',
    emotionCount: 5,
    overlays: [
      { text: '宝', position: [759, 73], color: rgb(185, 124, 235), fontSize: 186 },
      { text: '生', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '玛', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '格', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  alisa: {
    id: 'alisa',
    name: '紫藤亚里沙',
    emotionCount: 6,
    overlays: [
      { text: '紫', position: [759, 73], color: rgb(235, 75, 60), fontSize: 186 },
      { text: '藤', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '亚', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '里沙', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
  coco: {
    id: 'coco',
    name: '泽渡可可',
    emotionCount: 5,
    overlays: [
      { text: '泽', position: [759, 73], color: rgb(251, 114, 78), fontSize: 186 },
      { text: '渡', position: [945, 175], color: rgb(255, 255, 255), fontSize: 92 },
      { text: '可', position: [1042, 117], color: rgb(255, 255, 255), fontSize: 147 },
      { text: '可', position: [1186, 175], color: rgb(255, 255, 255), fontSize: 92 },
    ],
  },
};
