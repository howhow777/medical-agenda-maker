import type { RoofColors, RoofStyleId } from '../assets/roofTypes.js';
import { hexLab, linear } from './roofColorMath.js';
import { getRoofStyle } from './roofStyles.js';

export interface RoofTitleInk { fill: string; edge: string; }

function contrastRatio(first: number, second: number): number {
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}

function luminance(rgb: number[]): number {
  return .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
}

function rgbHex(rgb: number[]): string {
  return `#${rgb.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function getRoofTitleInk(styleId: RoofStyleId, colors: RoofColors, material: HTMLCanvasElement): RoofTitleInk {
  const pixels = material.getContext('2d')!.getImageData(
    Math.floor(material.width * .3), Math.floor(material.height * .1),
    Math.floor(material.width * .4), Math.floor(material.height * .23)
  ).data;
  let luminance = 0, count = 0;
  for (let p = 0; p < pixels.length; p += 64) {
    luminance += .2126 * linear(pixels[p] / 255) + .7152 * linear(pixels[p + 1] / 255) + .0722 * linear(pixels[p + 2] / 255);
    count++;
  }
  const style = getRoofStyle(styleId)!;
  if (luminance / count > .30) {
    const fill = hexLab(colors[0])[1] > .02 ? (style.titleFill || '#361529') : '#163642';
    return { fill, edge: 'rgba(255,255,255,.85)' };
  }
  const edge = [1, 3, 5].map(i => Math.round(parseInt(colors[0].slice(i, i + 2), 16) * .35));
  return { fill: '#FFFFFF', edge: `rgba(${edge.join(',')},.98)` };
}

/** Table text is selected per label position; it need not match the title fill. */
export function getRoofAgendaInk(colors: string[], position: number, darkInk: string): string {
  const t = Math.max(0, Math.min(1, position)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(t)), f = t - i;
  const rgb = [1, 3, 5].map(offset => (
    parseInt(colors[i].slice(offset, offset + 2), 16) * (1 - f) + parseInt(colors[i + 1].slice(offset, offset + 2), 16) * f
  ) / 255);
  const backgroundL = luminance(rgb);
  let darkRGB = [1, 3, 5].map(offset => parseInt(darkInk.slice(offset, offset + 2), 16) / 255);
  // Keep the cancer-specific hue, but deepen it enough for 16px table text.
  // A measured safety margin absorbs Canvas gradient/raster rounding at 16px glyphs.
  for (let step = 0; step < 48; step++) {
    const quantized = darkRGB.map(value => Math.round(value * 255) / 255);
    if (contrastRatio(backgroundL, luminance(quantized)) >= 4.8) { darkRGB = quantized; break; }
    darkRGB = darkRGB.map(value => value * .88);
  }
  const contrastDark = contrastRatio(backgroundL, luminance(darkRGB));
  const contrastWhite = contrastRatio(backgroundL, 1);
  return contrastDark >= contrastWhite ? rgbHex(darkRGB) : '#FFFFFF';
}
