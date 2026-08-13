export type CancerDesignPresetId = 'lung' | 'headneck' | 'uterus' | 'urinary' | 'colorectal' | 'breast';

export interface CancerMotifPreset {
  id: string;
  name: string;
  src: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  opacity: number;
  rotation?: number;
}

export interface CancerDesignPreset {
  id: CancerDesignPresetId;
  label: string;
  designName: string;
  colorScheme: string;
  palette: [string, string, string];
  motifs: [CancerMotifPreset, CancerMotifPreset, CancerMotifPreset];
}

const motif = (
  id: string,
  name: string,
  src: string,
  xRatio: number,
  yRatio: number,
  widthRatio: number,
  opacity: number,
  rotation = 0
): CancerMotifPreset => ({ id, name, src, xRatio, yRatio, widthRatio, opacity, rotation });

export const cancerDesignPresets: Record<CancerDesignPresetId, CancerDesignPreset> = {
  lung: {
    id: 'lung',
    label: '肺癌',
    designName: '清透呼吸',
    colorScheme: 'cancer_lung',
    palette: ['#123B5D', '#2F8FA8', '#E8F8F7'],
    motifs: [
      motif('lung-lungs', '肺部主視覺', './assets/cancer-motifs/lung-lungs.png', 0.82, 0.24, 0.29, 0.3),
      motif('lung-scan-orbit', '影像掃描環', './assets/cancer-motifs/lung-scan-orbit.png', 0.17, 0.34, 0.22, 0.24, -0.08),
      motif('lung-cell-team', '細胞與照護', './assets/cancer-motifs/lung-cell-team.png', 0.82, 0.58, 0.3, 0.24)
    ]
  },
  headneck: {
    id: 'headneck',
    label: '頭頸癌',
    designName: '口腔聚焦',
    colorScheme: 'cancer_headneck',
    palette: ['#293C7A', '#93B7D3', '#EEF1FA'],
    motifs: [
      motif('headneck-profile', '向內凝視', './assets/cancer-motifs/headneck-profile.png', 0.82, 0.25, 0.28, 0.28),
      motif('headneck-oral-focus', '口腔定位環', './assets/cancer-motifs/headneck-oral-focus.png', 0.81, 0.22, 0.21, 0.3),
      motif('headneck-watercolor-path', '水彩照護路徑', './assets/cancer-motifs/headneck-watercolor-path.png', 0.13, 0.54, 0.2, 0.2)
    ]
  },
  uterus: {
    id: 'uterus',
    label: '婦癌',
    designName: '柔韌花瓣',
    colorScheme: 'cancer_endometrial',
    palette: ['#6F315A', '#D9828B', '#FBECEF'],
    motifs: [
      motif('endometrial-bloom', '花瓣主視覺', './assets/cancer-motifs/endometrial-bloom.png', 0.78, 0.25, 0.34, 0.27),
      motif('endometrial-uterus', '子宮花園', './assets/cancer-motifs/endometrial-uterus.png', 0.18, 0.48, 0.22, 0.24),
      motif('endometrial-petal-cells', '花瓣細胞', './assets/cancer-motifs/endometrial-petal-cells.png', 0.84, 0.6, 0.2, 0.2, 0.08)
    ]
  },
  urinary: {
    id: 'urinary',
    label: '泌尿癌',
    designName: '科學軌道',
    colorScheme: 'cancer_urinary',
    palette: ['#174B63', '#268B8F', '#EDF8F7'],
    motifs: [
      motif('urinary-system', '泌尿系統軌道', './assets/cancer-motifs/urinary-system.png', 0.82, 0.29, 0.27, 0.27),
      motif('urinary-kidneys', '雙腎科學圖', './assets/cancer-motifs/urinary-kidneys.png', 0.19, 0.44, 0.25, 0.22),
      motif('urinary-bladder-orbit', '膀胱定位軌道', './assets/cancer-motifs/urinary-bladder-orbit.png', 0.8, 0.61, 0.27, 0.22)
    ]
  },
  colorectal: {
    id: 'colorectal',
    label: '腸癌',
    designName: '路徑節奏',
    colorScheme: 'cancer_colorectal',
    palette: ['#213A50', '#D48A22', '#FFF4DE'],
    motifs: [
      motif('colorectal-pathway', '腸道治療路徑', './assets/cancer-motifs/colorectal-pathway.png', 0.82, 0.3, 0.28, 0.27),
      motif('colorectal-colon', '大腸主視覺', './assets/cancer-motifs/colorectal-colon.png', 0.18, 0.47, 0.23, 0.23),
      motif('colorectal-screening-nodes', '篩檢節點', './assets/cancer-motifs/colorectal-screening-nodes.png', 0.84, 0.61, 0.2, 0.2)
    ]
  },
  breast: {
    id: 'breast',
    label: '乳癌',
    designName: '絲帶編織',
    colorScheme: 'cancer_breast',
    palette: ['#7F294A', '#DA7C91', '#FFF1F4'],
    motifs: [
      motif('breast-ribbon', '絲帶主視覺', './assets/cancer-motifs/breast-ribbon.png', 0.82, 0.28, 0.25, 0.28),
      motif('breast-embrace', '守護擁抱', './assets/cancer-motifs/breast-embrace.png', 0.18, 0.5, 0.24, 0.23),
      motif('breast-cell-ribbon', '細胞絲帶', './assets/cancer-motifs/breast-cell-ribbon.png', 0.83, 0.62, 0.21, 0.2, -0.06)
    ]
  }
};

export const cancerDesignPresetList = Object.values(cancerDesignPresets);

export function isCancerDesignPresetId(value: string | null): value is CancerDesignPresetId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(cancerDesignPresets, value));
}
