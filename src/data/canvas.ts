import { LayoutType } from '../store/useStore.ts';

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
