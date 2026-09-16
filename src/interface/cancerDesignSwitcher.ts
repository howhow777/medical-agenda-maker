import { CancerDesignState } from '../assets/types.js';
import type { RoofSelectionStateV2 } from '../assets/roofTypes.js';
import {
  CancerDesignPresetId,
  cancerDesignPresetList,
  cancerDesignPresets,
  createDefaultCancerDesignState,
  normalizeCancerDesignState
} from '../logic/cancerDesignPresets.js';
import { CLASSIC_ROOF_LABEL, renderClassicRoofPreview } from '../logic/headerContours.js';
import { roofMaterialLibrary } from '../logic/roofMaterials.js';
import { createFreshRoofSelectionState, isOpticalRoofSelection } from '../logic/roofSelection.js';
import { getRoofPlacement, getRoofStyle } from '../logic/roofStyles.js';

export type CancerDesignAction =
  | { type: 'select-cancer'; presetId: CancerDesignPresetId }
  | { type: 'select-primary'; presetId: CancerDesignPresetId; motifId: string }
  | { type: 'add-copy'; presetId: CancerDesignPresetId; motifId: string };

type ActionHandler = (action: CancerDesignAction) => Promise<void>;

export const CANCER_DESIGN_STORAGE_KEY = 'medical-agenda-maker:cancer-design-selection:v3';
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
  private state: CancerDesignState = createDefaultCancerDesignState();
  private lastFocusedElement: HTMLElement | null = null;
  private roofSelections: RoofSelectionStateV2 = createFreshRoofSelectionState();

  constructor(private onAction: ActionHandler) {
    this.trigger = this.requireElement<HTMLButtonElement>('designSwitcherTrigger');
    this.drawer = this.requireElement<HTMLElement>('designSwitcherDrawer');
    this.backdrop = this.requireElement<HTMLElement>('designSwitcherBackdrop');
    this.closeButton = this.requireElement<HTMLButtonElement>('designSwitcherClose');
    this.cardGrid = this.requireElement<HTMLElement>('designPresetGrid');
    this.motifGrid = this.requireElement<HTMLElement>('designMotifGrid');
    this.motifTitle = this.requireElement<HTMLElement>('designMotifTitle');
  }

  async initialize(): Promise<void> {
    this.state = this.restoreSelection();
    this.render();
    this.bindEvents();
    await this.onAction({ type: 'select-cancer', presetId: this.activePresetId });
  }

  getState(): CancerDesignState {
    return JSON.parse(JSON.stringify(this.state)) as CancerDesignState;
  }

  setRoofSelections(state: RoofSelectionStateV2): void {
    this.roofSelections = JSON.parse(JSON.stringify(state)) as RoofSelectionStateV2;
    this.cardGrid.querySelectorAll<HTMLButtonElement>('[data-preset-id]').forEach(button => {
      this.renderPresetPreview(button, button.dataset.presetId as CancerDesignPresetId);
    });
  }

  private renderPresetPreview(button: HTMLButtonElement, presetId: CancerDesignPresetId): void {
    const canvas = button.querySelector<HTMLCanvasElement>('canvas')!;
    const preset = cancerDesignPresets[presetId];
    const selection = this.roofSelections.byCancer[presetId];
    const motif = preset.motifs.find(item => item.id === this.state.primaryMotifByCancer[presetId]) || preset.motifs[0];
    const label = button.querySelector<HTMLElement>('.design-preset-label span');
    button.querySelectorAll<HTMLElement>('.design-preset-palette i').forEach((swatch, index) => {
      swatch.style.backgroundColor = selection.colors[index];
    });

    if (!isOpticalRoofSelection(selection)) {
      if (label) label.textContent = `${CLASSIC_ROOF_LABEL} · ${motif.name}`;
      renderClassicRoofPreview(canvas, selection.colors);
      return;
    }

    if (label) label.textContent = `${getRoofStyle(selection.styleId)!.label} · ${motif.name}`;
    void roofMaterialLibrary.preload(selection.styleId).then(() => {
      const current = this.roofSelections.byCancer[presetId];
      if (!canvas.isConnected || !isOpticalRoofSelection(current) || JSON.stringify(current) !== JSON.stringify(selection)) return;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const placement = getRoofPlacement(selection.styleId, canvas.width);
      ctx.drawImage(roofMaterialLibrary.getSurface(selection.styleId, selection.colors)!, 0, 0, placement.width, placement.height);
    }).catch(() => renderClassicRoofPreview(canvas, selection.colors));
  }

  restoreState(value: unknown, persist = true): CancerDesignState {
    this.state = normalizeCancerDesignState(value);
    if (persist) this.saveSelection();
    this.render();
    return this.getState();
  }

  private get activePresetId(): CancerDesignPresetId {
    return this.state.activePresetId as CancerDesignPresetId;
  }

  private bindEvents(): void {
    this.trigger.addEventListener('animationend', event => {
      if (event.animationName === 'designSwitcherDiscovery') this.trigger.classList.remove('design-switcher-discovery');
    });
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
      const roof = document.createElement('canvas');
      roof.className = 'design-preset-contour';
      roof.width = 300;
      roof.height = 112;
      const selectedMotifId = this.state.primaryMotifByCancer[preset.id];
      const selectedMotif = preset.motifs.find(item => item.id === selectedMotifId) || preset.motifs[0];
      const image = document.createElement('img');
      image.src = selectedMotif.src;
      image.alt = '';
      image.loading = 'eager';
      preview.append(roof, image, this.createPalette(this.roofSelections.byCancer[preset.id].colors));

      const selection = this.roofSelections.byCancer[preset.id];
      const roofLabel = isOpticalRoofSelection(selection) ? getRoofStyle(selection.styleId)!.label : CLASSIC_ROOF_LABEL;
      const label = document.createElement('span');
      label.className = 'design-preset-label';
      label.innerHTML = `<strong>${preset.label}</strong><span>${roofLabel} · ${selectedMotif.name}</span>`;
      button.append(preview, label);
      button.addEventListener('click', async () => {
        this.state.activePresetId = preset.id;
        this.saveSelection();
        this.render();
        await this.onAction({ type: 'select-cancer', presetId: preset.id });
      });
      window.requestAnimationFrame(() => this.renderPresetPreview(button, preset.id));
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
    window.requestAnimationFrame(() => this.closeButton.focus());
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
    const focusable = Array.from(this.drawer.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(element => !element.hidden && element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFirstAvailable = (candidates: HTMLElement[]): void => {
      for (const candidate of candidates) {
        candidate.focus({ preventScroll: true });
        if (document.activeElement === candidate) return;
      }
    };
    let last: HTMLElement | null = null;
    for (const candidate of [...focusable].reverse()) {
      candidate.focus({ preventScroll: true });
      if (document.activeElement === candidate) { last = candidate; break; }
    }
    active?.focus({ preventScroll: true });
    if (!last) return;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      focusFirstAvailable(focusable);
    }
  }

  private restoreSelection(): CancerDesignState {
    try {
      const current = localStorage.getItem(CANCER_DESIGN_STORAGE_KEY);
      if (current) return normalizeCancerDesignState(JSON.parse(current));
      for (const key of [CANCER_DESIGN_STORAGE_KEY_V2, CANCER_DESIGN_STORAGE_KEY_V1]) {
        const legacy = localStorage.getItem(key);
        if (!legacy) continue;
        const migrated = normalizeCancerDesignState(JSON.parse(legacy));
        localStorage.setItem(CANCER_DESIGN_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      // Preserve unreadable bytes; continue with an in-memory safe default.
    }
    return createDefaultCancerDesignState();
  }

  private saveSelection(): void {
    localStorage.setItem(CANCER_DESIGN_STORAGE_KEY, JSON.stringify(this.state));
  }

  private requireElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`找不到 ${id} 元素`);
    return element as T;
  }
}
