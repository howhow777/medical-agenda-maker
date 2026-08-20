import { HeaderContourId } from '../assets/types.js';
export declare const headerContourIds: HeaderContourId[];
export declare const headerContourLabels: Record<HeaderContourId, string>;
export declare function createContourGradient(ctx: CanvasRenderingContext2D, colors: readonly string[], width: number, height: number): CanvasGradient;
export declare function traceHeaderContourPath(ctx: CanvasRenderingContext2D, contourId: HeaderContourId, width: number, height: number): void;
export declare function drawHeaderContour(ctx: CanvasRenderingContext2D, contourId: HeaderContourId, width: number, height: number, fill: string | CanvasGradient): void;
export declare function renderContourPreview(canvas: HTMLCanvasElement, contourId: HeaderContourId, colors: readonly string[]): void;
