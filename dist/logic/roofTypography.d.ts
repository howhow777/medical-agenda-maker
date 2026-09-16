import type { RoofColors, RoofStyleId } from '../assets/roofTypes.js';
export interface RoofTitleInk {
    fill: string;
    edge: string;
}
export declare function getRoofTitleInk(styleId: RoofStyleId, colors: RoofColors, material: HTMLCanvasElement): RoofTitleInk;
/** Table text is selected per label position; it need not match the title fill. */
export declare function getRoofAgendaInk(colors: string[], position: number, darkInk: string): string;
