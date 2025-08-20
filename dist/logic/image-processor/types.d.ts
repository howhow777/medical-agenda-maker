export interface Transform {
    tx: number;
    ty: number;
    scale: number;
    rot: number;
}
export interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface Size {
    w: number;
    h: number;
}
export interface Point {
    x: number;
    y: number;
}
export interface CropOptions {
    aspectRatio?: number;
    minSize?: number;
    keepAspect?: boolean;
}
export interface TransformCropParams {
    transform: Transform;
    cropRect: Rectangle;
    naturalSize: Size;
    displaySize: Size;
    displayOffset: Point;
}
export interface ProcessResult {
    blob: Blob;
    dataURL: string;
    dimensions: Size;
    actualCropRect: Rectangle;
}
export interface ProcessOptions {
    outputFormat?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    smoothing?: boolean;
    backgroundColor?: string;
}
