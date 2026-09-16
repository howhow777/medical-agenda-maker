/** Exact geometry from GitHub Pages commit e786b829 at an 800px logical width. */
export const CLASSIC_ROOF_LABEL = '最初版波浪屋簷';
export const CLASSIC_ROOF_BASE_WIDTH = 800;
export const CLASSIC_ROOF_HEADER_HEIGHT = 120;
export const CLASSIC_ROOF_MAX_Y = 130;

export const classicRoofPathSignature = [
  ['M', 0, 0],
  ['L', 800, 0],
  ['L', 800, 100],
  ['Q', 600, 130, 400, 110],
  ['Q', 200, 90, 0, 120],
  ['Z']
] as const;

/** One canonical path shared by preview, poster, clipping, fallback and export. */
export function traceClassicRoofPath(ctx: CanvasRenderingContext2D, width: number): void {
  if (!Number.isFinite(width) || width <= 0) throw new Error('無效的最初版屋簷寬度');
  const scale = width / CLASSIC_ROOF_BASE_WIDTH;
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 100 * scale);
  ctx.quadraticCurveTo(600 * scale, 130 * scale, 400 * scale, 110 * scale);
  ctx.quadraticCurveTo(200 * scale, 90 * scale, 0, 120 * scale);
  ctx.closePath();
}

export function drawClassicRoof(
  ctx: CanvasRenderingContext2D,
  width: number,
  fill: string | CanvasGradient | CanvasPattern
): void {
  ctx.save();
  ctx.beginPath();
  traceClassicRoofPath(ctx, width);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

export function renderClassicRoofPreview(canvas: HTMLCanvasElement, colors: readonly string[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const palette = (colors.length >= 2 ? colors : ['#347F91', '#A7DDE1']) as readonly string[];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  palette.forEach((color, index) => gradient.addColorStop(index / (palette.length - 1), color));
  drawClassicRoof(ctx, canvas.width, gradient);
}
