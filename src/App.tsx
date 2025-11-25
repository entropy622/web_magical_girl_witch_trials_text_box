import { useEffect, useRef } from 'react';
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
    // 注意：font3.ttf 必须存在于 public/assets/fonts/font3.ttf
    const font = new FontFace('MagicalFont', 'url(/assets/fonts/font3.ttf)');

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        setFontLoaded(true);
        console.log('Magical Font loaded successfully');
      })
      .catch((err) => {
        console.error('Failed to load font:', err);
        // 即使字体加载失败，也设置为 true 以便显示 Canvas（回退字体）
        setFontLoaded(true);
      });
  }, [setFontLoaded]);

  const handleDownload = () => {
    if (stageRef.current) {
      // 导出高分辨率图片
      const uri = stageRef.current.toDataURL({
        pixelRatio: 2, // 2倍图，更高清
        mimeType: 'image/png',
      });
      saveAs(uri, `magical-trial-${Date.now()}.png`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden font-sans">
      {/* 左侧控制栏 */}
      <Sidebar onDownload={handleDownload} />

      {/* 右侧画布区域 */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-10 bg-grid-pattern overflow-auto">
        <MagicalCanvas stageRef={stageRef} />
      </main>

      {/* 简单的背景网格样式 */}
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
