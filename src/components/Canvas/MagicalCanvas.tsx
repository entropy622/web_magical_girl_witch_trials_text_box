import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { CHARACTERS, TEXT_BOX_CONFIG } from '../../data/characters';
import { useStore } from '../../store/useStore';
import Konva from 'konva';

// 辅助组件：加载图片
const URLImage = ({
  src,
  x,
  y,
  width,
  height,
}: {
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

// 辅助组件：自适应文本
const AutoFitText = ({
  text,
  maxWidth,
  maxHeight,
  x,
  y,
}: {
  text: string;
  maxWidth: number;
  maxHeight: number;
  x: number;
  y: number;
}) => {
  const textRef = useRef<Konva.Text>(null);
  const [fontSize, setFontSize] = useState(80); // 初始字号

  useEffect(() => {
    // 简单的自适应逻辑：如果高度溢出，缩小字号
    if (textRef.current) {
      let currentSize = 80;
      textRef.current.fontSize(currentSize);

      // 循环缩小直到放入框内 (简化版二分法)
      while (textRef.current.height() > maxHeight && currentSize > 20) {
        currentSize -= 2;
        textRef.current.fontSize(currentSize);
      }
      setFontSize(currentSize);
    }
  }, [text, maxWidth, maxHeight]);

  return (
    <Text
      ref={textRef}
      text={text}
      x={x}
      y={y}
      width={maxWidth}
      fontSize={fontSize}
      fontFamily="MagicalFont"
      fill="white" // 默认白色，可配置
      stroke="black" // 增加一点描边增加可读性
      strokeWidth={2}
      wrap="word"
      align="center"
      verticalAlign="middle"
    />
  );
};

interface MagicalCanvasProps {
  stageRef: React.RefObject<Konva.Stage>;
}

export const MagicalCanvas: React.FC<MagicalCanvasProps> = ({ stageRef }) => {
  const { selectedCharId, expressionIndex, bgIndex, textContent, isFontLoaded } = useStore();
  const charConfig = CHARACTERS[selectedCharId];

  // 假设原始画布尺寸很大，我们在网页上需要缩放显示
  // 原始素材似乎是基于背景图的尺寸，根据 main.py 里的坐标，宽度至少 2400
  const CANVAS_WIDTH = 2500;
  const CANVAS_HEIGHT = 1400; // 估算值，根据背景图实际比例调整
  const SCALE = 0.4; // 预览时的缩放比例

  // 资源路径构建 (适配 GitHub Pages base url)
  const getAssetPath = (path: string) => {
    // 如果配置了 base path，这里需要添加 import.meta.env.BASE_URL
    return path;
  };

  const bgPath = getAssetPath(`/assets/backgrounds/c${bgIndex}.png`);
  // 注意：文件夹名称需要完全匹配 Python 生成的结构
  const charPath = getAssetPath(
    `/assets/characters/${charConfig.id}/${charConfig.id} (${expressionIndex}).png`
  );

  if (!isFontLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-white">正在加载魔法字体...</div>
    );
  }

  return (
    <div className="overflow-hidden border-4 border-pink-300 rounded-lg shadow-2xl bg-gray-900">
      <Stage
        width={CANVAS_WIDTH * SCALE}
        height={CANVAS_HEIGHT * SCALE}
        scaleX={SCALE}
        scaleY={SCALE}
        ref={stageRef}
      >
        <Layer>
          {/* 1. 背景层 */}
          <URLImage src={bgPath} x={0} y={0} />

          {/* 2. 角色层 (Python 逻辑 y=134) */}
          <URLImage src={charPath} x={0} y={134} />

          {/* 3. 装饰文字层 (角色名) */}
          {charConfig.overlays.map((overlay, idx) => (
            <Group key={idx}>
              {/* 阴影层 (+2, +2) */}
              <Text
                text={overlay.text}
                x={overlay.position[0] + 2}
                y={overlay.position[1] + 2}
                fontSize={overlay.fontSize}
                fontFamily="MagicalFont"
                fill="black"
              />
              {/* 本体层 */}
              <Text
                text={overlay.text}
                x={overlay.position[0]}
                y={overlay.position[1]}
                fontSize={overlay.fontSize}
                fontFamily="MagicalFont"
                fill={overlay.color}
              />
            </Group>
          ))}

          {/* 4. 用户内容层 */}
          <AutoFitText
            text={textContent}
            x={TEXT_BOX_CONFIG.x}
            y={TEXT_BOX_CONFIG.y}
            maxWidth={TEXT_BOX_CONFIG.width}
            maxHeight={TEXT_BOX_CONFIG.height}
          />
        </Layer>
      </Stage>
    </div>
  );
};
