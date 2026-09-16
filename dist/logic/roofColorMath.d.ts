import type { RoofColors } from '../assets/roofTypes.js';
export type Triple = [number, number, number];
export declare const clamp: (v: number, lo?: number, hi?: number) => number;
export declare const linear: (v: number) => number;
/** Retains the approved study's OKLab transfer, including its warm-light guard. */
export declare function rgbToLab(rgb: Triple): Triple;
export declare function labToRGB([L, a, b]: Triple): Triple;
export declare const hexLab: (hex: string) => Triple;
export declare function tonalWeights(L: number, anchors: Triple[]): Triple;
export declare function transferRoofChroma(a: number, b: number, baseA: number, baseB: number, targetA: number, targetB: number): [number, number];
export interface RoofMaps {
    width: number;
    height: number;
    values: Float32Array;
}
/** Inferred white-matte coverage, not physical extraction of painted layers. */
export declare function buildRoofMaps(pixels: Uint8ClampedArray, width: number, height: number, sourceColors: RoofColors): RoofMaps;
export declare function recolorRoofPixels(maps: RoofMaps, sourceColors: RoofColors, colors: RoofColors): Uint8ClampedArray;
