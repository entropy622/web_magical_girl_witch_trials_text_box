import React, { useRef, useState, useLayoutEffect } from 'react';
import { Stage } from 'react-konva';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import TextBoxLayer from './TextBoxLayer.tsx';
import { getCanvasBase } from '../../data/canvas.ts';
import SketchbookLayer from './SketchbookLayer.tsx';
import { isMobile } from '../../utils/isMobile.ts';

interface MagicalCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const MagicalCanvas: React.FC<MagicalCanvasProps> = ({ stageRef }) => {
  const { isFontLoaded, layoutType } = useStore();

  const CANVAS_BASE = getCanvasBase(layoutType);

  const containerRef = useRef<HTMLDivElement>(null);
  // 1. 初始值估算：根据窗口宽度预判 Canvas 缩放比例，防止第一帧画面过大或过小
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;

      // --- 宽度计算 ---
      let availableWidth = window.innerWidth;
      // 桌面端: 减去侧边栏(384) + padding(48)
      if (!isMobile) {
        availableWidth -= 384 + 48;
      } else {
        // 移动端: 减去 padding(32)
        availableWidth -= 32;
      }
      const scaleW = availableWidth / CANVAS_BASE.width;

      // --- 高度计算 ---
      // 移动端限制为屏幕高度的 30%
      // 桌面端限制为屏幕高度的 90%
      const maxH = isMobile ? window.innerHeight * 0.3 : window.innerHeight * 0.9;
      const scaleH = maxH / CANVAS_BASE.height;

      // 取两者较小值，确保能同时放入宽和高
      return Math.max(0.1, Math.min(scaleW, scaleH));
    }
    return 0.5;
  });

  // const [hasInit, setHasInit] = useState(false);
  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;

        // 只有宽度有效时才更新
        if (containerWidth > 0) {
          // 1. 基于宽度的缩放
          const scaleW = containerWidth / CANVAS_BASE.width;
          // 2. 基于高度的缩放 (新增逻辑)
          // 移动端限制为 30vh, 桌面端限制为 90vh
          const maxH = isMobile() ? window.innerHeight * 0.3 : window.innerHeight * 0.9;
          const scaleH = maxH / CANVAS_BASE.height;
          // 3. 取较小值 (Contain 模式)
          // 这样既不会撑破宽度，也不会撑破高度
          const newScale = Math.min(scaleW, scaleH);
          setScale(newScale);
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // 前 500ms 内每 100ms 检查一次，解决 React 刷新/热更新时 DOM 尚未完全排版导致 offsetWidth 为 0 或不准的问题
    const interval = setInterval(updateSize, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 500);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('resize', updateSize);
    };
  }, [CANVAS_BASE.height, CANVAS_BASE.width]);

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
          {(() => {
            switch (layoutType) {
              case 'sketchbook':
                return <SketchbookLayer></SketchbookLayer>;
              case 'text_box':
                return <TextBoxLayer></TextBoxLayer>;
            }
          })()}
        </Stage>
      </div>
    </div>
  );
};
