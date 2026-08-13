import { cancerDesignPresetList, cancerDesignPresets, isCancerDesignPresetId } from '../logic/cancerDesignPresets.js';
const STORAGE_KEY = 'medical-agenda-maker:cancer-design-selection:v1';
export class CancerDesignSwitcher {
    constructor(onSelection) {
        this.onSelection = onSelection;
        this.selectedPresetId = 'lung';
        this.selectedMotifs = new Map();
        this.lastFocusedElement = null;
        this.trigger = this.requireElement('designSwitcherTrigger');
        this.drawer = this.requireElement('designSwitcherDrawer');
        this.backdrop = this.requireElement('designSwitcherBackdrop');
        this.closeButton = this.requireElement('designSwitcherClose');
        this.cardGrid = this.requireElement('designPresetGrid');
        this.motifGrid = this.requireElement('designMotifGrid');
        this.motifTitle = this.requireElement('designMotifTitle');
        cancerDesignPresetList.forEach(preset => {
            this.selectedMotifs.set(preset.id, preset.motifs[0].id);
        });
    }
    async initialize() {
        this.restoreSelection();
        this.render();
        this.bindEvents();
        await this.applySelection();
    }
    bindEvents() {
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
            button.setAttribute('aria-checked', String(preset.id === this.selectedPresetId));
            button.setAttribute('aria-label', `${preset.label}，${preset.designName}`);
            const preview = document.createElement('span');
            preview.className = 'design-preset-preview';
            preview.style.background = `linear-gradient(145deg, ${preset.palette[0]}, ${preset.palette[1]} 56%, ${preset.palette[2]})`;
            const image = document.createElement('img');
            image.src = preset.motifs[0].src;
            image.alt = '';
            image.loading = 'eager';
            preview.append(image, this.createPalette(preset.palette));
            const label = document.createElement('span');
            label.className = 'design-preset-label';
            label.innerHTML = `<strong>${preset.label}</strong><span>${preset.designName}</span>`;
            button.append(preview, label);
            button.addEventListener('click', async () => {
                this.selectedPresetId = preset.id;
                this.render();
                await this.applySelection();
            });
            return button;
        }));
        const selectedPreset = cancerDesignPresets[this.selectedPresetId];
        this.motifTitle.textContent = `${selectedPreset.label}搭配圖案`;
        const selectedMotifId = this.selectedMotifs.get(this.selectedPresetId) || selectedPreset.motifs[0].id;
        this.motifGrid.replaceChildren(...selectedPreset.motifs.map(motif => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'design-motif-card';
            button.dataset.motifId = motif.id;
            button.setAttribute('role', 'radio');
            button.setAttribute('aria-checked', String(motif.id === selectedMotifId));
            button.setAttribute('aria-label', motif.name);
            const image = document.createElement('img');
            image.src = motif.src;
            image.alt = '';
            const name = document.createElement('span');
            name.textContent = motif.name;
            button.append(image, name);
            button.addEventListener('click', async () => {
                this.selectedMotifs.set(this.selectedPresetId, motif.id);
                this.render();
                await this.applySelection();
            });
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
    async applySelection() {
        const preset = cancerDesignPresets[this.selectedPresetId];
        const motifId = this.selectedMotifs.get(this.selectedPresetId) || preset.motifs[0].id;
        this.saveSelection();
        await this.onSelection(this.selectedPresetId, motifId);
    }
    open() {
        this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.drawer.classList.add('is-open');
        this.backdrop.classList.add('is-open');
        this.drawer.setAttribute('aria-hidden', 'false');
        this.drawer.removeAttribute('inert');
        this.trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('design-switcher-open');
        window.setTimeout(() => this.closeButton.focus(), 0);
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
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const presetId = saved.presetId || null;
            if (!isCancerDesignPresetId(presetId))
                return;
            this.selectedPresetId = presetId;
            const preset = cancerDesignPresets[this.selectedPresetId];
            if (saved.motifId && preset.motifs.some(motif => motif.id === saved.motifId)) {
                this.selectedMotifs.set(this.selectedPresetId, saved.motifId);
            }
        }
        catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    saveSelection() {
        const motifId = this.selectedMotifs.get(this.selectedPresetId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId: this.selectedPresetId, motifId }));
    }
    requireElement(id) {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`找不到 ${id} 元素`);
        return element;
    }
}
//# sourceMappingURL=cancerDesignSwitcher.js.map