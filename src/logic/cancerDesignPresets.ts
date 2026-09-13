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

const motif = (id: string, name: string, filename: string): CancerMotifPreset => ({
  id,
  name,
  src: `./assets/cancer-motifs-v3/${filename}`
});

export const cancerDesignPresets: Record<CancerDesignPresetId, CancerDesignPreset> = {
  lung: {
    id: 'lung', label: '肺癌', designName: '清透呼吸', colorScheme: 'cancer_lung',
    palette: ['#347F91', '#55AABD', '#A7DDE1'], defaultContourId: 'soft-wave',
    motifs: [
      motif('lung-motif-01-tree-of-breath', '生命呼吸樹', 'lung-tree-of-breath.png'),
      motif('lung-motif-02-imaging-orbit', '影像精準軌道', 'lung-imaging-orbit.png'),
      motif('lung-motif-03-alveoli-immune-constellation', '肺泡免疫星群', 'lung-alveoli-immune-constellation.png')
    ]
  },
  headneck: {
    id: 'headneck', label: '頭頸癌', designName: '口腔聚焦', colorScheme: 'cancer_headneck',
    palette: ['#626CA9', '#8585C0', '#BCC9E8'], defaultContourId: 'arc-sweep',
    motifs: [
      motif('headneck-xray-perspective-bounded-godray-v4-locked', '口腔透視光束', 'headneck-xray-diagnostic.png'),
      motif('headneck-motif-02-closed-lip-diagnostic', '閉唇診斷意象', 'headneck-closed-lip-diagnostic.png'),
      motif('headneck-motif-03-cradled-head-neck', '呵護頭頸', 'headneck-cradled-care.png')
    ]
  },
  uterus: {
    id: 'uterus', label: '婦癌', designName: '柔韌花瓣', colorScheme: 'cancer_endometrial',
    palette: ['#9B587B', '#C8738E', '#E7AAB0'], defaultContourId: 'layered-ribbon',
    motifs: [
      motif('gyn-motif-01-reproductive-garden', '生殖系統花園', 'gyn-reproductive-garden.png'),
      motif('gyn-motif-02-therapeutic-containment', '治療守護場域', 'gyn-therapeutic-containment.png'),
      motif('gyn-motif-03-breaking-treatment-barrier', '突破治療屏障', 'gyn-breaking-treatment-barrier.png')
    ]
  },
  urinary: {
    id: 'urinary', label: '泌尿癌', designName: '水光臨床', colorScheme: 'cancer_urinary',
    palette: ['#3A7B84', '#54A09E', '#9ACBC0'], defaultContourId: 'arc-sweep',
    motifs: [
      motif('urinary-motif-01-complete-system', '完整泌尿系統', 'urinary-complete-system.png'),
      motif('urinary-motif-02-precision-orbit', '雙腎精準軌道', 'urinary-precision-orbit.png'),
      motif('urinary-motif-03-therapeutic-sanctuary', '膀胱治療守護', 'urinary-therapeutic-sanctuary.png')
    ]
  },
  colorectal: {
    id: 'colorectal', label: '腸癌', designName: '冷光路徑', colorScheme: 'cancer_colorectal',
    palette: ['#244F86', '#5F8FC4', '#76B8AE'], defaultContourId: 'clean-diagonal',
    motifs: [
      motif('colorectal-motif-01-treatment-atlas-v5', '治療路徑圖譜', 'colorectal-treatment-atlas.png'),
      motif('colorectal-motif-02-screening-window', '篩檢視窗', 'colorectal-screening-window.png'),
      motif('colorectal-motif-03-restored-ecology-v3', '重建腸道生態', 'colorectal-restored-ecology.png')
    ]
  },
  breast: {
    id: 'breast', label: '乳癌', designName: '絲帶編輯', colorScheme: 'cancer_breast',
    palette: ['#A65372', '#CE6F8B', '#E9A5B2'], defaultContourId: 'layered-ribbon',
    motifs: [
      motif('breast-motif-01-tissue-ribbon', '組織摺線絲帶', 'breast-tissue-ribbon.png'),
      motif('breast-motif-02-self-embrace', '自我守護', 'breast-self-embrace.png'),
      motif('breast-motif-03-precision-focus-ribbon', '精準聚焦絲帶', 'breast-precision-focus-ribbon.png')
    ]
  }
};

export const cancerDesignPresetList = Object.values(cancerDesignPresets);

const legacyMotifMap: Record<string, string> = {
  'lung-lungs': 'lung-motif-01-tree-of-breath',
  'lung-scan-orbit': 'lung-motif-02-imaging-orbit',
  'lung-cell-team': 'lung-motif-03-alveoli-immune-constellation',
  'headneck-profile': 'headneck-xray-perspective-bounded-godray-v4-locked',
  'headneck-oral-focus': 'headneck-motif-02-closed-lip-diagnostic',
  'headneck-watercolor-path': 'headneck-motif-03-cradled-head-neck',
  'endometrial-bloom': 'gyn-motif-01-reproductive-garden',
  'endometrial-uterus': 'gyn-motif-02-therapeutic-containment',
  'endometrial-petal-cells': 'gyn-motif-03-breaking-treatment-barrier',
  'urinary-system': 'urinary-motif-01-complete-system',
  'urinary-kidneys': 'urinary-motif-02-precision-orbit',
  'urinary-bladder-orbit': 'urinary-motif-03-therapeutic-sanctuary',
  'colorectal-pathway': 'colorectal-motif-01-treatment-atlas-v5',
  'colorectal-colon': 'colorectal-motif-02-screening-window',
  'colorectal-screening-nodes': 'colorectal-motif-03-restored-ecology-v3',
  'breast-ribbon': 'breast-motif-01-tissue-ribbon',
  'breast-embrace': 'breast-motif-02-self-embrace',
  'breast-cell-ribbon': 'breast-motif-03-precision-focus-ribbon'
};

export function isCancerDesignPresetId(value: string | null | undefined): value is CancerDesignPresetId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(cancerDesignPresets, value));
}

export function isHeaderContourId(value: unknown): value is HeaderContourId {
  return ['soft-wave', 'arc-sweep', 'layered-ribbon', 'clean-diagonal'].includes(String(value));
}

export function createDefaultCancerDesignState(): CancerDesignStateV2 {
  const primaryMotifByCancer: Record<string, string> = {};
  const contourByCancer: Record<string, HeaderContourId> = {};
  cancerDesignPresetList.forEach(preset => {
    primaryMotifByCancer[preset.id] = preset.motifs[0].id;
    contourByCancer[preset.id] = preset.defaultContourId;
  });
  return { version: 2, activePresetId: 'lung', primaryMotifByCancer, contourByCancer };
}

export function normalizeCancerDesignState(value: unknown): CancerDesignStateV2 {
  const defaults = createDefaultCancerDesignState();
  if (!value || typeof value !== 'object') return defaults;
  const input = value as Partial<CancerDesignStateV2> & { presetId?: string; motifId?: string };
  const activePresetId = isCancerDesignPresetId(input.activePresetId)
    ? input.activePresetId
    : isCancerDesignPresetId(input.presetId) ? input.presetId : 'lung';
  defaults.activePresetId = activePresetId;

  cancerDesignPresetList.forEach(preset => {
    const selected = input.primaryMotifByCancer?.[preset.id];
    if (selected && preset.motifs.some(item => item.id === selected)) {
      defaults.primaryMotifByCancer[preset.id] = selected;
    }
    const contour = input.contourByCancer?.[preset.id];
    if (isHeaderContourId(contour)) defaults.contourByCancer[preset.id] = contour;
  });

  const migratedMotifId = input.motifId ? legacyMotifMap[input.motifId] || input.motifId : undefined;
  if (migratedMotifId && cancerDesignPresets[activePresetId].motifs.some(item => item.id === migratedMotifId)) {
    defaults.primaryMotifByCancer[activePresetId] = migratedMotifId;
  }
  return defaults;
}
