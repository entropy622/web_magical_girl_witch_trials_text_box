/**
 * 解析文本，提取中括号内的变色内容
 * 返回: [{ text: "你好", isHighlight: false }, { text: "世界", isHighlight: true }]
 */
interface TextSegment {
  text: string;
  isHighlight: boolean;
}

export const parseRichText = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let buffer = '';
  let isHighlight = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '[' || char === '【') {
      if (buffer) segments.push({ text: buffer, isHighlight });
      buffer = '';
      isHighlight = true;
    } else if (char === ']' || char === '】') {
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

/**
 * 简单的画布文字测量与换行计算
 * 这是一个简化的排版引擎，用于在 Konva 中模拟富文本
 */
export interface RenderToken {
  text: string;
  x: number;
  y: number;
  color: string;
}

export const calculateRichTextLayout = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontSize: number,
  lineHeight: number = 1.2,
  defaultColor: string = 'black',
  highlightColor: string = '#800080' // config.py 里的紫色
) => {
  const segments = parseRichText(text);
  const tokens: RenderToken[] = [];

  // 估算字符宽度的辅助函数 (简单估算，非精确测量，为了性能和通用性)
  // 如果需要精确，需要传入 Canvas Context，但通常中文宽=fontSize，英文宽=fontSize*0.6 足够用了
  const measure = (str: string) => {
    let width = 0;
    for (const char of str) {
      // 简单判断：ASCII 字符算半角，其他算全角
      width += char.charCodeAt(0) < 256 ? fontSize * 0.6 : fontSize;
    }
    return width;
  };

  let currentX = 0;
  let currentY = 0;
  const lineHeightPx = fontSize * lineHeight;

  for (const seg of segments) {
    const color = seg.isHighlight ? highlightColor : defaultColor;

    // 逐字处理换行
    for (const char of seg.text) {
      const charW = measure(char);

      // 如果当前行放不下了，换行
      if (currentX + charW > maxWidth) {
        currentX = 0;
        currentY += lineHeightPx;
      }

      // 如果高度超出了，这就停止渲染 (或者你可以选择缩小字体重新计算)
      if (currentY + lineHeightPx > maxHeight) {
        break;
      }

      tokens.push({
        text: char,
        x: currentX,
        y: currentY,
        color,
      });

      currentX += charW;
    }
  }

  return { tokens, totalHeight: currentY + lineHeightPx };
};
