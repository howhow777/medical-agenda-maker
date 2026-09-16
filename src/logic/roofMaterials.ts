import type { RoofColors, RoofSelection, RoofStyleId } from '../assets/roofTypes.js';
import { buildRoofMaps, recolorRoofPixels, type RoofMaps } from './roofColorMath.js';
import { getRoofAssetURL, getRoofPlacement, getRoofStyle, type RoofStyle } from './roofStyles.js';
import { isRoofColors } from './roofSelection.js';

export interface RoofImage {
  width: number;
  height: number;
  readPixels(): Uint8ClampedArray;
}
export type RoofDecoder = (style: RoofStyle) => Promise<RoofImage>;

export async function decodeRoofImage(style: RoofStyle): Promise<RoofImage> {
  const image = new Image();
  image.src = getRoofAssetURL(style.id);
  try { await image.decode(); }
  catch { throw new Error(`「${style.label}」圖片未能載入或解碼，請確認連線後重試`); }
  return {
    width: image.naturalWidth, height: image.naturalHeight,
    readPixels() {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('瀏覽器無法建立屋簷畫布');
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    }
  };
}

/** Small LRU shared by recolored and sized surfaces; keys include every input. */
export class RoofSurfaceCache<T> {
  private items = new Map<string, T>();
  constructor(public readonly limit = 8) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('快取上限必須是正整數');
  }
  get(key: string): T | undefined {
    const item = this.items.get(key);
    if (item !== undefined) { this.items.delete(key); this.items.set(key, item); }
    return item;
  }
  set(key: string, item: T): void {
    this.items.delete(key); this.items.set(key, item);
    while (this.items.size > this.limit) this.items.delete(this.items.keys().next().value!);
  }
  get size(): number { return this.items.size; }
}

export function roofSurfaceKey(styleId: RoofStyleId, colors: RoofColors, width: number, height: number): string {
  if (!getRoofStyle(styleId) || !isRoofColors(colors) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('無效屋簷渲染參數');
  }
  return `${styleId}:${colors.join(',')}:${width}x${height}`;
}

/** Explicit ID lookup, one successful decode per artwork, retryable failures. */
export class RoofMaterialLibrary {
  private pending = new Map<RoofStyleId, Promise<RoofImage>>();
  private images = new Map<RoofStyleId, RoofImage>();
  private maps = new Map<RoofStyleId, RoofMaps>();
  private surfaces = new RoofSurfaceCache<HTMLCanvasElement>(8);
  private errors = new Map<RoofStyleId, Error>();

  constructor(private decoder: RoofDecoder = decodeRoofImage) {}

  preload(styleId: RoofStyleId): Promise<RoofImage> {
    const style = getRoofStyle(styleId);
    if (!style) return Promise.reject(new Error('未知屋簷款式'));
    const existing = this.pending.get(styleId);
    if (existing) return existing;
    this.errors.delete(styleId);
    const task = Promise.resolve().then(() => this.decoder(style)).then(image => {
      if (image.width !== style.width || image.height !== style.height) throw new Error(`「${style.label}」素材尺寸不符`);
      this.images.set(styleId, image);
      return image;
    }).catch(error => {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.errors.set(styleId, failure);
      this.pending.delete(styleId);
      throw failure;
    });
    this.pending.set(styleId, task);
    return task;
  }

  isReady(styleId: RoofStyleId): boolean { return this.images.has(styleId); }
  getError(styleId: RoofStyleId): Error | undefined { return this.errors.get(styleId); }
  get loadedStyleIds(): RoofStyleId[] { return [...this.images.keys()]; }
  get surfaceCacheSize(): number { return this.surfaces.size; }

  getSurface(styleId: RoofStyleId, colors: RoofColors, width?: number): HTMLCanvasElement | null {
    const style = getRoofStyle(styleId);
    const image = this.images.get(styleId);
    if (!style || !image) return null;
    const outputWidth = width ?? style.width;
    const outputHeight = Math.max(1, Math.round(getRoofPlacement(styleId, outputWidth).height));
    const key = roofSurfaceKey(styleId, colors, outputWidth, outputHeight);
    const cached = this.surfaces.get(key);
    if (cached) return cached;
    if (outputWidth !== style.width) {
      const native = this.getSurface(styleId, colors)!;
      const output = document.createElement('canvas');
      output.width = outputWidth; output.height = outputHeight;
      const ctx = output.getContext('2d')!;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(native, 0, 0, output.width, output.height);
      this.surfaces.set(key, output);
      return output;
    }
    let maps = this.maps.get(styleId);
    if (!maps) {
      maps = buildRoofMaps(image.readPixels(), image.width, image.height, style.sourceColors);
      this.maps.set(styleId, maps);
    }
    const pixels = recolorRoofPixels(maps, style.sourceColors, colors);
    const output = document.createElement('canvas'); output.width = image.width; output.height = image.height;
    // Typography samples this surface. Keep its backing store stable before the
    // first draw so readback cannot switch resampling behavior between renders.
    const ctx = output.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.createImageData(output.width, output.height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    this.surfaces.set(key, output);
    return output;
  }
}

/** Renderer/UI only react to the latest selection, even in A/B/A completion order. */
export class RoofLoadCoordinator {
  private revision = 0;
  private selection: RoofSelection | undefined;
  constructor(private library: RoofMaterialLibrary) {}

  async select(selection: RoofSelection | undefined): Promise<{ current: boolean; error?: Error }> {
    const revision = ++this.revision;
    this.selection = selection ? { ...selection, colors: [...selection.colors] } : undefined;
    if (!selection) return { current: true };
    try {
      await this.library.preload(selection.styleId);
      return { current: revision === this.revision };
    } catch (error) {
      return { current: revision === this.revision, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /** Export fails visibly if the selected roof is unavailable, never silently falls back. */
  async readyForExport(): Promise<RoofSelection | undefined> {
    const revision = this.revision;
    const selection = this.selection;
    if (selection) await this.library.preload(selection.styleId);
    if (revision !== this.revision) throw new Error('屋簷選擇已改變，請重新下載');
    return selection ? { ...selection, colors: [...selection.colors] } : undefined;
  }
}

export const roofMaterialLibrary = new RoofMaterialLibrary();
