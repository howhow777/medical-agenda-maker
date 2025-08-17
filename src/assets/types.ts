// 議程項目
export interface AgendaItem {
  time: string;
  topic: string;
  speaker: string;
  moderator: string;
}

// 癌症專科範本
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
    border: string;
    accent: string;
  };
}

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
  crop: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
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

// 裁切器狀態
export interface CropperState {
  open: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
  imgW: number;
  imgH: number;
  rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  mode: string;
  start: {
    x: number;
    y: number;
  };
  hit: string;
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
  cropMode: boolean;
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
  isCropMode: boolean;
}