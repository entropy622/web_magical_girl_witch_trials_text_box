import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Download, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import { GithubIcon } from '../../data/icons.tsx';
import TextBoxController from './TextBoxController.tsx';
import ControllerButton from './smallComponents/ControllerButton.tsx';
import SketchController from './SketchController.tsx';
import { ShareButton } from './ShareButton.tsx';
import LunpoController from './LunpoController.tsx';

interface SidebarProps {
  onDownload: () => void;
  onCopy: () => Promise<void>;
  onGenerateBlob: () => Promise<Blob | null>;
  onExportVideo: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onDownload,
  onCopy,
  onGenerateBlob,
  onExportVideo,
}) => {
  const { layoutType, setLayoutType } = useStore();

  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyClick = async () => {
    if (isCopying) return;
    setIsCopying(true);
    setCopySuccess(false);
    try {
      await onCopy();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
      alert('复制失败，请重试（部分浏览器不支持此功能）');
    } finally {
      setIsCopying(false);
    }
  };

  const handleExportClick = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onExportVideo();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full md:w-96 bg-white shadow-xl flex flex-col h-auto md:h-full md:overflow-y-auto border-r border-gray-200 pb-10 md:pb-0">
      {/* 标题栏 */}
      <div className="p-4 md:p-6 bg-pink-500 text-white">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          魔女审判表情包生成器
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
          <a
            href="https://github.com/KonshinHaoshin/webgal-mygo-terre-EM"
            target="_blank"
            rel="noreferrer"
            className={'underline pl-2'}
          >
            魔裁WebGAL引擎
          </a>
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-6 md:space-y-8 flex-1">
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3">选择画布</label>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
            <ControllerButton
              text={'文本框'}
              onClick={() => setLayoutType('text_box')}
              highlight={layoutType === 'text_box'}
            ></ControllerButton>
            <ControllerButton
              text={'安安传话筒'}
              onClick={() => setLayoutType('sketchbook')}
              highlight={layoutType === 'sketchbook'}
            ></ControllerButton>
            <ControllerButton
              text={'论破动画'}
              onClick={() => setLayoutType('lunpo')}
              highlight={layoutType === 'lunpo'}
            ></ControllerButton>
          </div>
        </section>

        {(() => {
          switch (layoutType) {
            case 'sketchbook':
              return <SketchController></SketchController>;
            case 'text_box':
              return <TextBoxController></TextBoxController>;
            case 'lunpo':
              return <LunpoController></LunpoController>;
          }
        })()}
      </div>

      <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
        {layoutType === 'lunpo' ? (
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className={clsx(
              'flex-1 py-3 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold transition-all active:scale-95 text-sm md:text-base',
              isExporting
                ? 'bg-blue-400'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            )}
          >
            {isExporting ? '导出中...' : '导出 WebM'}
          </button>
        ) : (
          <>
            <button
              onClick={onDownload}
              className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold transition-all active:scale-95 text-sm md:text-base"
            >
              <Download size={18} />
              保存
            </button>

            <ShareButton
              onGenerateBlob={onGenerateBlob}
              className="flex-1 py-3 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl shadow-sm text-sm md:text-base"
            />

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
          </>
        )}
      </div>
    </div>
  );
};
