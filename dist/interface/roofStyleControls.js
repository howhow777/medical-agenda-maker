import { cancerDesignPresets } from '../logic/cancerDesignPresets.js';
import { colorSchemes } from '../logic/colorSchemes.js';
import { CLASSIC_ROOF_LABEL, renderClassicRoofPreview } from '../logic/headerContours.js';
import { getRoofStylesForCancer, getRoofPlacement, getRecommendedRoofScheme, getRoofStyle } from '../logic/roofStyles.js';
import { isOpticalRoofSelection, recommendedClassicRoofSelection, recommendedRoofSelection } from '../logic/roofSelection.js';
import { roofMaterialLibrary, RoofLoadCoordinator } from '../logic/roofMaterials.js';
/** Two synchronized views, one explicit per-cancer state and the existing color inputs. */
export class RoofStyleControls {
    constructor(store, form, onChange) {
        this.store = store;
        this.form = form;
        this.onChange = onChange;
        this.cancerId = 'lung';
        this.coordinator = new RoofLoadCoordinator(roofMaterialLibrary);
        this.status = '';
        this.retryable = false;
        this.hosts = Array.from(document.querySelectorAll('[data-roof-style-host]'));
        ['headerC1', 'headerC2', 'headerC3', 'agendaBg', 'agendaBorder', 'agendaAccent', 'bgC1', 'bgC2'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                if (this.isRestoring())
                    return;
                const values = { ...this.form.getCustomColors() };
                for (const key of ['headerC1', 'headerC2', 'headerC3', 'agendaBg', 'agendaBorder', 'agendaAccent', 'bgC1', 'bgC2']) {
                    const input = document.getElementById(key);
                    if (input)
                        values[key] = input.value;
                }
                this.form.setCustomColors(values);
                this.form.setCurrentColorScheme('custom');
                this.syncCustomColors();
                this.onChange(this.cancerId, this.store.get(this.cancerId));
            });
        });
    }
    async setCancer(cancerId) {
        this.cancerId = cancerId;
        const selection = this.store.get(cancerId);
        this.applySelectionColors(selection);
        this.render();
        await this.loadSelection(selection);
    }
    async select(styleId) {
        const selection = recommendedRoofSelection(this.cancerId, styleId);
        this.store.select(this.cancerId, selection);
        this.applySelectionColors(selection);
        this.render();
        await this.loadSelection(selection);
    }
    async selectClassic() {
        const selection = recommendedClassicRoofSelection(this.cancerId);
        this.store.select(this.cancerId, selection);
        this.applySelectionColors(selection);
        this.render();
        await this.loadSelection(selection);
    }
    /** Called after ordinary form changes; keeps the selected geometry and updates its palette. */
    syncCustomColors() {
        if (this.isRestoring())
            return;
        const current = this.store.get(this.cancerId);
        const schemeId = this.form.getCurrentColorScheme();
        let selection;
        if (current.kind === 'optical' && schemeId === 'optical_recommended') {
            selection = recommendedRoofSelection(this.cancerId, current.styleId);
        }
        else if (current.kind === 'classic' && schemeId === cancerDesignPresets[this.cancerId].colorScheme) {
            selection = recommendedClassicRoofSelection(this.cancerId);
        }
        else {
            if (schemeId !== 'custom') {
                const scheme = colorSchemes[schemeId];
                if (!scheme)
                    return;
                this.form.setCustomColors({
                    ...this.form.getCustomColors(),
                    headerC1: scheme.header.colors[0],
                    headerC2: scheme.header.colors[1],
                    headerC3: scheme.header.colors[2],
                    agendaBg: scheme.agenda.background,
                    agendaBorder: scheme.agenda.border,
                    agendaAccent: scheme.agenda.accent
                });
                this.form.setCurrentColorScheme('custom');
            }
            const colors = this.form.getCustomColors();
            selection = current.kind === 'optical'
                ? { kind: 'optical', styleId: current.styleId, mode: 'custom', colors: [colors.headerC1, colors.headerC2, colors.headerC3] }
                : { kind: 'classic', mode: 'custom', colors: [colors.headerC1, colors.headerC2, colors.headerC3] };
        }
        if (JSON.stringify(current) === JSON.stringify(selection))
            return;
        this.store.select(this.cancerId, selection);
        if (selection.mode === 'recommended')
            this.applySelectionColors(selection);
        this.updateControls();
        void this.loadSelection(selection);
    }
    async readyForExport() {
        await this.coordinator.readyForExport();
    }
    isRestoring() {
        return document.documentElement.dataset.restoringAgenda === 'true';
    }
    applySelectionColors(selection) {
        const scheme = isOpticalRoofSelection(selection)
            ? getRecommendedRoofScheme(this.cancerId, selection.styleId)
            : colorSchemes[cancerDesignPresets[this.cancerId].colorScheme];
        const colors = this.form.getCustomColors();
        this.form.setCustomColors({
            ...colors,
            headerC1: selection.colors[0],
            headerC2: selection.colors[1],
            headerC3: selection.colors[2],
            ...(selection.mode === 'recommended' ? {
                agendaBg: scheme.agenda.background,
                agendaBorder: scheme.agenda.border,
                agendaAccent: scheme.agenda.accent
            } : {})
        });
        this.form.setCurrentColorScheme(selection.mode === 'recommended'
            ? (isOpticalRoofSelection(selection) ? 'optical_recommended' : cancerDesignPresets[this.cancerId].colorScheme)
            : 'custom');
    }
    /** Loading preserves the last complete frame. Classic appears only by choice or on a real failure. */
    async loadSelection(selection) {
        this.retryable = false;
        if (!isOpticalRoofSelection(selection)) {
            this.status = '';
            await this.coordinator.select(selection);
            this.onChange(this.cancerId, selection);
            this.updateStatus();
            return;
        }
        this.status = roofMaterialLibrary.isReady(selection.styleId)
            ? ''
            : '頂部主視覺載入中；完成前保留上一個畫面。';
        this.updateStatus();
        const result = await this.coordinator.select(selection);
        if (!result.current)
            return;
        this.retryable = Boolean(result.error);
        if (result.error) {
            this.status = `${result.error.message}。目前顯示最初版波浪主視覺作為暫時 fallback；選擇未被改寫，請重試後再下載。`;
            this.onChange(this.cancerId, recommendedClassicRoofSelection(this.cancerId));
        }
        else {
            this.status = '';
            this.onChange(this.cancerId, selection);
        }
        this.updateStatus();
    }
    render() {
        const focused = document.activeElement;
        const focusHost = focused?.closest('[data-roof-style-host]');
        const focusKey = focused?.dataset.roofStyleId ? `[data-roof-style-id="${focused.dataset.roofStyleId}"]`
            : focused?.dataset.roofChoiceId ? `[data-roof-choice-id="${focused.dataset.roofChoiceId}"]`
                : focused?.dataset.roofAction ? `[data-roof-action="${focused.dataset.roofAction}"]` : null;
        const preset = cancerDesignPresets[this.cancerId];
        this.hosts.forEach((host, index) => {
            const heading = document.createElement('h3');
            heading.textContent = `${preset.label}｜主視覺設計`;
            const grid = document.createElement('div');
            grid.className = 'roof-style-grid';
            grid.setAttribute('role', 'group');
            grid.setAttribute('aria-label', `${preset.label}主視覺款式`);
            getRoofStylesForCancer(this.cancerId).forEach(style => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'roof-style-card';
                button.dataset.roofStyleId = style.id;
                button.setAttribute('aria-label', `套用${style.label}`);
                const preview = document.createElement('canvas');
                preview.width = 240;
                preview.height = Math.ceil(getRoofPlacement(style.id, 240).height);
                preview.setAttribute('aria-hidden', 'true');
                const label = document.createElement('span');
                label.textContent = style.label;
                button.append(preview, label);
                button.addEventListener('click', () => { void this.select(style.id); });
                grid.append(button);
            });
            const classicButton = document.createElement('button');
            classicButton.type = 'button';
            classicButton.className = 'roof-style-card roof-style-card-classic';
            classicButton.dataset.roofChoiceId = 'classic';
            classicButton.setAttribute('aria-label', `套用${CLASSIC_ROOF_LABEL}`);
            const classicPreview = document.createElement('canvas');
            classicPreview.width = 240;
            classicPreview.height = 80;
            classicPreview.setAttribute('aria-hidden', 'true');
            const classicLabel = document.createElement('span');
            classicLabel.textContent = CLASSIC_ROOF_LABEL;
            classicButton.append(classicPreview, classicLabel);
            classicButton.addEventListener('click', () => { void this.selectClassic(); });
            grid.append(classicButton);
            const modes = document.createElement('div');
            modes.className = 'roof-color-modes';
            for (const [action, label] of [['recommended', '恢復建議配色'], ['custom', '自訂三色']]) {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.roofAction = action;
                button.textContent = label;
                button.addEventListener('click', () => {
                    const selection = this.store.get(this.cancerId);
                    if (action === 'recommended') {
                        if (isOpticalRoofSelection(selection))
                            void this.select(selection.styleId);
                        else
                            void this.selectClassic();
                        return;
                    }
                    this.form.setCurrentColorScheme('custom');
                    this.syncCustomColors();
                });
                modes.append(button);
            }
            const colors = document.createElement('div');
            colors.className = 'roof-custom-colors';
            ['深層', '膜面', '透光'].forEach((label, channel) => {
                const wrap = document.createElement('label');
                wrap.textContent = label;
                const input = document.createElement('input');
                input.type = 'color';
                input.dataset.roofChannel = String(channel);
                input.setAttribute('aria-label', `${label}色彩`);
                input.addEventListener('change', () => {
                    const current = this.form.getCustomColors();
                    const key = ['headerC1', 'headerC2', 'headerC3'][channel];
                    this.form.setCustomColors({ ...current, [key]: input.value });
                    this.form.setCurrentColorScheme('custom');
                    this.syncCustomColors();
                });
                wrap.append(input);
                colors.append(wrap);
            });
            const notice = document.createElement('p');
            notice.className = 'roof-color-notice';
            notice.dataset.roofNotice = '';
            const status = document.createElement('p');
            status.dataset.roofStatus = '';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.textContent = '重試載入主視覺';
            retry.dataset.roofRetry = '';
            retry.addEventListener('click', () => {
                void this.loadSelection(this.store.get(this.cancerId));
                this.updateControls();
            });
            host.replaceChildren(heading, grid, modes, colors, notice, status, retry);
            host.dataset.roofControlIndex = String(index);
        });
        this.updateControls();
        if (focusHost && focusKey)
            focusHost.querySelector(focusKey)?.focus();
    }
    updateControls() {
        const selection = this.store.get(this.cancerId);
        const optical = isOpticalRoofSelection(selection);
        const recommendedOption = document.querySelector('#colorScheme option[value="optical_recommended"]');
        if (recommendedOption)
            recommendedOption.disabled = !optical;
        this.hosts.forEach(host => {
            host.querySelectorAll('[data-roof-style-id]').forEach(button => {
                const styleId = button.dataset.roofStyleId;
                button.setAttribute('aria-pressed', String(optical && selection.styleId === styleId));
                const canvas = button.querySelector('canvas');
                const colors = optical && selection.styleId === styleId
                    ? selection.colors
                    : getRecommendedRoofScheme(this.cancerId, styleId).header.colors;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                void roofMaterialLibrary.preload(styleId).then(() => {
                    if (!canvas.isConnected)
                        return;
                    const current = this.store.get(this.cancerId);
                    const currentColors = isOpticalRoofSelection(current) && current.styleId === styleId ? current.colors : colors;
                    const surface = roofMaterialLibrary.getSurface(styleId, currentColors);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    const placement = getRoofPlacement(styleId, canvas.width);
                    ctx.drawImage(surface, 0, 0, placement.width, placement.height);
                }).catch(() => {
                    if (canvas.isConnected) {
                        ctx.fillStyle = '#475569';
                        ctx.font = '14px sans-serif';
                        ctx.fillText('素材未載入', 12, 38);
                    }
                });
            });
            const classicButton = host.querySelector('[data-roof-choice-id="classic"]');
            if (classicButton) {
                classicButton.setAttribute('aria-pressed', String(!optical));
                renderClassicRoofPreview(classicButton.querySelector('canvas'), !optical ? selection.colors : cancerDesignPresets[this.cancerId].palette);
            }
            host.querySelectorAll('[data-roof-action]').forEach(button => {
                button.setAttribute('aria-pressed', String(selection.mode === button.dataset.roofAction));
            });
            host.querySelectorAll('[data-roof-channel]').forEach(input => {
                input.value = selection.colors[Number(input.dataset.roofChannel)];
            });
            const note = host.querySelector('[data-roof-notice]');
            note.textContent = selection.mode === 'custom'
                ? '自訂三色尚未經藝術／對比審核。光膜或經典波浪會保留各自幾何；過亮、過暗或跨冷暖可能降低辨識度，可恢復建議配色。'
                : optical
                    ? `建議配色 · ${getRoofStyle(selection.styleId).label}。頂部主視覺與議程標題列同步。`
                    : '最初版波浪主視覺 · 配色仍會跟隨目前癌別；新款光影主視覺可由上方卡片主動切回。';
        });
        this.updateStatus();
    }
    updateStatus() {
        this.hosts.forEach(host => {
            const status = host.querySelector('[data-roof-status]');
            if (status)
                status.textContent = [this.status, ...this.store.issues].filter(Boolean).join(' ');
            const retry = host.querySelector('[data-roof-retry]');
            if (retry)
                retry.hidden = !this.retryable;
        });
    }
}
//# sourceMappingURL=roofStyleControls.js.map