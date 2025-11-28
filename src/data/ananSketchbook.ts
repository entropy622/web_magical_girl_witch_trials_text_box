import { getAssetPath } from '../utils/getAssetPath.ts';

export const SKETCHBOOK_CONFIG = {
  sketchTextPos: {
    x: 119,
    y: 450,
    width: 279,
    height: 175,
  },
  getImgPath: (index: number) => {
    return getAssetPath(`assets/anan_sketchbook/sketchbook (${index}).webp`);
  },
  getOverlayImgPath: () => {
    return getAssetPath(`assets/anan_sketchbook/base_overlay.webp`);
  },
};
