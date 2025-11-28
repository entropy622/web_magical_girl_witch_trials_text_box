import { Layer } from 'react-konva';
import { URLImage } from './URLImage';
import AutoFitRichText from './AutoFitRichText.tsx';
import { SKETCHBOOK_CANVAS_BASE } from '../../data/canvas.ts';
import { SKETCHBOOK_CONFIG } from '../../data/ananSketchbook.ts';
import { useStore } from '../../store/useStore.ts';

export default function SketchbookLayer({
  width = SKETCHBOOK_CANVAS_BASE.width,
  height = SKETCHBOOK_CANVAS_BASE.height,
}: {
  width?: number;
  height?: number;
}) {
  const { expressionIndex, textContent } = useStore();

  const textPos = SKETCHBOOK_CONFIG.sketchTextPos;

  return (
    <Layer>
      {/* 素描本模式：
         角色图 (charPath) 即为背景，铺满画布
      */}
      <URLImage
        src={SKETCHBOOK_CONFIG.getImgPath(expressionIndex)}
        x={0}
        y={0}
        width={width}
        height={height}
      />

      {/* 富文本组件：支持 [变色] */}
      <AutoFitRichText
        text={textContent}
        x={textPos.x}
        y={textPos.y}
        width={textPos.width}
        height={textPos.height}
      />

      <URLImage
        src={SKETCHBOOK_CONFIG.getOverlayImgPath()}
        x={0}
        y={0}
        width={width}
        height={height}
      />
    </Layer>
  );
}
