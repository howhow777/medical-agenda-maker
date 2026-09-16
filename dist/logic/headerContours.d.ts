/** Exact geometry from GitHub Pages commit e786b829 at an 800px logical width. */
export declare const CLASSIC_ROOF_LABEL = "\u6700\u521D\u7248\u6CE2\u6D6A\u4E3B\u8996\u89BA";
export declare const CLASSIC_ROOF_BASE_WIDTH = 800;
export declare const CLASSIC_ROOF_HEADER_HEIGHT = 120;
export declare const CLASSIC_ROOF_MAX_Y = 130;
export declare const classicRoofPathSignature: readonly [readonly ["M", 0, 0], readonly ["L", 800, 0], readonly ["L", 800, 100], readonly ["Q", 600, 130, 400, 110], readonly ["Q", 200, 90, 0, 120], readonly ["Z"]];
/** One canonical path shared by preview, poster, clipping, fallback and export. */
export declare function traceClassicRoofPath(ctx: CanvasRenderingContext2D, width: number): void;
export declare function drawClassicRoof(ctx: CanvasRenderingContext2D, width: number, fill: string | CanvasGradient | CanvasPattern): void;
export declare function renderClassicRoofPreview(canvas: HTMLCanvasElement, colors: readonly string[]): void;
