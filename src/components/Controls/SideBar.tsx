import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { CHARACTERS } from '../../data/characters';
import { Download, RefreshCcw, Copy, Check } from 'lucide-react'; // 引入 Copy 和 Check 图标
import clsx from 'clsx';

interface SidebarProps {
  onDownload: () => void;
  onCopy: () => Promise<void>; // 新增 prop
}

export const Sidebar: React.FC<SidebarProps> = ({ onDownload, onCopy }) => {
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

  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const currentChar = CHARACTERS[selectedCharId];

  const handleCopyClick = async () => {
    if (isCopying) return;
    setIsCopying(true);
    setCopySuccess(false);
    try {
      await onCopy();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // 2秒后恢复图标
    } catch (error) {
      console.error('Copy failed', error);
      alert('复制失败，请重试 (部分浏览器不支持此功能)');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="w-full md:w-96 bg-white shadow-xl flex flex-col h-auto md:h-full md:overflow-y-auto border-r border-gray-200 pb-10 md:pb-0">
      {/* 标题栏 */}
      <div className="p-4 md:p-6 bg-pink-500 text-white">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <span>🎭</span> 魔女裁判文本生成器
        </h1>
        <p className="text-pink-100 text-xs md:text-sm mt-1">Web 可视化版</p>
      </div>

      <div className="p-4 md:p-6 space-y-6 md:space-y-8 flex-1">
        {/* 1. 角色选择 */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">选择角色</label>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
            {Object.values(CHARACTERS).map((char) => (
              <button
                key={char.id}
                onClick={() => setCharacter(char.id)}
                className={clsx(
                  'px-2 md:px-4 py-2 text-xs md:text-sm rounded-md transition-all border',
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
          <div className="flex justify-between items-center mb-2 md:mb-3">
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

          {/* 移动端: 显示更多列 (5列), 桌面端 (4列) */}
          <div className="grid grid-cols-5 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
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
                  <img
                    src={`/assets/characters/${selectedCharId}/${selectedCharId} (${idx}).webp`}
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
          <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">
            选择背景 ({bgIndex})
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                    src={`/assets/backgrounds/c${idx}.webp`}
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
          <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">输入台词</label>
          <textarea
            value={textContent}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-24 md:h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none bg-gray-50 text-base"
            placeholder="在这里输入魔法少女的台词..."
          />
        </section>
      </div>

      <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
        <button
          onClick={onDownload}
          className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold transition-all active:scale-95 text-sm md:text-base"
        >
          <Download size={18} />
          保存
        </button>

        <button
          onClick={handleCopyClick}
          disabled={isCopying}
          className={clsx(
            'flex-[2] py-3 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold transition-all active:scale-95 text-sm md:text-base',
            copySuccess
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
          )}
        >
          {isCopying ? (
            <span className="animate-pulse">复制中...</span>
          ) : copySuccess ? (
            <>
              <Check size={18} /> <span className="hidden sm:inline">已复制</span>
            </>
          ) : (
            <>
              <Copy size={18} /> <span className="hidden sm:inline">复制</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
