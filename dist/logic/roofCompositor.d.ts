import type { RoofStyleId } from '../assets/roofTypes.js';
/** Interpolate complete scenes in premultiplied space, NOT two source-over masks.
 * A 50%-opaque object present in both scenes stays 50%, not 75%.
 */
export declare function mixRoofCoverage(outside: Uint8ClampedArray, inside: Uint8ClampedArray, coverage: Uint8ClampedArray): Uint8ClampedArray;
export declare function extractRoofCoverage(pixels: Uint8ClampedArray): {
    coverage: Uint8ClampedArray;
    complement: Uint8ClampedArray;
};
/** The outside scene already has overlays once, in their original order.
 * The inside scene is the un-matted opaque roof plus title/above-header overlays.
 * Their coverage-weighted combination restores the approved transparent artwork
 * while letting every object cross its soft boundary without repeated alpha.
 */
export declare function compositeOpticalRoof(target: CanvasRenderingContext2D, source: HTMLCanvasElement, styleId: RoofStyleId, logicalWidth: number, paintInside: (context: CanvasRenderingContext2D) => void): void;
