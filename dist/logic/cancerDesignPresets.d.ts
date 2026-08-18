import { CancerDesignStateV2, HeaderContourId } from '../assets/types.js';
export type CancerDesignPresetId = 'lung' | 'headneck' | 'uterus' | 'urinary' | 'colorectal' | 'breast';
export interface CancerMotifPreset {
    id: string;
    name: string;
    src: string;
}
export interface CancerDesignPreset {
    id: CancerDesignPresetId;
    label: string;
    designName: string;
    colorScheme: string;
    palette: [string, string, string];
    defaultContourId: HeaderContourId;
    motifs: [CancerMotifPreset, CancerMotifPreset, CancerMotifPreset];
}
export declare const cancerDesignPresets: Record<CancerDesignPresetId, CancerDesignPreset>;
export declare const cancerDesignPresetList: CancerDesignPreset[];
export declare function isCancerDesignPresetId(value: string | null | undefined): value is CancerDesignPresetId;
export declare function isHeaderContourId(value: unknown): value is HeaderContourId;
export declare function createDefaultCancerDesignState(): CancerDesignStateV2;
export declare function normalizeCancerDesignState(value: unknown): CancerDesignStateV2;
