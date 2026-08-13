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
    header: { colors: ['#123B5D', '#2F8FA8', '#71C9CE'], text: '#FFFFFF' },
    agenda: { background: '#E8F8F7', alternateBackground: '#FFFFFF', border: '#123B5D', accent: '#123B5D' },
    tableOpacity: 1.0
  },
  cancer_headneck: {
    name: '頭頸癌｜口腔聚焦',
    header: { colors: ['#293C7A', '#655FA3', '#93B7D3'], text: '#FFFFFF' },
    agenda: { background: '#EEF1FA', alternateBackground: '#FFFFFF', border: '#293C7A', accent: '#293C7A' },
    tableOpacity: 1.0
  },
  cancer_endometrial: {
    name: '婦癌｜柔韌花瓣',
    header: { colors: ['#6F315A', '#B64F70', '#D9828B'], text: '#FFFFFF' },
    agenda: { background: '#FBECEF', alternateBackground: '#FFFFFF', border: '#6F315A', accent: '#6F315A' },
    tableOpacity: 1.0
  },
  cancer_urinary: {
    name: '泌尿癌｜科學軌道',
    header: { colors: ['#174B63', '#268B8F', '#79B8A5'], text: '#FFFFFF' },
    agenda: { background: '#EDF8F7', alternateBackground: '#FFFFFF', border: '#174B63', accent: '#174B63' },
    tableOpacity: 1.0
  },
  cancer_colorectal: {
    name: '腸癌｜路徑節奏',
    header: { colors: ['#213A50', '#B65D45', '#D48A22'], text: '#FFFFFF' },
    agenda: { background: '#FFF4DE', alternateBackground: '#FFFFFF', border: '#213A50', accent: '#213A50' },
    tableOpacity: 1.0
  },
  cancer_breast: {
    name: '乳癌｜絲帶編織',
    header: { colors: ['#7F294A', '#B94768', '#DA7C91'], text: '#FFFFFF' },
    agenda: { background: '#FFF1F4', alternateBackground: '#FFFFFF', border: '#7F294A', accent: '#7F294A' },
    tableOpacity: 1.0
  }
};

export const gradientDirections: Record<string, GradientDirection> = {
  horizontal: { x1: 0, y1: 0, x2: 1, y2: 0 },
  vertical: { x1: 0, y1: 0, x2: 0, y2: 1 },
  diagonal: { x1: 0, y1: 0, x2: 1, y2: 1 },
  radial: { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5 } // 特殊標記，實際使用時會檢查
};
