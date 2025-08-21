export interface AgendaItem {
    time: string;
    topic: string;
    speaker: string;
    moderator: string;
}
export interface CancerTemplate {
    icon: string;
    title: string;
    color: string;
    sampleItems: AgendaItem[];
}
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
}
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
export interface GradientDirection {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
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
    basicInfo: {
        title: string;
        subtitle: string;
        date: string;
        time: string;
        location: string;
    };
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
}
export interface AppState {
    agendaItems: AgendaItem[];
    currentTemplate: string;
    currentColorScheme: string;
    currentGradientDirection: string;
    overlays: Overlay[];
    selectedOverlayIndex: number;
    customColors: CustomColors;
}
