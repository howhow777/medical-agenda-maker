import type { RoofColors, RoofSelection, RoofStyleId } from '../assets/roofTypes.js';
import { type RoofStyle } from './roofStyles.js';
export interface RoofImage {
    width: number;
    height: number;
    readPixels(): Uint8ClampedArray;
}
export type RoofDecoder = (style: RoofStyle) => Promise<RoofImage>;
export declare function decodeRoofImage(style: RoofStyle): Promise<RoofImage>;
/** Small LRU shared by recolored and sized surfaces; keys include every input. */
export declare class RoofSurfaceCache<T> {
    readonly limit: number;
    private items;
    constructor(limit?: number);
    get(key: string): T | undefined;
    set(key: string, item: T): void;
    get size(): number;
}
export declare function roofSurfaceKey(styleId: RoofStyleId, colors: RoofColors, width: number, height: number): string;
/** Explicit ID lookup, one successful decode per artwork, retryable failures. */
export declare class RoofMaterialLibrary {
    private decoder;
    private pending;
    private images;
    private maps;
    private surfaces;
    private errors;
    constructor(decoder?: RoofDecoder);
    preload(styleId: RoofStyleId): Promise<RoofImage>;
    isReady(styleId: RoofStyleId): boolean;
    getError(styleId: RoofStyleId): Error | undefined;
    get loadedStyleIds(): RoofStyleId[];
    get surfaceCacheSize(): number;
    getSurface(styleId: RoofStyleId, colors: RoofColors, width?: number): HTMLCanvasElement | null;
}
/** Renderer/UI only react to the latest selection, even in A/B/A completion order. */
export declare class RoofLoadCoordinator {
    private library;
    private revision;
    private selection;
    constructor(library: RoofMaterialLibrary);
    select(selection: RoofSelection | undefined): Promise<{
        current: boolean;
        error?: Error;
    }>;
    /** Export fails visibly if the selected roof is unavailable, never silently falls back. */
    readyForExport(): Promise<RoofSelection | undefined>;
}
export declare const roofMaterialLibrary: RoofMaterialLibrary;
