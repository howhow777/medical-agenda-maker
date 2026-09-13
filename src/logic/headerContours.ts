import { HeaderContourId } from '../assets/types.js';

export const headerContourIds: HeaderContourId[] = [
  'soft-wave',
  'arc-sweep',
  'layered-ribbon',
  'clean-diagonal'
];

export const headerContourLabels: Record<HeaderContourId, string> = {
  'soft-wave': '免疫訊號',
  'arc-sweep': '精準辨識',
  'layered-ribbon': '協同網絡',
  'clean-diagonal': '免疫級聯'
};

type BoundaryKnot = readonly [x: number, y: number];
type Point = { x: number; y: number };

const HEADER_BOUNDARY_KNOTS: Record<HeaderContourId, readonly BoundaryKnot[]> = {
  'soft-wave': [
    [0, 0.84], [0.16, 0.88], [0.34, 0.94], [0.52, 0.97],
    [0.68, 0.93], [0.84, 0.86], [1, 0.80]
  ],
  'arc-sweep': [
    [0, 0.82], [0.14, 0.78], [0.30, 0.81], [0.48, 0.90],
    [0.65, 0.95], [0.82, 0.87], [1, 0.79]
  ],
  'layered-ribbon': [
    [0, 0.89], [0.15, 0.85], [0.32, 0.88], [0.50, 0.94],
    [0.68, 0.91], [0.84, 0.84], [1, 0.88]
  ],
  'clean-diagonal': [
    [0, 0.79], [0.16, 0.88], [0.34, 0.97], [0.52, 0.94],
    [0.70, 0.86], [0.86, 0.81], [1, 0.77]
  ]
};

export function getHeaderContourBoundarySamples(contourId: HeaderContourId): readonly BoundaryKnot[] {
  return HEADER_BOUNDARY_KNOTS[contourId];
}

export function createContourGradient(
  ctx: CanvasRenderingContext2D,
  colors: readonly string[],
  width: number,
  height: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, width, height * 0.72);
  colors.forEach((color, index) => gradient.addColorStop(index / Math.max(1, colors.length - 1), color));
  return gradient;
}

function getBoundaryPoints(contourId: HeaderContourId, yOffset = 0): Point[] {
  return HEADER_BOUNDARY_KNOTS[contourId].map(([x, y]) => ({
    x,
    y: Math.max(0.72, Math.min(1, y + yOffset))
  }));
}

function getSmoothTangents(points: readonly Point[]): number[] {
  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return (next.y - point.y) / (next.x - point.x);
  });
  return points.map((_point, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) return 0;
    return (2 * before * after) / (before + after);
  });
}

function traceBoundaryRightToLeft(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  width: number,
  height: number
): void {
  const tangents = getSmoothTangents(points);
  for (let index = points.length - 2; index >= 0; index -= 1) {
    const left = points[index];
    const right = points[index + 1];
    const dx = right.x - left.x;
    ctx.bezierCurveTo(
      (right.x - dx / 3) * width,
      (right.y - tangents[index + 1] * dx / 3) * height,
      (left.x + dx / 3) * width,
      (left.y + tangents[index] * dx / 3) * height,
      left.x * width,
      left.y * height
    );
  }
}

function traceBoundaryLeftToRight(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  width: number,
  height: number
): void {
  const tangents = getSmoothTangents(points);
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    const dx = right.x - left.x;
    ctx.bezierCurveTo(
      (left.x + dx / 3) * width,
      (left.y + tangents[index] * dx / 3) * height,
      (right.x - dx / 3) * width,
      (right.y - tangents[index + 1] * dx / 3) * height,
      right.x * width,
      right.y * height
    );
  }
}

// 只建立屋簷的外輪廓路徑，不呼叫 beginPath／fill，供合成遮罩重用。
export function traceHeaderContourPath(
  ctx: CanvasRenderingContext2D,
  contourId: HeaderContourId,
  width: number,
  height: number
): void {
  const points = getBoundaryPoints(contourId);
  const right = points[points.length - 1];
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, right.y * height);
  traceBoundaryRightToLeft(ctx, points, width, height);
  ctx.closePath();
}

function fillOpticalSurface(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  trace: () => void
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  trace();
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function strokeLightPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  alpha: number,
  lineWidth: number,
  trace: () => void
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = lineWidth * (width / 800);
  ctx.lineCap = 'round';
  ctx.beginPath();
  trace();
  ctx.stroke();
  ctx.restore();
}

function drawSignalNode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number
): void {
  const scale = width / 800;
  const gradient = ctx.createRadialGradient(
    x * width, y * height, 0,
    x * width, y * height, radius * scale
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.42)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x * width, y * height, radius * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSignalResonance(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  fillOpticalSurface(ctx, 0.14, () => {
    ctx.moveTo(-0.05 * width, 0.05 * height);
    ctx.bezierCurveTo(0.14 * width, 0.47 * height, 0.31 * width, 0.12 * height, 0.51 * width, 0.35 * height);
    ctx.bezierCurveTo(0.68 * width, 0.55 * height, 0.85 * width, 0.18 * height, 1.05 * width, 0.12 * height);
    ctx.lineTo(1.05 * width, 0);
    ctx.lineTo(-0.05 * width, 0);
  });
  fillOpticalSurface(ctx, 0.10, () => {
    ctx.moveTo(-0.05 * width, 0.62 * height);
    ctx.bezierCurveTo(0.19 * width, 0.25 * height, 0.37 * width, 0.73 * height, 0.58 * width, 0.48 * height);
    ctx.bezierCurveTo(0.74 * width, 0.30 * height, 0.89 * width, 0.52 * height, 1.05 * width, 0.23 * height);
    ctx.lineTo(1.05 * width, 0.48 * height);
    ctx.bezierCurveTo(0.86 * width, 0.70 * height, 0.69 * width, 0.51 * height, 0.52 * width, 0.69 * height);
    ctx.bezierCurveTo(0.31 * width, 0.90 * height, 0.14 * width, 0.46 * height, -0.05 * width, 0.80 * height);
  });
  strokeLightPath(ctx, width, 0.48, 1.45, () => {
    ctx.moveTo(-0.04 * width, 0.20 * height);
    ctx.bezierCurveTo(0.18 * width, 0.51 * height, 0.31 * width, 0.11 * height, 0.48 * width, 0.30 * height);
    ctx.bezierCurveTo(0.66 * width, 0.50 * height, 0.80 * width, 0.25 * height, 1.04 * width, 0.39 * height);
  });
  strokeLightPath(ctx, width, 0.30, 1.1, () => {
    ctx.moveTo(-0.03 * width, 0.60 * height);
    ctx.bezierCurveTo(0.22 * width, 0.25 * height, 0.39 * width, 0.72 * height, 0.57 * width, 0.48 * height);
    ctx.bezierCurveTo(0.73 * width, 0.29 * height, 0.88 * width, 0.52 * height, 1.03 * width, 0.23 * height);
  });
  strokeLightPath(ctx, width, 0.22, 0.9, () => {
    ctx.moveTo(0.11 * width, -0.04 * height);
    ctx.bezierCurveTo(0.27 * width, 0.33 * height, 0.45 * width, 0.16 * height, 0.60 * width, 0.27 * height);
    ctx.bezierCurveTo(0.77 * width, 0.40 * height, 0.86 * width, 0.64 * height, 0.98 * width, 0.70 * height);
  });
  drawSignalNode(ctx, width, height, 0.08, 0.36, 15);
  drawSignalNode(ctx, width, height, 0.91, 0.29, 13);
  drawSignalNode(ctx, width, height, 0.90, 0.67, 10);
}

function drawRefractiveFocus(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  fillOpticalSurface(ctx, 0.16, () => {
    ctx.moveTo(-0.05 * width, 0.07 * height);
    ctx.bezierCurveTo(0.18 * width, 0.02 * height, 0.37 * width, 0.45 * height, 0.64 * width, 0.37 * height);
    ctx.bezierCurveTo(0.78 * width, 0.33 * height, 0.90 * width, 0.18 * height, 1.05 * width, 0.20 * height);
    ctx.lineTo(1.05 * width, 0.50 * height);
    ctx.bezierCurveTo(0.82 * width, 0.43 * height, 0.65 * width, 0.63 * height, 0.45 * width, 0.49 * height);
    ctx.bezierCurveTo(0.25 * width, 0.35 * height, 0.11 * width, 0.17 * height, -0.05 * width, 0.33 * height);
  });
  fillOpticalSurface(ctx, 0.11, () => {
    ctx.moveTo(0.58 * width, -0.04 * height);
    ctx.bezierCurveTo(0.73 * width, 0.13 * height, 0.79 * width, 0.38 * height, 0.86 * width, 0.53 * height);
    ctx.bezierCurveTo(0.92 * width, 0.66 * height, 1.00 * width, 0.65 * height, 1.05 * width, 0.58 * height);
    ctx.lineTo(1.05 * width, -0.04 * height);
  });
  fillOpticalSurface(ctx, 0.18, () => {
    ctx.moveTo(0.77 * width, 0.29 * height);
    ctx.bezierCurveTo(0.82 * width, 0.19 * height, 0.91 * width, 0.18 * height, 0.96 * width, 0.28 * height);
    ctx.bezierCurveTo(0.91 * width, 0.38 * height, 0.82 * width, 0.39 * height, 0.77 * width, 0.29 * height);
  });
  strokeLightPath(ctx, width, 0.34, 1.25, () => {
    ctx.moveTo(0.53 * width, 0.02 * height);
    ctx.bezierCurveTo(0.65 * width, 0.10 * height, 0.70 * width, 0.22 * height, 0.78 * width, 0.29 * height);
  });
  strokeLightPath(ctx, width, 0.16, 2.4, () => {
    ctx.moveTo(0.77 * width, 0.29 * height);
    ctx.bezierCurveTo(0.82 * width, 0.19 * height, 0.91 * width, 0.18 * height, 0.96 * width, 0.28 * height);
    ctx.bezierCurveTo(0.91 * width, 0.38 * height, 0.82 * width, 0.39 * height, 0.77 * width, 0.29 * height);
  });
}

type Facet = {
  points: ReadonlyArray<BoundaryKnot>;
  alpha: number;
};

const FACETS: readonly Facet[] = [
  { points: [[-0.08, 0.03], [0.19, -0.04], [0.11, 0.29], [-0.04, 0.49]], alpha: 0.19 },
  { points: [[0.03, 0.07], [0.31, -0.04], [0.21, 0.32], [0.08, 0.55]], alpha: 0.14 },
  { points: [[-0.05, 0.34], [0.22, 0.14], [0.34, 0.41], [0.09, 0.71]], alpha: 0.12 },
  { points: [[0.02, 0.66], [0.27, 0.38], [0.39, 0.76], [0.14, 0.90]], alpha: 0.10 },
  { points: [[0.74, -0.04], [1.07, 0.04], [0.95, 0.37], [0.68, 0.17]], alpha: 0.18 },
  { points: [[0.83, 0.07], [1.04, 0.29], [0.86, 0.59], [0.65, 0.30]], alpha: 0.15 },
  { points: [[0.77, 0.42], [1.07, 0.23], [0.98, 0.72], [0.69, 0.77]], alpha: 0.12 },
  { points: [[0.63, 0.66], [0.89, 0.37], [1.05, 0.84], [0.78, 0.92]], alpha: 0.09 },
  { points: [[-0.04, 0.07], [0.39, -0.03], [0.67, 0.18], [0.28, 0.30]], alpha: 0.065 },
  { points: [[0.29, -0.04], [0.81, 0.00], [0.63, 0.17], [0.46, 0.12]], alpha: 0.055 },
  { points: [[0.16, 0.80], [0.48, 0.48], [0.84, 0.78], [0.57, 0.94]], alpha: 0.055 }
];

function drawOrganicFacets(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  FACETS.forEach(({ points, alpha }) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(points[0][0] * width, points[0][1] * height);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x * width, y * height));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  const titleMist = ctx.createRadialGradient(
    width * 0.50, height * 0.43, 0,
    width * 0.50, height * 0.43, width * 0.46
  );
  titleMist.addColorStop(0, 'rgba(255,255,255,0.18)');
  titleMist.addColorStop(0.48, 'rgba(255,255,255,0.08)');
  titleMist.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.fillStyle = titleMist;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const mist = ctx.createLinearGradient(0, height * 0.28, 0, height);
  mist.addColorStop(0, 'rgba(255,255,255,0)');
  mist.addColorStop(0.6, 'rgba(255,255,255,0.04)');
  mist.addColorStop(1, 'rgba(255,255,255,0.22)');
  ctx.save();
  ctx.fillStyle = mist;
  ctx.fillRect(0, height * 0.25, width, height * 0.75);
  ctx.restore();
}

function drawCascadeField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  fillOpticalSurface(ctx, 0.17, () => {
    ctx.moveTo(-0.05 * width, 0.02 * height);
    ctx.bezierCurveTo(0.15 * width, 0.42 * height, 0.31 * width, 0.18 * height, 0.51 * width, 0.46 * height);
    ctx.bezierCurveTo(0.68 * width, 0.69 * height, 0.82 * width, 0.40 * height, 1.05 * width, 0.20 * height);
    ctx.lineTo(1.05 * width, 0.48 * height);
    ctx.bezierCurveTo(0.82 * width, 0.63 * height, 0.67 * width, 0.86 * height, 0.47 * width, 0.63 * height);
    ctx.bezierCurveTo(0.27 * width, 0.40 * height, 0.12 * width, 0.65 * height, -0.05 * width, 0.31 * height);
  });
  fillOpticalSurface(ctx, 0.11, () => {
    ctx.moveTo(-0.04 * width, 0.53 * height);
    ctx.bezierCurveTo(0.18 * width, 0.25 * height, 0.34 * width, 0.80 * height, 0.56 * width, 0.54 * height);
    ctx.bezierCurveTo(0.72 * width, 0.35 * height, 0.90 * width, 0.51 * height, 1.04 * width, 0.31 * height);
    ctx.lineTo(1.04 * width, 0.59 * height);
    ctx.bezierCurveTo(0.83 * width, 0.72 * height, 0.72 * width, 0.58 * height, 0.58 * width, 0.75 * height);
    ctx.bezierCurveTo(0.35 * width, 1.00 * height, 0.17 * width, 0.49 * height, -0.04 * width, 0.79 * height);
  });
  fillOpticalSurface(ctx, 0.07, () => {
    ctx.moveTo(0.28 * width, -0.03 * height);
    ctx.bezierCurveTo(0.43 * width, 0.31 * height, 0.57 * width, 0.16 * height, 0.72 * width, 0.38 * height);
    ctx.bezierCurveTo(0.83 * width, 0.53 * height, 0.93 * width, 0.49 * height, 1.04 * width, 0.41 * height);
    ctx.lineTo(1.04 * width, 0.57 * height);
    ctx.bezierCurveTo(0.88 * width, 0.64 * height, 0.75 * width, 0.66 * height, 0.63 * width, 0.51 * height);
    ctx.bezierCurveTo(0.48 * width, 0.31 * height, 0.38 * width, 0.49 * height, 0.28 * width, 0.24 * height);
  });
  strokeLightPath(ctx, width, 0.33, 1.2, () => {
    ctx.moveTo(-0.03 * width, 0.18 * height);
    ctx.bezierCurveTo(0.21 * width, 0.52 * height, 0.36 * width, 0.18 * height, 0.55 * width, 0.43 * height);
    ctx.bezierCurveTo(0.70 * width, 0.64 * height, 0.84 * width, 0.37 * height, 1.03 * width, 0.27 * height);
  });
  strokeLightPath(ctx, width, 0.19, 0.9, () => {
    ctx.moveTo(0.03 * width, 0.70 * height);
    ctx.bezierCurveTo(0.19 * width, 0.45 * height, 0.35 * width, 0.84 * height, 0.54 * width, 0.60 * height);
    ctx.bezierCurveTo(0.72 * width, 0.37 * height, 0.88 * width, 0.60 * height, 1.02 * width, 0.43 * height);
  });
}

function drawTransitionBands(
  ctx: CanvasRenderingContext2D,
  contourId: HeaderContourId,
  width: number,
  height: number
): void {
  [
    { offset: -0.105, alpha: 0.20 },
    { offset: -0.066, alpha: 0.18 },
    { offset: -0.032, alpha: 0.16 }
  ].forEach(({ offset, alpha }) => {
    const points = getBoundaryPoints(contourId, offset);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    traceBoundaryLeftToRight(ctx, points, width, height);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  const edge = getBoundaryPoints(contourId);
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.25 * (width / 800);
  ctx.beginPath();
  ctx.moveTo(edge[0].x * width, edge[0].y * height);
  traceBoundaryLeftToRight(ctx, edge, width, height);
  ctx.stroke();
  ctx.restore();
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
  ctx.beginPath();
  traceHeaderContourPath(ctx, contourId, width, height);
  ctx.fill();
  ctx.clip();

  if (contourId === 'arc-sweep') {
    drawRefractiveFocus(ctx, width, height);
  } else if (contourId === 'layered-ribbon') {
    drawOrganicFacets(ctx, width, height);
  } else if (contourId === 'clean-diagonal') {
    drawCascadeField(ctx, width, height);
  } else {
    drawSignalResonance(ctx, width, height);
  }

  drawTransitionBands(ctx, contourId, width, height);
  ctx.restore();
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
