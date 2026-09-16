import type { ColorScheme } from '../assets/types.js';
import type { RoofColors, RoofStyleId } from '../assets/roofTypes.js';
import { cancerDesignPresetList, type CancerDesignPresetId } from './cancerDesignPresets.js';
import { colorSchemes } from './colorSchemes.js';

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

const coolColors: RoofColors = ['#186878', '#35adbf', '#abe6db'];
export const roofStyles: readonly RoofStyle[] = [
  { id: 'optical-signal', label: '青藍交錯光膜', family: 'cool', filename: 'signal-mother-v4.png',
    width: 2167, height: 726, bytes: 1111674,
    sha256: 'ac7361f47e39043b7a5ad161c77e6a62175c0297ce93eab0ee9612aea46980bd', sourceColors: [...coolColors] },
  { id: 'satin-arc', label: '清透弧帶', family: 'cool', filename: 'lung-satin-arc-v1.png',
    width: 2172, height: 724, bytes: 1095733,
    sha256: '3b5f9e8bbcc2207736a53200187ac0f8670ed72669af694069aa30f2ecf679a2', sourceColors: [...coolColors] },
  { id: 'waterlight', label: '水光流域', family: 'cool', filename: 'urinary-waterlight-v1.png',
    width: 2172, height: 724, bytes: 1315389,
    sha256: 'd67d51cd6c90ec512dbb777f3b6f2b8b24160610db5fa02c9998b47fd0479a88', sourceColors: [...coolColors] },
  { id: 'rose-satin', label: '晨曦柔綢', family: 'warm', filename: 'breast-rose-satin-v1.png',
    width: 2172, height: 724, bytes: 1199248,
    sha256: '6333fb6102cc036d7db6b885b7547aa23f964f4ab2a4dbdc9d19cc18fe707d9b',
    sourceColors: ['#F36AA5', '#FF9CA9', '#FFE4CE'], titleFill: '#862452',
    agenda: { background: '#FFF3F6', alternateBackground: '#FFFFFF', border: '#F36AA5', accent: '#57253F' } },
  { id: 'coral-arch', label: '珊瑚杏光', family: 'warm', filename: 'gyn-coral-arch-v1.png',
    width: 2172, height: 724, bytes: 1071261,
    sha256: '3fe7a009c0900cfb34151920942a74e803ade2df4452d4b37227ac1f8a2e9ce7',
    sourceColors: ['#F66B79', '#FFAD74', '#FFE9B5'], titleFill: '#95403E',
    agenda: { background: '#FFF5EF', alternateBackground: '#FFFFFF', border: '#F66B79', accent: '#773D42' } },
  { id: 'peach-flow', label: '桃金流光', family: 'warm', filename: 'warm-peach-flow-v1.png',
    width: 2172, height: 724, bytes: 1246201,
    sha256: '6e53994e5023bd8fd5fc9d62c40125bf76c1dd7fa3848fcc1e222bdb2b385d8c',
    sourceColors: ['#EE718E', '#F7B3A0', '#FFF0D0'], titleFill: '#8F4059',
    agenda: { background: '#FFF4F1', alternateBackground: '#FFFFFF', border: '#EE718E', accent: '#783D50' } }
];

export function getRoofStyle(id: unknown): RoofStyle | undefined {
  return roofStyles.find(style => style.id === id);
}

export function getRoofStylesForCancer(cancerId: CancerDesignPresetId): readonly RoofStyle[] {
  const family = cancerId === 'breast' || cancerId === 'uterus' ? 'warm' : 'cool';
  return roofStyles.filter(style => style.family === family);
}

export function isApprovedRoofPair(cancerId: unknown, styleId: unknown): boolean {
  return cancerDesignPresetList.some(cancer => cancer.id === cancerId &&
    getRoofStylesForCancer(cancer.id).some(style => style.id === styleId));
}

export const approvedRoofPairs = cancerDesignPresetList.flatMap(cancer =>
  getRoofStylesForCancer(cancer.id).map(style => ({ cancerId: cancer.id, styleId: style.id })));

export function getRoofAssetURL(styleId: RoofStyleId): string {
  const style = getRoofStyle(styleId);
  if (!style) throw new Error('未知屋簷款式');
  return new URL(`../../assets/header-contour-materials-v2/${style.filename}`, import.meta.url).href;
}

/** Return copies so selecting/customizing a roof cannot mutate legacy schemes. */
export function getRecommendedRoofScheme(cancerId: CancerDesignPresetId, styleId: RoofStyleId): ColorScheme {
  if (!isApprovedRoofPair(cancerId, styleId)) throw new Error('此癌別沒有核准這款屋簷');
  const style = getRoofStyle(styleId)!;
  if (style.family === 'warm') return {
    name: style.label, header: { colors: [...style.sourceColors], text: style.titleFill! },
    agenda: { ...style.agenda! }, tableOpacity: 1
  };
  if (cancerId === 'headneck') return {
    name: '頭頸清透藍紫', header: { colors: ['#526FAD', '#779BD0', '#C3E1EF'], text: '#FFFFFF' },
    agenda: { background: '#F0F6FC', alternateBackground: '#FFFFFF', border: '#526FAD', accent: '#263F69' }, tableOpacity: 1
  };
  const cancer = cancerDesignPresetList.find(item => item.id === cancerId)!;
  const scheme = colorSchemes[cancer.colorScheme];
  return { ...scheme, header: { ...scheme.header, colors: [...scheme.header.colors] }, agenda: { ...scheme.agenda } };
}

/** One placement for thumbnails, normal Canvas and scaled export. Never 150px. */
export function getRoofPlacement(styleId: RoofStyleId, width: number): { x: number; y: number; width: number; height: number } {
  const style = getRoofStyle(styleId);
  if (!style || !Number.isFinite(width) || width <= 0) throw new Error('無效屋簷尺寸');
  return { x: 0, y: 0, width, height: width * style.height / style.width };
}
