import clsx from 'clsx';

export default function ControllerButton({
  text,
  onClick,
  highlight,
}: {
  text: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2 md:px-4 py-2 text-xs md:text-sm rounded-md transition-all border',
        highlight
          ? 'bg-pink-500 text-white border-pink-600 shadow-md'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-pink-50'
      )}
    >
      {text}
    </button>
  );
}
