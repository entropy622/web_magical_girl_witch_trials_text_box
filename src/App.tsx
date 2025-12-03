import { useCallback, useEffect, useRef } from 'react';
import { MagicalCanvas } from './components/Canvas/MagicalCanvas';
import { useStore } from './store/useStore';
import { saveAs } from 'file-saver';
import Konva from 'konva';
import { Sidebar } from './components/Controls/SideBar.tsx';

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const { setFontLoaded } = useStore();

  useEffect(() => {
    // 动态加载字体
    const font = new FontFace('MagicalFont', 'url(assets/fonts/font3.ttf)');

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        setFontLoaded(true);
        console.log('Magical Font loaded successfully');
      })
      .catch((err) => {
        console.error('Failed to load font:', err);
        setFontLoaded(true);
      });
  }, [setFontLoaded]);

  // 通用导出逻辑：计算高清比例
  const getHighResRatio = () => {
    if (stageRef.current) {
      const currentScale = stageRef.current.scaleX();
      return 1 / currentScale; // 抵消缩放，还原 2560x834
    }
    return 1;
  };

  const generateBlob = useCallback(async (): Promise<Blob | null> => {
    if (!stageRef.current) return null;

    // 计算高清比例
    const currentScale = stageRef.current.scaleX();
    const pixelRatio = 1 / currentScale;

    return new Promise((resolve) => {
      stageRef.current?.toBlob({
        callback: resolve,
        mimeType: 'image/png',
        pixelRatio: pixelRatio,
      });
    });
  }, []);

  const handleDownload = () => {
    if (stageRef.current) {
      const pixelRatio = getHighResRatio();
      const uri = stageRef.current.toDataURL({
        pixelRatio: pixelRatio,
        mimeType: 'image/png',
      });
      saveAs(uri, `magical-trial-${Date.now()}.png`);
    }
  };

  const handleCopy = async () => {
    if (!stageRef.current) return;

    try {
      const pixelRatio = getHighResRatio();

      // toBlob 是 konva 的原生方法，但 react-konva 的 ref 指向的是 Konva.Stage 实例
      // 我们需要将其封装为 Promise 以便使用 async/await
      const blob = await new Promise<Blob | null>((resolve) => {
        stageRef.current?.toBlob({
          callback: resolve,
          mimeType: 'image/png',
          pixelRatio: pixelRatio,
        });
      });

      if (!blob) throw new Error('Canvas blob generation failed');

      // 写入剪贴板
      // 注意：这需要浏览器支持 ClipboardItem API (Chrome 66+, Safari 13.1+, Firefox 87+)
      // 且必须在 HTTPS 或 localhost 环境下运行
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      throw err; // 抛出错误让 Sidebar 处理 UI 状态
    }
  };

  return (
    // md:h-screen md:overflow-hidden 保持桌面端原来的“应用式”布局。
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-gray-100 md:overflow-hidden font-sans">
      {/*
         移动端: Sidebar order-2 (在下), Main order-1 (在上)
         桌面端: Sidebar order-1 (在左), Main order-2 (在右)
      */}

      <div className="order-2 md:order-1 w-full md:w-auto z-10">
        <Sidebar onDownload={handleDownload} onCopy={handleCopy} onGenerateBlob={generateBlob} />
      </div>

      <main className="order-1 md:order-2 flex-1 flex flex-col items-center p-2 md:p-4 bg-grid-pattern relative md:overflow-hidden md:justify-center z-20 sticky top-0 md:static border-b md:border-b-0 border-gray-200 shadow-sm md:shadow-none">
        {/* 移动端 Sticky 容器: 增加 sticky top-0 让预览图吸顶 */}
        <div className="w-full max-w-[1600px]">
          <MagicalCanvas stageRef={stageRef} />
        </div>
      </main>

      <style>{`
        .bg-grid-pattern {
          background-color: #f3f4f6;
          background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
                            linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
                            linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}

export default App;
