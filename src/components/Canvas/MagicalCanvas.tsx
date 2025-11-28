import React, { useRef, useState, useLayoutEffect } from 'react';
import { Stage } from 'react-konva';
import { CHARACTERS, getCanvasBase } from '../../data/characters';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import TextBoxLayer from './TextBoxLayer.tsx';

interface MagicalCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const MagicalCanvas: React.FC<MagicalCanvasProps> = ({ stageRef }) => {
  const {
    selectedCharId,
    expressionIndex,
    bgIndex,
    textContent,
    isFontLoaded,
    textAlign,
    layoutType,
  } = useStore();

  const CANVAS_BASE = getCanvasBase(layoutType);

  const charConfig = CHARACTERS[selectedCharId];
  const containerRef = useRef<HTMLDivElement>(null);
  // 1. 初始值估算：根据窗口宽度预判 Canvas 缩放比例，防止第一帧画面过大或过小
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      let availableWidth = window.innerWidth;
      // 桌面端 (md breakpoint 768px): 减去侧边栏 (w-96 = 384px) 和一些 padding
      if (window.innerWidth >= 768) {
        availableWidth -= 384;
        availableWidth -= 48;
      } else {
        // 移动端: 减去 padding
        availableWidth -= 32;
      }
      // 限制在 0.1 ~ 1 之间
      return Math.min(1, Math.max(0.1, availableWidth / CANVAS_BASE.width));
    }
    return 0.5; // 服务端渲染或无法获取窗口时的兜底值
  });

  const [hasInit, setHasInit] = useState(false);
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

    if (hasInit) return;
    setHasInit(true);
    // 前 500ms 内每 100ms 检查一次，解决 React 刷新/热更新时 DOM 尚未完全排版导致 offsetWidth 为 0 或不准的问题
    const interval = setInterval(updateSize, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 500);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateSize);
    };
  }, [hasInit]);

  const getAssetPath = (path: string) => {
    return path;
  };

  const bgPath = getAssetPath(`assets/backgrounds/c${bgIndex}.webp`);
  const charPath = getAssetPath(
    `assets/characters/${charConfig.id}/${charConfig.id} (${expressionIndex}).webp`
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
          width={CANVAS_BASE.width * scale}
          height={CANVAS_BASE.height * scale}
          scaleX={scale}
          scaleY={scale}
          ref={stageRef}
        >
          <TextBoxLayer
            textContent={textContent}
            textAlign={textAlign}
            bgPath={bgPath}
            charPath={charPath}
            charConfig={charConfig}
          ></TextBoxLayer>
        </Stage>
      </div>
    </div>
  );
};
