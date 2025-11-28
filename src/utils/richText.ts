interface TextSegment {
  text: string;
  isHighlight: boolean;
}

export interface RenderToken {
  text: string;
  x: number;
  y: number;
  color: string;
}

/**
 * 解析文本，提取中括号内的变色内容
 * 返回: [{ text: "你好", isHighlight: false }, { text: "世界", isHighlight: true }]
 */
export const parseRichText = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let buffer = '';
  let isHighlight = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '[' || char === '【') {
      if (buffer) segments.push({ text: buffer, isHighlight });
      buffer = char;
      isHighlight = true;
    } else if (char === ']' || char === '】') {
      buffer += char;
      if (buffer) segments.push({ text: buffer, isHighlight });
      buffer = '';
      isHighlight = false;
    } else {
      buffer += char;
    }
  }
  if (buffer) segments.push({ text: buffer, isHighlight });
  return segments;
};

// 全局复用 Canvas context 以提高性能
let ctx: CanvasRenderingContext2D | null = null;
const getContext = () => {
  if (ctx) return ctx;
  if (typeof document === 'undefined') return null; // SSR 保护
  const canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  return ctx;
};

/**
 * 使用 Canvas 测量并计算富文本布局
 * 优化：合并连续字符，修复英文间距问题
 */
export const calculateRichTextLayout = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontSize: number,
  lineHeight: number = 1.3,
  defaultColor: string = 'black',
  highlightColor: string = '#800080'
) => {
  const segments = parseRichText(text);
  const tokens: RenderToken[] = [];

  const context = getContext();
  if (context) {
    // 尽量匹配实际渲染的字体，保证测量准确
    context.font = `${fontSize}px "MagicalFont", sans-serif`;
  }

  // 测量辅助函数
  const measure = (str: string) => {
    if (context) return context.measureText(str).width;
    // 兜底逻辑：简单的宽度估算
    let width = 0;
    for (const char of str) {
      width += char.charCodeAt(0) < 256 ? fontSize * 0.6 : fontSize;
    }
    return width;
  };

  let currentX = 0;
  let currentY = 0;
  const lineHeightPx = fontSize * lineHeight;

  for (const seg of segments) {
    const color = seg.isHighlight ? highlightColor : defaultColor;

    let buffer = '';

    // 逐字检查是否需要换行，但尽量积累 buffer 一起渲染
    for (let i = 0; i < seg.text.length; i++) {
      const char = seg.text[i];

      // 预测加入当前字符后的宽度
      const nextBuffer = buffer + char;
      const nextWidth = measure(nextBuffer);

      // 检查是否溢出
      if (currentX + nextWidth > maxWidth) {
        // 1. 先把手里累积的 buffer 渲染掉
        if (buffer) {
          tokens.push({
            text: buffer,
            x: currentX,
            y: currentY,
            color,
          });
          currentX += measure(buffer);
        }

        // 2. 换行
        currentX = 0;
        currentY += lineHeightPx;

        // 3. 检查高度溢出
        if (currentY + fontSize * 0.8 > maxHeight) break;

        // 4. 处理导致溢出的这个字符
        // 如果是行首空格，通常可以忽略
        if (char === ' ') {
          buffer = '';
        } else {
          buffer = char;
        }
      } else {
        // 没溢出，加入 buffer 等待渲染
        buffer = nextBuffer;
      }
    }

    // 刷新段落剩余的 buffer
    if (buffer) {
      // 检查高度（防止最后一行溢出）
      if (currentY + fontSize * 0.8 <= maxHeight) {
        tokens.push({
          text: buffer,
          x: currentX,
          y: currentY,
          color,
        });
        currentX += measure(buffer);
      }
    }
  }

  return { tokens, totalHeight: currentY + lineHeightPx };
};
