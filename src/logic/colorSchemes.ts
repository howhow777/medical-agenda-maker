import { ColorScheme, GradientDirection } from '../assets/types.js';

export const colorSchemes: Record<string, ColorScheme> = {
  medical_green: {
    name: '經典醫療綠',
    header: {
      colors: ['#1B4D3E', '#2D8659', '#4CAF85'],
      text: '#FFFFFF'
    },
    agenda: {
      background: '#E8F5E8',
      alternateBackground: '#FFFFFF', // 原本透明列改為白色
      border: '#1B4D3E',
      accent: '#2D8659'
    },
    tableOpacity: 1.0
  },
  business_green: {
    name: '專業商務綠',
    header: {
      colors: ['#1B4D3E', '#2F5233', '#B8860B'],
      text: '#FFFFFF'
    },
    agenda: {
      background: '#F0F4F0',
      alternateBackground: '#FFFFFF',
      border: '#2F5233',
      accent: '#1B4D3E'
    },
    tableOpacity: 1.0
  },
  tech_green: {
    name: '現代科技綠',
    header: {
      colors: ['#1B4D3E', '#1E6B7A', '#4A9EFF'],
      text: '#FFFFFF'
    },
    agenda: {
      background: '#E6F3FF',
      alternateBackground: '#FFFFFF',
      border: '#1E6B7A',
      accent: '#1B4D3E'
    },
    tableOpacity: 1.0
  },
  cancer_lung: {
    name: '肺癌｜清透呼吸',
    header: { colors: ['#347F91', '#55AABD', '#A7DDE1'], text: '#FFFFFF' },
    agenda: { background: '#EDF9F8', alternateBackground: '#FFFFFF', border: '#347F91', accent: '#153E50' },
    tableOpacity: 1.0
  },
  cancer_headneck: {
    name: '頭頸癌｜口腔聚焦',
    header: { colors: ['#626CA9', '#8585C0', '#BCC9E8'], text: '#FFFFFF' },
    agenda: { background: '#F3F4FB', alternateBackground: '#FFFFFF', border: '#626CA9', accent: '#2D356A' },
    tableOpacity: 1.0
  },
  cancer_endometrial: {
    name: '婦癌｜柔韌花瓣',
    header: { colors: ['#9B587B', '#C8738E', '#E7AAB0'], text: '#FFFFFF' },
    agenda: { background: '#FCEFF1', alternateBackground: '#FFFFFF', border: '#9B587B', accent: '#5F2F4B' },
    tableOpacity: 1.0
  },
  cancer_urinary: {
    name: '泌尿癌｜水光臨床',
    header: { colors: ['#3A7B84', '#54A09E', '#9ACBC0'], text: '#FFFFFF' },
    agenda: { background: '#EFF9F7', alternateBackground: '#FFFFFF', border: '#3A7B84', accent: '#174956' },
    tableOpacity: 1.0
  },
  cancer_colorectal: {
    name: '腸癌｜冷光路徑',
    header: { colors: ['#244F86', '#5F8FC4', '#76B8AE'], text: '#FFFFFF' },
    agenda: { background: '#DCEAF4', alternateBackground: '#FFFFFF', border: '#244F86', accent: '#244F86' },
    tableOpacity: 1.0
  },
  cancer_breast: {
    name: '乳癌｜絲帶編輯',
    header: { colors: ['#A65372', '#CE6F8B', '#E9A5B2'], text: '#FFFFFF' },
    agenda: { background: '#FFF2F5', alternateBackground: '#FFFFFF', border: '#A65372', accent: '#692A43' },
    tableOpacity: 1.0
  }
};

export const gradientDirections: Record<string, GradientDirection> = {
  horizontal: { x1: 0, y1: 0, x2: 1, y2: 0 },
  vertical: { x1: 0, y1: 0, x2: 0, y2: 1 },
  diagonal: { x1: 0, y1: 0, x2: 1, y2: 1 },
  radial: { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5 } // 特殊標記，實際使用時會檢查
};
