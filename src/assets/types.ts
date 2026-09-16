import type { RoofSelectionStateV1 } from './roofTypes.js';

// 議程項目
export interface AgendaItem {
  time: string;
  topic: string;
  speaker: string;
  moderator: string;
}

// 醫療會議範本
export interface CancerTemplate {
  icon: string;
  title: string;
  color: string;
  sampleItems: AgendaItem[];
}

// 配色方案
export interface ColorScheme {
  name: string;
  header: {
    colors: string[];
    text: string;
  };
  agenda: {
    background: string;
    alternateBackground: string; // 原本透明列的顏色
    border: string;
    accent: string;
  };
  tableOpacity: number; // Table 整體透明度 (0-1);
}

export type HeaderContourId = 'soft-wave' | 'arc-sweep' | 'layered-ribbon' | 'clean-diagonal';
export type OverlaySourceKind = 'upload' | 'cancer-preset';
export type MotifRole = 'primary' | 'copy';

// PNG圖層
export interface Overlay {
  id: number;
  name: string;
  img: HTMLImageElement;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  lockAspect: boolean;
  zIndex: number; // 舊版三層相容值；新版本以兩個固定物件關係為準
  aboveTable?: boolean;
  aboveHeader?: boolean;
  sourceKind?: OverlaySourceKind;
  cancerPresetId?: string;
  motifId?: string;
  motifRole?: MotifRole;
}

// 自訂配色
export interface CustomColors {
  headerC1: string;
  headerC2: string;
  headerC3: string;
  agendaBg: string;
  agendaBorder: string;
  agendaAccent: string;
  bgC1: string;
  bgC2: string;
  bgGradientDir: string;
}

// 梯度方向
export interface GradientDirection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// 拖拽狀態
export interface DragState {
  mode: string;
  idx: number;
  start: {
    x: number;
    y: number;
  };
  startOv: Overlay | null;
  handle: string | null;
  startAngle: number;
}

// 範本系統相關類型
export interface TemplateData {
  form: Record<string, any>;
  agendaItems: AgendaItem[];
  overlays: OverlayData[];
  customColors: CustomColors;
  meetupSettings: {
    showMeetupPoint: boolean;
    meetupType: 'same' | 'other';
    meetupCustomText: string;
  };
  footerSettings: {
    showFooterNote: boolean;
    footerContent: string;
  };
  moderatorDisplaySettings?: {
    hideModeratorColumn: boolean;
    mergeSameModerator: boolean;
  };
  basicInfo: {
    title: string;
    subtitle: string;
    date: string;
    time: string;
    location: string;
  };
  cancerDesignState?: CancerDesignStateV2;
  roofSelectionState?: RoofSelectionStateV1;
}

export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: string;
  lastModified: string;
  data: TemplateData;
}

export interface OverlayData {
  id: number;
  name: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  lockAspect: boolean;
  zIndex?: number;
  aboveTable?: boolean;
  aboveHeader?: boolean;
  sourceKind?: OverlaySourceKind;
  cancerPresetId?: string;
  motifId?: string;
  motifRole?: MotifRole;
}

export interface CancerDesignStateV2 {
  version: 2;
  activePresetId: string;
  primaryMotifByCancer: Record<string, string>;
  contourByCancer: Record<string, HeaderContourId>;
}

// 應用程式狀態
export interface AppState {
  agendaItems: AgendaItem[];
  currentTemplate: string;
  currentColorScheme: string;
  currentGradientDirection: string;
  overlays: Overlay[];
  selectedOverlayIndex: number;
  customColors: CustomColors;
}
