import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ShareButtonProps {
  onGenerateBlob: () => Promise<Blob | null>;
  className?: string;
  text?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  onGenerateBlob,
  className,
  text = '转发',
}) => {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const blob = await onGenerateBlob();
      if (!blob) throw new Error('图片生成失败');

      // 创建文件对象，模拟本地文件
      const file = new File([blob], 'magical_card.png', { type: 'image/png' });
      const shareData = {
        files: [file],
        title: '魔女审判文本框',
      };

      // 再次检查具体是否支持分享该类型文件
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('当前设备不支持直接分享此图片');
      }
    } catch (error: unknown) {
      // 用户点击取消分享不报错
      // 使用类型检查来确认是否为 AbortError
      const isAbortError = error instanceof Error && error.name === 'AbortError';

      if (!isAbortError) {
        console.error('Share failed:', error);
        alert('分享唤起失败，请尝试使用“保存”按钮。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className={clsx(
        'flex items-center justify-center gap-2 font-bold transition-all active:scale-95',
        className
      )}
      title="转发给好友"
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
      <span>{text}</span>
    </button>
  );
};
