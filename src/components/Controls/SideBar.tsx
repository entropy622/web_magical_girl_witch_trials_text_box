import React from 'react';
import { useStore } from '../../store/useStore';
import { CHARACTERS } from '../../data/characters';
import { Download, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  onDownload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onDownload }) => {
  const {
    selectedCharId,
    expressionIndex,
    bgIndex,
    textContent,
    setCharacter,
    setExpression,
    setBackground,
    setText,
  } = useStore();

  const currentChar = CHARACTERS[selectedCharId];

  return (
    <div className="w-full md:w-96 bg-white shadow-xl flex flex-col h-screen overflow-y-auto border-r border-gray-200">
      <div className="p-6 bg-pink-500 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎭</span> 魔女裁判文本生成器
        </h1>
        <p className="text-pink-100 text-sm mt-1">Web 可视化版</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* 1. 角色选择 */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-3">选择角色</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(CHARACTERS).map((char) => (
              <button
                key={char.id}
                onClick={() => setCharacter(char.id)}
                className={clsx(
                  'px-4 py-2 text-sm rounded-md transition-all border',
                  selectedCharId === char.id
                    ? 'bg-pink-500 text-white border-pink-600 shadow-md'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-pink-50'
                )}
              >
                {char.name}
              </button>
            ))}
          </div>
        </section>

        {/* 2. 表情选择 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700">
              选择表情 ({expressionIndex})
            </label>
            <button
              onClick={() =>
                setExpression(Math.floor(Math.random() * currentChar.emotionCount) + 1)
              }
              className="text-xs flex items-center text-pink-500 hover:text-pink-700"
            >
              <RefreshCcw size={12} className="mr-1" /> 随机
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {Array.from({ length: currentChar.emotionCount }).map((_, i) => {
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
                  {/* 这里显示缩略图，实际项目可以用 img 标签加载 assets 下的小图 */}
                  {/* 为了节省带宽，这里用色块或懒加载 */}
                  <img
                    src={`/assets/characters/${selectedCharId}/${selectedCharId} (${idx}).png`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    alt={`Exp ${idx}`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. 背景选择 */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-3">选择背景 ({bgIndex})</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 16 }).map((_, i) => {
              const idx = i + 1;
              return (
                <button
                  key={idx}
                  onClick={() => setBackground(idx)}
                  className={clsx(
                    'w-16 h-12 flex-shrink-0 rounded border-2 overflow-hidden',
                    bgIndex === idx ? 'border-blue-500' : 'border-gray-200'
                  )}
                >
                  <img
                    src={`/assets/backgrounds/c${idx}.png`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. 文本输入 */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-3">输入台词</label>
          <textarea
            value={textContent}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none bg-gray-50"
            placeholder="在这里输入魔法少女的台词..."
          />
        </section>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onDownload}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg font-bold transition-transform active:scale-95"
        >
          <Download size={24} />
          生成图片 (Save)
        </button>
      </div>
    </div>
  );
};
