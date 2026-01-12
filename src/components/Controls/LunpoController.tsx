import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore.ts';

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const RangeField: React.FC<RangeFieldProps> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">{value}</span>
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

  return (
    <>
      <section>
        <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">角色立绘</label>
        <div className="flex items-center gap-3">
          <img
            src={lunpoCharacterUrl}
            alt="角色预览"
            className="w-20 h-20 rounded-lg border border-gray-200 object-cover bg-gray-50"
          />
          <div className="flex flex-col gap-2">
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
            <button
              type="button"
              onClick={() => setLunpoCharacterUrl('/lunpo/assets-Ema/RefuteCutIn_Ema_001.png')}
              className="text-xs text-pink-500 hover:text-pink-700 text-left"
            >
              重置为默认
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-bold text-gray-700">角色变换</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">位移 X</label>
            <input
              type="number"
              value={lunpoTransform.offsetX}
              onChange={(e) => setLunpoTransform({ offsetX: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">位移 Y</label>
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
        />
        <RangeField
          label="旋转 (deg)"
          value={lunpoTransform.rotation}
          min={-180}
          max={180}
          onChange={(value) => setLunpoTransform({ rotation: value })}
        />
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lunpoTransform.flipX}
              onChange={(e) => setLunpoTransform({ flipX: e.target.checked })}
            />
            水平翻转
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lunpoTransform.flipY}
              onChange={(e) => setLunpoTransform({ flipY: e.target.checked })}
            />
            垂直翻转
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-700">背景调色</label>
          <button
            type="button"
            onClick={() =>
              setLunpoColorAdjust({ hue: 0, saturation: 100, brightness: 100, contrast: 100 })
            }
            className="text-xs text-pink-500 hover:text-pink-700"
          >
            重置
          </button>
        </div>
        <RangeField
          label="色相 (deg)"
          value={lunpoColorAdjust.hue}
          min={-180}
          max={180}
          onChange={(value) => setLunpoColorAdjust({ hue: value })}
        />
        <RangeField
          label="饱和度 (%)"
          value={lunpoColorAdjust.saturation}
          min={0}
          max={200}
          onChange={(value) => setLunpoColorAdjust({ saturation: value })}
        />
        <RangeField
          label="亮度 (%)"
          value={lunpoColorAdjust.brightness}
          min={50}
          max={150}
          onChange={(value) => setLunpoColorAdjust({ brightness: value })}
        />
        <RangeField
          label="对比度 (%)"
          value={lunpoColorAdjust.contrast}
          min={50}
          max={150}
          onChange={(value) => setLunpoColorAdjust({ contrast: value })}
        />
      </section>
    </>
  );
}
