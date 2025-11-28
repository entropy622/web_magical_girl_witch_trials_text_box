import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Text } from 'react-konva';
const INIT_FONT = 120;

export default function AutoFitText({
  text,
  maxWidth,
  maxHeight,
  x,
  y,
  align,
}: {
  text: string;
  maxWidth: number;
  maxHeight: number;
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
}) {
  const textRef = useRef<Konva.Text>(null);
  const [fontSize, setFontSize] = useState(80);

  useEffect(() => {
    if (textRef.current) {
      let currentSize = INIT_FONT;
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
      align={align}
      verticalAlign="middle"
    />
  );
}
