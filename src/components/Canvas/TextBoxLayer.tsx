import { Group, Layer, Text } from 'react-konva';
import { CharacterConfig, TEXT_BOX_CANVAS_BASE, TEXT_BOX_CONFIG } from '../../data/characters.ts';
import AutoFitText from './AutoFitText.tsx';
import { URLImage } from './URLImage.tsx';

export default function TextBoxLayer({
  textContent,
  textAlign,
  bgPath,
  charPath,
  charConfig,
  width = TEXT_BOX_CANVAS_BASE.width,
  height = TEXT_BOX_CANVAS_BASE.height,
}: {
  textContent: string;
  textAlign: 'left' | 'center' | 'right';
  bgPath: string;
  charPath: string;
  charConfig: CharacterConfig;
  width?: number;
  height?: number;
}) {
  return (
    <Layer>
      <URLImage src={bgPath} x={0} y={0} width={width} height={height} />

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
        align={textAlign}
      />
    </Layer>
  );
}
