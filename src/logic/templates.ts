import { CancerTemplate } from '../assets/types.js';

export const templates: Record<string, CancerTemplate> = {
  lung: {
    icon: '🫁',
    title: '肺癌',
    color: '#4A90E2',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '肺癌篩檢最新進展', speaker: '胸腔科主任', moderator: '呼吸治療師' },
      { time: '09:30-10:30', topic: '免疫治療在肺癌的應用', speaker: '腫瘤科醫師', moderator: '內科醫師' },
      { time: '10:30-11:00', topic: '茶歇時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '精準醫療與基因檢測', speaker: '病理科教授', moderator: '分子診斷專家' }
    ]
  },
  headneck: {
    icon: '👤',
    title: '頭頸癌',
    color: '#E74C3C',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '頭頸癌早期診斷策略', speaker: '耳鼻喉科主任', moderator: '影像醫學科醫師' },
      { time: '09:30-10:30', topic: '放射治療新技術', speaker: '放射腫瘤科醫師', moderator: '物理師' },
      { time: '10:30-11:00', topic: '休息時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '重建手術案例討論', speaker: '整形外科教授', moderator: '頭頸外科醫師' }
    ]
  },
  uterus: {
    icon: '♀️',
    title: '子宮體癌',
    color: '#FF69B4',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '子宮內膜癌分期與治療', speaker: '婦產科主任', moderator: '病理科醫師' },
      { time: '09:30-10:30', topic: '微創手術技術進展', speaker: '婦癌科醫師', moderator: '麻醉科醫師' },
      { time: '10:30-11:00', topic: '茶歇', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '荷爾蒙治療與追蹤', speaker: '內分泌科教授', moderator: '婦產科醫師' }
    ]
  },
  urinary: {
    icon: '🩺',
    title: '泌尿道癌',
    color: '#3498DB',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '膀胱癌診斷與分期', speaker: '泌尿科主任', moderator: '影像醫學科醫師' },
      { time: '09:30-10:30', topic: '腎臟癌標靶治療', speaker: '腫瘤科醫師', moderator: '藥劑師' },
      { time: '10:30-11:00', topic: '休息時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '攝護腺癌荷爾蒙治療', speaker: '泌尿腫瘤科教授', moderator: '泌尿科醫師' }
    ]
  },
  colorectal: {
    icon: '🩻',
    title: '大腸直腸癌',
    color: '#F39C12',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '大腸癌篩檢與預防', speaker: '大腸直腸外科主任', moderator: '家醫科醫師' },
      { time: '09:30-10:30', topic: '腹腔鏡手術技術', speaker: '外科醫師', moderator: '手術室護理師' },
      { time: '10:30-11:00', topic: '茶歇時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '轉移性大腸癌治療策略', speaker: '腫瘤科教授', moderator: '臨床藥師' }
    ]
  },
  breast: {
    icon: '🎗️',
    title: '乳癌',
    color: '#E91E63',
    sampleItems: [
      { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
      { time: '09:00-09:30', topic: '乳癌基因檢測與風險評估', speaker: '乳房外科主任', moderator: '遺傳諮詢師' },
      { time: '09:30-10:30', topic: 'HER2陽性乳癌治療', speaker: '腫瘤科醫師', moderator: '乳房專科護理師' },
      { time: '10:30-11:00', topic: '休息時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '乳房重建與美容', speaker: '整形外科教授', moderator: '乳癌病友代表' }
    ]
  },

  // 新增：醫學會議議程模板 (使用特殊標識符來區分)
  'medical_agenda_special': {
    icon: '📝',
    title: '醫學會議議程',
    color: '#1a365d',
    sampleItems: [
      { time: '09:00-09:30', topic: '會議開場', speaker: '大會主席', moderator: '秘書長' },
      { time: '09:30-10:30', topic: '主題演講', speaker: '專家醫師', moderator: '學科主任' },
      { time: '10:30-11:00', topic: '茶歇時間', speaker: '', moderator: '' },
      { time: '11:00-12:00', topic: '經驗分享', speaker: '臨床醫師', moderator: '主治醫師' }
    ]
  }
};
