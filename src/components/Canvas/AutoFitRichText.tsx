import React, { useState, useEffect } from 'react';
import { KonvaRichText } from './KonvaRichText';
import { calculateRichTextLayout } from '../../utils/richText.ts';

interface AutoFitRichTextProps {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  align?: 'left' | 'center';
  minFontSize?: number;
  maxFontSize?: number;
}

export const AutoFitRichText: React.FC<AutoFitRichTextProps> = ({
  text,
  x,
  y,
  width,
  height,
  minFontSize = 10,
  maxFontSize = 100,
}) => {
  const [fontSize, setFontSize] = useState(40);

  useEffect(() => {
    let low = minFontSize;
    let high = maxFontSize;
    let best = minFontSize;

    // 二分法查找最佳字号
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const layout = calculateRichTextLayout(text, width, height, mid);

      // 如果计算出的总高度小于等于容器高度，说明这个字号可行，尝试更大的
      if (layout.totalHeight <= height) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    setFontSize(best);
  }, [text, width, height, minFontSize, maxFontSize]);

  return (
    <KonvaRichText text={text} x={x} y={y} width={width} height={height} fontSize={fontSize} />
  );
};

export default AutoFitRichText;
