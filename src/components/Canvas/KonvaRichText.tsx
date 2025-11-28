import React, { useMemo } from 'react';
import { Group, Text } from 'react-konva';
import { calculateRichTextLayout } from '../../utils/richText.ts';

interface KonvaRichTextProps {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
}

export const KonvaRichText: React.FC<KonvaRichTextProps> = ({
  text,
  x,
  y,
  width,
  height,
  fontSize = 24, // 默认字号，会被自适应逻辑覆盖
}) => {
  // 使用 useMemo 缓存计算结果，避免每一帧都重算
  const layout = useMemo(() => {
    return calculateRichTextLayout(text, width, height, fontSize);
  }, [text, width, height, fontSize]);

  return (
    <Group x={x} y={y}>
      {layout.tokens.map((token, i) => (
        <Text
          key={i}
          text={token.text}
          x={token.x}
          y={token.y}
          fontSize={fontSize}
          fill={token.color}
          fontFamily="MagicalFont"
        />
      ))}
    </Group>
  );
};
