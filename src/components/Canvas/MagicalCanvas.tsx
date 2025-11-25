import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { CHARACTERS, TEXT_BOX_CONFIG, CANVAS_BASE } from '../../data/characters';
import { useStore } from '../../store/useStore';
import Konva from 'konva';

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
  const [fontSize, setFontSize] = useState(80);

  useEffect(() => {
    if (textRef.current) {
      let currentSize = 80;
      textRef.current.fontSize(currentSize);

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
      fill="white"
      stroke="black"
      strokeWidth={2}
      wrap="word"
      align="center"
      verticalAlign="middle"
    />
  );
};

interface MagicalCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const MagicalCanvas: React.FC<MagicalCanvasProps> = ({ stageRef }) => {
  const { selectedCharId, expressionIndex, bgIndex, textContent, isFontLoaded } = useStore();
  const charConfig = CHARACTERS[selectedCharId];
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // 移动端减去较小的 padding (16)，桌面端保持
        const newScale = Math.min(1, containerWidth / CANVAS_BASE.width);
        setScale(newScale);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getAssetPath = (path: string) => {
    return path;
  };

  const bgPath = getAssetPath(`/assets/backgrounds/c${bgIndex}.webp`);
  const charPath = getAssetPath(
    `/assets/characters/${charConfig.id}/${charConfig.id} (${expressionIndex}).webp`
  );

  if (!isFontLoaded) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
        正在加载资源...
      </div>
    );
  }

  const displayHeight = CANVAS_BASE.height * scale;

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center overflow-hidden py-2" // 移除 flex-1, 用 py-2 稍微给点呼吸感
      style={{ height: displayHeight + 10 }}
    >
      <div
        className="shadow-md md:shadow-2xl rounded md:rounded-lg overflow-hidden border-2 md:border-4 border-pink-300 bg-gray-900"
        style={{
          width: CANVAS_BASE.width * scale,
          height: CANVAS_BASE.height * scale,
        }}
      >
        <Stage
          width={CANVAS_BASE.width}
          height={CANVAS_BASE.height}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
        >
          <Layer>
            <URLImage
              src={bgPath}
              x={0}
              y={0}
              width={CANVAS_BASE.width}
              height={CANVAS_BASE.height}
            />

            <URLImage src={charPath} x={0} y={134} />

            {charConfig.overlays.map((overlay, idx) => (
              <Group key={idx}>
                <Text
                  text={overlay.text}
                  x={overlay.position[0] + 2}
                  y={overlay.position[1] + 2}
                  fontSize={overlay.fontSize}
                  fontFamily="MagicalFont"
                  fill="black"
                />
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
    </div>
  );
};
