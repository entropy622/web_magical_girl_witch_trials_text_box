import { useEffect, useId, useRef } from 'react';
import { useStore } from '../../store/useStore.ts';

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onReset?: () => void;
}

const RangeField: React.FC<RangeFieldProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onReset,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{value}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-pink-500 hover:text-pink-700"
            >
              重置
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pink-500"
      />
    </div>
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hslToHex = (h: number, s: number, l: number) => {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = (h % 360) / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (huePrime >= 0 && huePrime < 1) [r, g, b] = [chroma, x, 0];
  else if (huePrime >= 1 && huePrime < 2) [r, g, b] = [x, chroma, 0];
  else if (huePrime >= 2 && huePrime < 3) [r, g, b] = [0, chroma, x];
  else if (huePrime >= 3 && huePrime < 4) [r, g, b] = [0, x, chroma];
  else if (huePrime >= 4 && huePrime < 5) [r, g, b] = [x, 0, chroma];
  else if (huePrime >= 5 && huePrime < 6) [r, g, b] = [chroma, 0, x];
  const m = lightness - chroma / 2;
  const toHex = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
};

const DEFAULT_CHARACTER_URL = '/lunpo/assets-Ema/RefuteCutIn_Ema_001.png';
const DEFAULT_TRANSFORM = {
  offsetX: 0,
  offsetY: 0,
  scale: 100,
  rotation: 0,
  flipX: false,
  flipY: false,
};
const DEFAULT_COLOR = {
  hue: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
};

export default function LunpoController() {
  const {
    lunpoCharacterUrl,
    lunpoTransform,
    lunpoColorAdjust,
    setLunpoCharacterUrl,
    setLunpoTransform,
    setLunpoColorAdjust,
  } = useStore();
  const lastBlobUrlRef = useRef<string | null>(null);
  const fileInputId = useId();

  useEffect(() => {
    return () => {
      if (lastBlobUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    if (lastBlobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
    }
    lastBlobUrlRef.current = nextUrl;
    setLunpoCharacterUrl(nextUrl);
    event.target.value = '';
  };

  const colorPickerValue = hslToHex(
    (lunpoColorAdjust.hue + 360) % 360,
    clamp(lunpoColorAdjust.saturation / 2, 0, 100),
    clamp(lunpoColorAdjust.brightness - 50, 0, 100)
  );

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <label className="block text-sm font-bold text-gray-700">角色立绘</label>
          <button
            type="button"
            onClick={() => setLunpoCharacterUrl(DEFAULT_CHARACTER_URL)}
            className="text-xs text-pink-500 hover:text-pink-700"
          >
            重置
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor={fileInputId}
            className="group relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer"
            title="点击更换立绘"
          >
            <img
              src={lunpoCharacterUrl}
              alt="角色预览"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              点击更换
            </div>
          </label>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={fileInputId}
              className="inline-flex items-center justify-center rounded-md border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs text-pink-600 hover:bg-pink-100 cursor-pointer"
            >
              上传立绘
            </label>
            <span className="text-xs text-gray-500">支持 PNG / WebP / JPG</span>
          </div>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-700">角色变换</label>
          <button
            type="button"
            onClick={() => setLunpoTransform(DEFAULT_TRANSFORM)}
            className="text-xs text-pink-500 hover:text-pink-700"
          >
            重置
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-gray-600">位移 X</label>
              <button
                type="button"
                onClick={() => setLunpoTransform({ offsetX: DEFAULT_TRANSFORM.offsetX })}
                className="text-xs text-pink-500 hover:text-pink-700"
              >
                重置
              </button>
            </div>
            <input
              type="number"
              value={lunpoTransform.offsetX}
              onChange={(e) => setLunpoTransform({ offsetX: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-gray-600">位移 Y</label>
              <button
                type="button"
                onClick={() => setLunpoTransform({ offsetY: DEFAULT_TRANSFORM.offsetY })}
                className="text-xs text-pink-500 hover:text-pink-700"
              >
                重置
              </button>
            </div>
            <input
              type="number"
              value={lunpoTransform.offsetY}
              onChange={(e) => setLunpoTransform({ offsetY: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            />
          </div>
        </div>
        <RangeField
          label="缩放 (%)"
          value={lunpoTransform.scale}
          min={20}
          max={200}
          onChange={(value) => setLunpoTransform({ scale: value })}
          onReset={() => setLunpoTransform({ scale: DEFAULT_TRANSFORM.scale })}
        />
        <RangeField
          label="旋转 (deg)"
          value={lunpoTransform.rotation}
          min={-180}
          max={180}
          onChange={(value) => setLunpoTransform({ rotation: value })}
          onReset={() => setLunpoTransform({ rotation: DEFAULT_TRANSFORM.rotation })}
        />
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lunpoTransform.flipX}
                onChange={(e) => setLunpoTransform({ flipX: e.target.checked })}
              />
              水平翻转
            </label>
            <button
              type="button"
              onClick={() => setLunpoTransform({ flipX: DEFAULT_TRANSFORM.flipX })}
              className="text-xs text-pink-500 hover:text-pink-700"
            >
              重置
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lunpoTransform.flipY}
                onChange={(e) => setLunpoTransform({ flipY: e.target.checked })}
              />
              垂直翻转
            </label>
            <button
              type="button"
              onClick={() => setLunpoTransform({ flipY: DEFAULT_TRANSFORM.flipY })}
              className="text-xs text-pink-500 hover:text-pink-700"
            >
              重置
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-700">背景调色</label>
          <button
            type="button"
            onClick={() => setLunpoColorAdjust(DEFAULT_COLOR)}
            className="text-xs text-pink-500 hover:text-pink-700"
          >
            重置
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorPickerValue}
              onChange={(e) => {
                const { h, s, l } = hexToHsl(e.target.value);
                setLunpoColorAdjust({
                  hue: h,
                  saturation: clamp(s * 2, 0, 200),
                  brightness: clamp(l + 50, 50, 150),
                });
              }}
              className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-1"
            />
            <span className="text-xs text-gray-500">调色盘</span>
          </div>
          <button
            type="button"
            onClick={() => setLunpoColorAdjust(DEFAULT_COLOR)}
            className="text-xs text-pink-500 hover:text-pink-700"
          >
            重置
          </button>
        </div>
      </section>
    </>
  );
}
