import clsx from 'clsx';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useStore } from '../../../store/useStore.ts';

export default function AlignSwitcher() {
  const { textAlign, setTextAlign } = useStore();

  return (
    <div className="flex pb-2 rounded-lg">
      <button
        onClick={() => setTextAlign('left')}
        className={clsx(
          'p-1.5 rounded-md transition-all flex items-center justify-center',
          textAlign === 'left'
            ? 'bg-white shadow text-pink-500'
            : 'text-gray-400 hover:text-gray-600'
        )}
        title="居左对齐"
      >
        <AlignLeft size={16} />
      </button>
      <div className="w-[1px] bg-gray-200 mx-1 h-4 self-center"></div>
      <button
        onClick={() => setTextAlign('center')}
        className={clsx(
          'p-1.5 rounded-md transition-all flex items-center justify-center',
          textAlign === 'center'
            ? 'bg-white shadow text-pink-500'
            : 'text-gray-400 hover:text-gray-600'
        )}
        title="居中对齐"
      >
        <AlignCenter size={16} />
      </button>
      <div className="w-[1px] bg-gray-200 mx-1 h-4 self-center"></div>
      <button
        onClick={() => setTextAlign('right')}
        className={clsx(
          'p-1.5 rounded-md transition-all flex items-center justify-center',
          textAlign === 'right'
            ? 'bg-white shadow text-pink-500'
            : 'text-gray-400 hover:text-gray-600'
        )}
        title="居右对齐"
      >
        <AlignRight size={16} />
      </button>
    </div>
  );
}
