import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Download, Copy, Check } from 'lucide-react'; // 引入 Copy 和 Check 图标
import clsx from 'clsx';
import { GithubIcon } from '../../data/icons.tsx';
import TextBoxController from './TextBoxController.tsx';
import ControllerButton from './smallComponents/ControllerButton.tsx';
import SketchController from './SketchController.tsx';

interface SidebarProps {
  onDownload: () => void;
  onCopy: () => Promise<void>; // 新增 prop
}

export const Sidebar: React.FC<SidebarProps> = ({ onDownload, onCopy }) => {
  const { layoutType, setLayoutType } = useStore();

  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
          魔女审判文本框生成器
        </h1>
        <p className="text-pink-100 text-xs md:text-sm mt-1 flex items-center gap-2">
          <GithubIcon className={'size-6'}></GithubIcon>
          <a
            href="https://github.com/entropy622/web_magical_girl_witch_trials_text_box"
            target="_blank"
            rel="noreferrer"
            className={'underline'}
          >
            仓库地址
          </a>
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-6 md:space-y-8 flex-1">
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">选择画布</label>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
            <ControllerButton
              text={'文本框'}
              onClick={() => setLayoutType('text_box')}
              highlight={layoutType === 'text_box'}
            ></ControllerButton>
            <ControllerButton
              text={'安安画板'}
              onClick={() => setLayoutType('sketchbook')}
              highlight={layoutType === 'sketchbook'}
            ></ControllerButton>
          </div>
        </section>

        {(() => {
          switch (layoutType) {
            case 'sketchbook':
              return <SketchController></SketchController>;
            case 'text_box':
              return <TextBoxController></TextBoxController>;
          }
        })()}
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
