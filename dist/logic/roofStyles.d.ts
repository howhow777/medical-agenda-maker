import type { ColorScheme } from '../assets/types.js';
import type { RoofColors, RoofStyleId } from '../assets/roofTypes.js';
import { type CancerDesignPresetId } from './cancerDesignPresets.js';
export interface RoofStyle {
    id: RoofStyleId;
    label: string;
    family: 'cool' | 'warm';
    filename: string;
    width: number;
    height: number;
    bytes: number;
    sha256: string;
    sourceColors: RoofColors;
    titleFill?: string;
    agenda?: ColorScheme['agenda'];
}
export declare const roofStyles: readonly RoofStyle[];
export declare function getRoofStyle(id: unknown): RoofStyle | undefined;
export declare function getRoofStylesForCancer(cancerId: CancerDesignPresetId): readonly RoofStyle[];
export declare function isApprovedRoofPair(cancerId: unknown, styleId: unknown): boolean;
export declare const approvedRoofPairs: {
    cancerId: CancerDesignPresetId;
    styleId: RoofStyleId;
}[];
export declare function getRoofAssetURL(styleId: RoofStyleId): string;
/** Return copies so selecting/customizing a roof cannot mutate legacy schemes. */
export declare function getRecommendedRoofScheme(cancerId: CancerDesignPresetId, styleId: RoofStyleId): ColorScheme;
/** One placement for thumbnails, normal Canvas and scaled export. Never 150px. */
export declare function getRoofPlacement(styleId: RoofStyleId, width: number): {
    x: number;
    y: number;
    width: number;
    height: number;
};
