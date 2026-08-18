import { CancerDesignStateV2, HeaderContourId } from '../assets/types.js';
import {
  CancerDesignPresetId,
  cancerDesignPresetList,
  cancerDesignPresets,
  createDefaultCancerDesignState,
  normalizeCancerDesignState
} from '../logic/cancerDesignPresets.js';
import { headerContourIds, headerContourLabels, renderContourPreview } from '../logic/headerContours.js';

export type CancerDesignAction =
  | { type: 'select-cancer'; presetId: CancerDesignPresetId }
  | { type: 'select-primary'; presetId: CancerDesignPresetId; motifId: string }
  | { type: 'add-copy'; presetId: CancerDesignPresetId; motifId: string }
  | { type: 'select-contour'; presetId: CancerDesignPresetId; contourId: HeaderContourId };

type ActionHandler = (action: CancerDesignAction) => Promise<void>;

export const CANCER_DESIGN_STORAGE_KEY_V2 = 'medical-agenda-maker:cancer-design-selection:v2';
export const CANCER_DESIGN_STORAGE_KEY_V1 = 'medical-agenda-maker:cancer-design-selection:v1';

export class CancerDesignSwitcher {
  private trigger: HTMLButtonElement;
  private drawer: HTMLElement;
  private backdrop: HTMLElement;
  private closeButton: HTMLButtonElement;
  private cardGrid: HTMLElement;
  private motifGrid: HTMLElement;
  private motifTitle: HTMLElement;
  private contourGrid: HTMLElement;
  private state: CancerDesignStateV2 = createDefaultCancerDesignState();
  private lastFocusedElement: HTMLElement | null = null;

  constructor(private onAction: ActionHandler) {
    this.trigger = this.requireElement<HTMLButtonElement>('designSwitcherTrigger');
    this.drawer = this.requireElement<HTMLElement>('designSwitcherDrawer');
    this.backdrop = this.requireElement<HTMLElement>('designSwitcherBackdrop');
    this.closeButton = this.requireElement<HTMLButtonElement>('designSwitcherClose');
    this.cardGrid = this.requireElement<HTMLElement>('designPresetGrid');
    this.motifGrid = this.requireElement<HTMLElement>('designMotifGrid');
    this.motifTitle = this.requireElement<HTMLElement>('designMotifTitle');
    this.contourGrid = this.requireElement<HTMLElement>('designContourGrid');
  }

  async initialize(): Promise<void> {
    this.state = this.restoreSelection();
    this.render();
    this.bindEvents();
    await this.onAction({ type: 'select-cancer', presetId: this.activePresetId });
  }

  getState(): CancerDesignStateV2 {
    return JSON.parse(JSON.stringify(this.state)) as CancerDesignStateV2;
  }

  restoreState(value: unknown, persist = true): CancerDesignStateV2 {
    this.state = normalizeCancerDesignState(value);
    if (persist) this.saveSelection();
    this.render();
    return this.getState();
  }

  private get activePresetId(): CancerDesignPresetId {
    return this.state.activePresetId as CancerDesignPresetId;
  }

  private bindEvents(): void {
    this.trigger.addEventListener('click', () => {
      this.trigger.classList.remove('design-switcher-discovery');
      this.open();
    });
    this.closeButton.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    document.addEventListener('keydown', event => {
      if (!this.isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  private render(): void {
    this.cardGrid.replaceChildren(...cancerDesignPresetList.map(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'design-preset-card';
      button.dataset.presetId = preset.id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(preset.id === this.activePresetId));
      button.setAttribute('aria-label', `${preset.label}，${preset.designName}`);

      const preview = document.createElement('span');
      preview.className = 'design-preset-preview';
      const contour = document.createElement('canvas');
      contour.className = 'design-preset-contour';
      contour.width = 300;
      contour.height = 112;
      const selectedMotifId = this.state.primaryMotifByCancer[preset.id];
      const selectedMotif = preset.motifs.find(item => item.id === selectedMotifId) || preset.motifs[0];
      const image = document.createElement('img');
      image.src = selectedMotif.src;
      image.alt = '';
      image.loading = 'eager';
      preview.append(contour, image, this.createPalette(preset.palette));

      const label = document.createElement('span');
      label.className = 'design-preset-label';
      label.innerHTML = `<strong>${preset.label}</strong><span>${headerContourLabels[this.state.contourByCancer[preset.id]]} · ${selectedMotif.name}</span>`;
      button.append(preview, label);
      button.addEventListener('click', async () => {
        this.state.activePresetId = preset.id;
        this.saveSelection();
        this.render();
        await this.onAction({ type: 'select-cancer', presetId: preset.id });
      });
      window.requestAnimationFrame(() => renderContourPreview(contour, this.state.contourByCancer[preset.id], preset.palette));
      return button;
    }));

    const selectedPreset = cancerDesignPresets[this.activePresetId];
    this.motifTitle.textContent = `${selectedPreset.label}搭配圖案`;
    const selectedMotifId = this.state.primaryMotifByCancer[this.activePresetId];
    this.motifGrid.replaceChildren(...selectedPreset.motifs.map(motif => {
      const card = document.createElement('article');
      card.className = 'design-motif-card';
      card.dataset.motifId = motif.id;
      card.setAttribute('aria-current', String(motif.id === selectedMotifId));

      const primaryButton = document.createElement('button');
      primaryButton.type = 'button';
      primaryButton.className = 'design-motif-primary';
      primaryButton.setAttribute('aria-label', `設為主圖：${motif.name}`);
      primaryButton.setAttribute('aria-pressed', String(motif.id === selectedMotifId));
      const image = document.createElement('img');
      image.src = motif.src;
      image.alt = '';
      const name = document.createElement('span');
      name.textContent = motif.name;
      primaryButton.append(image, name);
      primaryButton.addEventListener('click', async () => {
        this.state.primaryMotifByCancer[this.activePresetId] = motif.id;
        this.saveSelection();
        this.render();
        await this.onAction({ type: 'select-primary', presetId: this.activePresetId, motifId: motif.id });
      });

      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'design-motif-add';
      addButton.textContent = '＋ 加入';
      addButton.setAttribute('aria-label', `加入一份${motif.name}`);
      addButton.addEventListener('click', async () => {
        await this.onAction({ type: 'add-copy', presetId: this.activePresetId, motifId: motif.id });
      });
      card.append(primaryButton, addButton);
      return card;
    }));

    const activeContour = this.state.contourByCancer[this.activePresetId];
    this.contourGrid.replaceChildren(...headerContourIds.map(contourId => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'design-contour-card';
      button.setAttribute('aria-pressed', String(contourId === activeContour));
      button.setAttribute('aria-label', `套用${headerContourLabels[contourId]}`);
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 76;
      canvas.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = headerContourLabels[contourId];
      button.append(canvas, label);
      button.addEventListener('click', async () => {
        this.state.contourByCancer[this.activePresetId] = contourId;
        this.saveSelection();
        this.render();
        await this.onAction({ type: 'select-contour', presetId: this.activePresetId, contourId });
      });
      window.requestAnimationFrame(() => renderContourPreview(canvas, contourId, selectedPreset.palette));
      return button;
    }));
  }

  private createPalette(colors: readonly string[]): HTMLElement {
    const palette = document.createElement('span');
    palette.className = 'design-preset-palette';
    colors.forEach(color => {
      const swatch = document.createElement('i');
      swatch.style.backgroundColor = color;
      palette.append(swatch);
    });
    return palette;
  }

  private open(): void {
    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.drawer.classList.add('is-open');
    this.backdrop.classList.add('is-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.drawer.removeAttribute('inert');
    this.trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('design-switcher-open');
    window.setTimeout(() => this.closeButton.focus(), 0);
  }

  private close(): void {
    this.drawer.classList.remove('is-open');
    this.backdrop.classList.remove('is-open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.drawer.setAttribute('inert', '');
    this.trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('design-switcher-open');
    (this.lastFocusedElement || this.trigger).focus();
  }

  private isOpen(): boolean {
    return this.drawer.classList.contains('is-open');
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusable = Array.from(this.drawer.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreSelection(): CancerDesignStateV2 {
    try {
      const v2 = localStorage.getItem(CANCER_DESIGN_STORAGE_KEY_V2);
      if (v2) return normalizeCancerDesignState(JSON.parse(v2));
      const v1 = localStorage.getItem(CANCER_DESIGN_STORAGE_KEY_V1);
      if (v1) {
        const migrated = normalizeCancerDesignState(JSON.parse(v1));
        localStorage.setItem(CANCER_DESIGN_STORAGE_KEY_V2, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      localStorage.removeItem(CANCER_DESIGN_STORAGE_KEY_V2);
    }
    return createDefaultCancerDesignState();
  }

  private saveSelection(): void {
    localStorage.setItem(CANCER_DESIGN_STORAGE_KEY_V2, JSON.stringify(this.state));
  }

  private requireElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`找不到 ${id} 元素`);
    return element as T;
  }
}
