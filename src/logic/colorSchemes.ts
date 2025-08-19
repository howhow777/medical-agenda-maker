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
      border: '#1B4D3E',
      accent: '#2D8659'
    }
  },
  business_green: {
    name: '專業商務綠',
    header: {
      colors: ['#1B4D3E', '#2F5233', '#B8860B'],
      text: '#FFFFFF'
    },
    agenda: {
      background: '#F0F4F0',
      border: '#2F5233',
      accent: '#1B4D3E'
    }
  },
  tech_green: {
    name: '現代科技綠',
    header: {
      colors: ['#1B4D3E', '#1E6B7A', '#4A9EFF'],
      text: '#FFFFFF'
    },
    agenda: {
      background: '#E6F3FF',
      border: '#1E6B7A',
      accent: '#1B4D3E'
    }
  }
};

export const gradientDirections: Record<string, GradientDirection> = {
  horizontal: { x1: 0, y1: 0, x2: 1, y2: 0 },
  vertical: { x1: 0, y1: 0, x2: 0, y2: 1 },
  diagonal: { x1: 0, y1: 0, x2: 1, y2: 1 },
  radial: { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5 } // 特殊標記，實際使用時會檢查
};
