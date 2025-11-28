import useImage from 'use-image';
import { Image as KonvaImage } from 'react-konva';

export const URLImage = ({
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
