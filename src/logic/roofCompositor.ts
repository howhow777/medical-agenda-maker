import type { RoofStyleId } from '../assets/roofTypes.js';
import { getRoofPlacement } from './roofStyles.js';

/** Interpolate complete scenes in premultiplied space, NOT two source-over masks.
 * A 50%-opaque object present in both scenes stays 50%, not 75%.
 */
export function mixRoofCoverage(outside: Uint8ClampedArray, inside: Uint8ClampedArray, coverage: Uint8ClampedArray): Uint8ClampedArray {
  if (outside.length !== inside.length || outside.length !== coverage.length * 4) throw new Error('屋簷遮罩尺寸不符');
  const result = new Uint8ClampedArray(outside.length);
  for (let p = 0; p < coverage.length; p++) {
    const k = p * 4, weight = coverage[p] / 255;
    const a = outside[k + 3] * (1 - weight), b = inside[k + 3] * weight;
    const alpha = a + b;
    for (let channel = 0; channel < 3; channel++) {
      result[k + channel] = alpha > 0 ? (outside[k + channel] * a + inside[k + channel] * b) / alpha : 0;
    }
    result[k + 3] = alpha;
  }
  return result;
}

export function extractRoofCoverage(pixels: Uint8ClampedArray): { coverage: Uint8ClampedArray; complement: Uint8ClampedArray } {
  if (pixels.length % 4) throw new Error('屋簷像素不完整');
  const coverage = new Uint8ClampedArray(pixels.length / 4);
  const complement = new Uint8ClampedArray(coverage.length);
  for (let p = 0; p < coverage.length; p++) {
    coverage[p] = pixels[p * 4 + 3]; complement[p] = 255 - coverage[p];
  }
  return { coverage, complement };
}

/** The outside scene already has overlays once, in their original order.
 * The inside scene is the un-matted opaque roof plus title/above-header overlays.
 * Their coverage-weighted combination restores the approved transparent artwork
 * while letting every object cross its soft boundary without repeated alpha.
 */
export function compositeOpticalRoof(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  styleId: RoofStyleId,
  logicalWidth: number,
  paintInside: (context: CanvasRenderingContext2D) => void
): void {
  const transform = target.getTransform();
  if (transform.b !== 0 || transform.c !== 0 || transform.e !== 0 || transform.f !== 0 || transform.a <= 0 || transform.d !== transform.a) {
    throw new Error('屋簷合成只接受等比例輸出座標');
  }
  const scale = transform.a;
  const placement = getRoofPlacement(styleId, logicalWidth);
  const width = Math.min(target.canvas.width, Math.round(logicalWidth * scale));
  const height = Math.min(target.canvas.height, Math.ceil(placement.height * scale));
  const layer = document.createElement('canvas'); layer.width = width; layer.height = height;
  const ctx = layer.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, logicalWidth * scale, placement.height * scale);
  const unmatte = ctx.getImageData(0, 0, width, height);
  const { coverage } = extractRoofCoverage(unmatte.data);
  for (let p = 0; p < coverage.length; p++) unmatte.data[p * 4 + 3] = 255;
  ctx.putImageData(unmatte, 0, 0);
  ctx.scale(scale, scale);
  paintInside(ctx);
  const outside = target.getImageData(0, 0, width, height);
  const inside = ctx.getImageData(0, 0, width, height);
  const mixed = mixRoofCoverage(outside.data, inside.data, coverage);
  const output = target.createImageData(width, height); output.data.set(mixed);
  // Direct replacement avoids source-over applying the final scene alpha again.
  target.putImageData(output, 0, 0);
}
