import { HeaderContourId } from '../assets/types.js';

export const headerContourIds: HeaderContourId[] = [
  'soft-wave',
  'arc-sweep',
  'layered-ribbon',
  'clean-diagonal'
];

export const headerContourLabels: Record<HeaderContourId, string> = {
  'soft-wave': '柔和波浪',
  'arc-sweep': '不對稱弧幕',
  'layered-ribbon': '層疊緞帶',
  'clean-diagonal': '俐落斜切'
};

export function createContourGradient(
  ctx: CanvasRenderingContext2D,
  colors: readonly string[],
  width: number,
  height: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, width, height * 0.35);
  colors.forEach((color, index) => gradient.addColorStop(index / Math.max(1, colors.length - 1), color));
  return gradient;
}

// 只建立屋簷的外輪廓路徑，不呼叫 beginPath／fill，供合成遮罩重用。
export function traceHeaderContourPath(
  ctx: CanvasRenderingContext2D,
  contourId: HeaderContourId,
  width: number,
  height: number
): void {
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);

  if (contourId === 'arc-sweep') {
    ctx.lineTo(width, height * 0.58);
    ctx.bezierCurveTo(width * 0.83, height * 0.94, width * 0.53, height * 0.55, 0, height * 0.84);
  } else if (contourId === 'layered-ribbon') {
    const boundary = 1;
    const amplitude = 0.1;
    ctx.lineTo(width, height * boundary);
    ctx.bezierCurveTo(width * 0.78, height * (boundary + amplitude), width * 0.6, height * (boundary - amplitude), width * 0.4, height * boundary);
    ctx.bezierCurveTo(width * 0.23, height * (boundary + amplitude), width * 0.12, height * (boundary - amplitude), 0, height * boundary);
  } else if (contourId === 'clean-diagonal') {
    ctx.lineTo(width, height * 0.56);
    ctx.lineTo(width * 0.62, height * 0.88);
    ctx.lineTo(0, height * 0.72);
  } else {
    ctx.lineTo(width, height * 0.66);
    ctx.bezierCurveTo(width * 0.78, height * 0.94, width * 0.55, height * 0.64, width * 0.35, height * 0.78);
    ctx.bezierCurveTo(width * 0.2, height * 0.88, width * 0.1, height * 0.7, 0, height * 0.82);
  }

  ctx.closePath();
}

export function drawHeaderContour(
  ctx: CanvasRenderingContext2D,
  contourId: HeaderContourId,
  width: number,
  height: number,
  fill: string | CanvasGradient
): void {
  ctx.save();
  ctx.fillStyle = fill;

  if (contourId === 'arc-sweep') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.58);
    ctx.bezierCurveTo(width * 0.83, height * 0.94, width * 0.53, height * 0.55, 0, height * 0.84);
    ctx.closePath();
    ctx.fill();
    drawAccentArc(ctx, width, height);
  } else if (contourId === 'layered-ribbon') {
    drawRibbonLayer(ctx, width, height, 0.78, 0.14, fill, 1);
    drawRibbonLayer(ctx, width, height, 0.91, 0.12, '#FFFFFF', 0.18);
    drawRibbonLayer(ctx, width, height, 1, 0.1, '#FFFFFF', 0.09);
  } else if (contourId === 'clean-diagonal') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.56);
    ctx.lineTo(width * 0.62, height * 0.88);
    ctx.lineTo(0, height * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(width * 0.42, height * 0.73);
    ctx.lineTo(width, height * 0.48);
    ctx.lineTo(width, height * 0.56);
    ctx.lineTo(width * 0.62, height * 0.88);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.66);
    ctx.bezierCurveTo(width * 0.78, height * 0.94, width * 0.55, height * 0.64, width * 0.35, height * 0.78);
    ctx.bezierCurveTo(width * 0.2, height * 0.88, width * 0.1, height * 0.7, 0, height * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.69);
    ctx.bezierCurveTo(width * 0.2, height * 0.5, width * 0.34, height * 0.82, width * 0.55, height * 0.67);
    ctx.bezierCurveTo(width * 0.75, height * 0.53, width * 0.88, height * 0.78, width, height * 0.55);
    ctx.lineTo(width, height * 0.66);
    ctx.bezierCurveTo(width * 0.78, height * 0.94, width * 0.55, height * 0.64, width * 0.35, height * 0.78);
    ctx.bezierCurveTo(width * 0.2, height * 0.88, width * 0.1, height * 0.7, 0, height * 0.82);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawAccentArc(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(width * 0.34, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height * 0.58);
  ctx.bezierCurveTo(width * 0.82, height * 0.76, width * 0.68, height * 0.35, width * 0.34, 0);
  ctx.closePath();
  ctx.fill();
}

function drawRibbonLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  boundary: number,
  amplitude: number,
  fill: string | CanvasGradient,
  alpha: number
): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height * boundary);
  ctx.bezierCurveTo(width * 0.78, height * (boundary + amplitude), width * 0.6, height * (boundary - amplitude), width * 0.4, height * boundary);
  ctx.bezierCurveTo(width * 0.23, height * (boundary + amplitude), width * 0.12, height * (boundary - amplitude), 0, height * boundary);
  ctx.closePath();
  ctx.fill();
}

export function renderContourPreview(
  canvas: HTMLCanvasElement,
  contourId: HeaderContourId,
  colors: readonly string[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  drawHeaderContour(ctx, contourId, width, height, createContourGradient(ctx, colors, width, height));
}
