import clsx from 'clsx';
import { RefreshCcw } from 'lucide-react';
import { useStore } from '../../store/useStore.ts';
import { SKETCHBOOK_CONFIG } from '../../data/ananSketchbook.ts';

export default function SketchController() {
  const { expressionIndex, setExpression, textContent, setText } = useStore();
  return (
    <>
      {/* 2. 表情选择 */}
      <section>
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <label className="block text-sm font-bold text-gray-700">
            选择表情 ({expressionIndex})
          </label>
          <button
            onClick={() =>
              setExpression(Math.floor(Math.random() * SKETCHBOOK_CONFIG.emotionCount) + 1)
            }
            className="text-xs flex items-center text-pink-500 hover:text-pink-700"
          >
            <RefreshCcw size={12} className="mr-1" /> 随机
          </button>
        </div>

        {/* 移动端: 显示更多列 (5列), 桌面端 (4列) */}
        <div className="grid grid-cols-5 md:grid-cols-4 gap-2 overflow-y-auto p-1">
          {Array.from({ length: SKETCHBOOK_CONFIG.emotionCount }).map((_, i) => {
            const idx = i + 1;
            return (
              <button
                key={idx}
                onClick={() => setExpression(idx)}
                className={clsx(
                  'aspect-square rounded-md overflow-hidden border-2 transition-all relative group',
                  expressionIndex === idx
                    ? 'border-pink-500 ring-2 ring-pink-200'
                    : 'border-gray-200'
                )}
                title={`表情 ${idx}`}
              >
                <img
                  src={SKETCHBOOK_CONFIG.getImgPath(idx)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  alt={`Exp ${idx}`}
                />
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">输入台词</label>
        {/*<AlignSwitcher></AlignSwitcher>*/}
        <textarea
          value={textContent}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 md:h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none bg-gray-50 text-base"
          placeholder="在这里输入魔法少女的台词..."
        />
      </section>
    </>
  );
}
