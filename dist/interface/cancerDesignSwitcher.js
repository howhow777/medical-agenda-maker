import { cancerDesignPresetList, cancerDesignPresets, createDefaultCancerDesignState, normalizeCancerDesignState } from '../logic/cancerDesignPresets.js';
import { headerContourIds, headerContourLabels, renderContourPreview } from '../logic/headerContours.js';
import { roofMaterialLibrary } from '../logic/roofMaterials.js';
import { getRoofPlacement, getRoofStyle } from '../logic/roofStyles.js';
export const CANCER_DESIGN_STORAGE_KEY_V2 = 'medical-agenda-maker:cancer-design-selection:v2';
export const CANCER_DESIGN_STORAGE_KEY_V1 = 'medical-agenda-maker:cancer-design-selection:v1';
export class CancerDesignSwitcher {
    constructor(onAction) {
        this.onAction = onAction;
        this.state = createDefaultCancerDesignState();
        this.lastFocusedElement = null;
        this.roofSelections = { version: 1, byCancer: {} };
        this.trigger = this.requireElement('designSwitcherTrigger');
        this.drawer = this.requireElement('designSwitcherDrawer');
        this.backdrop = this.requireElement('designSwitcherBackdrop');
        this.closeButton = this.requireElement('designSwitcherClose');
        this.cardGrid = this.requireElement('designPresetGrid');
        this.motifGrid = this.requireElement('designMotifGrid');
        this.motifTitle = this.requireElement('designMotifTitle');
        this.contourGrid = this.requireElement('designContourGrid');
    }
    async initialize() {
        this.state = this.restoreSelection();
        this.render();
        this.bindEvents();
        await this.onAction({ type: 'select-cancer', presetId: this.activePresetId });
    }
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    setRoofSelections(state) {
        this.roofSelections = state;
        this.cardGrid.querySelectorAll('[data-preset-id]').forEach(button => {
            this.renderPresetPreview(button, button.dataset.presetId);
        });
        this.contourGrid.querySelectorAll('[data-contour-id]').forEach(button => {
            button.setAttribute('aria-pressed', String(!state.byCancer[this.activePresetId] &&
                button.dataset.contourId === this.state.contourByCancer[this.activePresetId]));
        });
    }
    renderPresetPreview(button, presetId) {
        const canvas = button.querySelector('canvas');
        const preset = cancerDesignPresets[presetId];
        const selection = this.roofSelections.byCancer[presetId];
        const motif = preset.motifs.find(item => item.id === this.state.primaryMotifByCancer[presetId]) || preset.motifs[0];
        const label = button.querySelector('.design-preset-label span');
        if (!selection) {
            if (label)
                label.textContent = `${headerContourLabels[this.state.contourByCancer[presetId]]} · ${motif.name}`;
            button.querySelectorAll('.design-preset-palette i').forEach((swatch, index) => {
                swatch.style.backgroundColor = preset.palette[index];
            });
            renderContourPreview(canvas, this.state.contourByCancer[presetId], preset.palette);
            return;
        }
        if (label)
            label.textContent = `${getRoofStyle(selection.styleId).label} · ${motif.name}`;
        button.querySelectorAll('.design-preset-palette i').forEach((swatch, index) => {
            swatch.style.backgroundColor = selection.colors[index];
        });
        void roofMaterialLibrary.preload(selection.styleId).then(() => {
            if (!canvas.isConnected || JSON.stringify(this.roofSelections.byCancer[presetId]) !== JSON.stringify(selection))
                return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const placement = getRoofPlacement(selection.styleId, canvas.width);
            ctx.drawImage(roofMaterialLibrary.getSurface(selection.styleId, selection.colors), 0, 0, placement.width, placement.height);
        }).catch(() => renderContourPreview(canvas, this.state.contourByCancer[presetId], preset.palette));
    }
    restoreState(value, persist = true) {
        this.state = normalizeCancerDesignState(value);
        if (persist)
            this.saveSelection();
        this.render();
        return this.getState();
    }
    get activePresetId() {
        return this.state.activePresetId;
    }
    bindEvents() {
        this.trigger.addEventListener('animationend', event => {
            if (event.animationName === 'designSwitcherDiscovery') {
                this.trigger.classList.remove('design-switcher-discovery');
            }
        });
        this.trigger.addEventListener('click', () => {
            this.trigger.classList.remove('design-switcher-discovery');
            this.open();
        });
        this.closeButton.addEventListener('click', () => this.close());
        this.backdrop.addEventListener('click', () => this.close());
        document.addEventListener('keydown', event => {
            if (!this.isOpen())
                return;
            if (event.key === 'Escape') {
                event.preventDefault();
                this.close();
                return;
            }
            if (event.key === 'Tab')
                this.trapFocus(event);
        });
    }
    render() {
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
        const activeContour = this.state.contourByCancer[this.activePresetId];
        this.contourGrid.replaceChildren(...headerContourIds.map(contourId => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'design-contour-card';
            button.dataset.contourId = contourId;
            button.setAttribute('aria-pressed', String(!this.roofSelections.byCancer[this.activePresetId] && contourId === activeContour));
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
    createPalette(colors) {
        const palette = document.createElement('span');
        palette.className = 'design-preset-palette';
        colors.forEach(color => {
            const swatch = document.createElement('i');
            swatch.style.backgroundColor = color;
            palette.append(swatch);
        });
        return palette;
    }
    open() {
        this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.drawer.classList.add('is-open');
        this.backdrop.classList.add('is-open');
        this.drawer.setAttribute('aria-hidden', 'false');
        this.drawer.removeAttribute('inert');
        this.trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('design-switcher-open');
        window.requestAnimationFrame(() => this.closeButton.focus());
    }
    close() {
        this.drawer.classList.remove('is-open');
        this.backdrop.classList.remove('is-open');
        this.drawer.setAttribute('aria-hidden', 'true');
        this.drawer.setAttribute('inert', '');
        this.trigger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('design-switcher-open');
        (this.lastFocusedElement || this.trigger).focus();
    }
    isOpen() {
        return this.drawer.classList.contains('is-open');
    }
    trapFocus(event) {
        const focusable = Array.from(this.drawer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (focusable.length === 0)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
    restoreSelection() {
        try {
            const v2 = localStorage.getItem(CANCER_DESIGN_STORAGE_KEY_V2);
            if (v2)
                return normalizeCancerDesignState(JSON.parse(v2));
            const v1 = localStorage.getItem(CANCER_DESIGN_STORAGE_KEY_V1);
            if (v1) {
                const migrated = normalizeCancerDesignState(JSON.parse(v1));
                localStorage.setItem(CANCER_DESIGN_STORAGE_KEY_V2, JSON.stringify(migrated));
                return migrated;
            }
        }
        catch {
            localStorage.removeItem(CANCER_DESIGN_STORAGE_KEY_V2);
        }
        return createDefaultCancerDesignState();
    }
    saveSelection() {
        localStorage.setItem(CANCER_DESIGN_STORAGE_KEY_V2, JSON.stringify(this.state));
    }
    requireElement(id) {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`找不到 ${id} 元素`);
        return element;
    }
}
//# sourceMappingURL=cancerDesignSwitcher.js.map