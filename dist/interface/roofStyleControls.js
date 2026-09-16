import { cancerDesignPresets } from '../logic/cancerDesignPresets.js';
import { colorSchemes } from '../logic/colorSchemes.js';
import { getRoofStylesForCancer, getRoofPlacement, getRecommendedRoofScheme, getRoofStyle } from '../logic/roofStyles.js';
import { recommendedRoofSelection } from '../logic/roofSelection.js';
import { roofMaterialLibrary, RoofLoadCoordinator } from '../logic/roofMaterials.js';
/** Two synchronized views, one state and the existing custom-color inputs. */
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
                if (!this.store.get(this.cancerId) || this.isRestoring())
                    return;
                // Commit against the cancer that owns this input event. Delaying the
                // read until after setCancer() could overwrite another cancer's colors.
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
        if (selection)
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
    async useLegacy() {
        this.store.select(this.cancerId, undefined);
        this.form.setCurrentColorScheme(cancerDesignPresets[this.cancerId].colorScheme);
        this.render();
        await this.loadSelection(undefined);
    }
    /** Called after ordinary form changes; no mutation if no optical style is active. */
    syncCustomColors() {
        if (this.isRestoring())
            return;
        const current = this.store.get(this.cancerId);
        if (!current)
            return;
        const schemeId = this.form.getCurrentColorScheme();
        let selection;
        if (schemeId === 'optical_recommended') {
            selection = recommendedRoofSelection(this.cancerId, current.styleId);
        }
        else {
            if (schemeId !== 'custom') {
                const scheme = colorSchemes[schemeId];
                if (!scheme)
                    return;
                this.form.setCustomColors({ ...this.form.getCustomColors(),
                    headerC1: scheme.header.colors[0], headerC2: scheme.header.colors[1], headerC3: scheme.header.colors[2],
                    agendaBg: scheme.agenda.background, agendaBorder: scheme.agenda.border, agendaAccent: scheme.agenda.accent });
                this.form.setCurrentColorScheme('custom');
            }
            const colors = this.form.getCustomColors();
            selection = { styleId: current.styleId, mode: 'custom', colors: [colors.headerC1, colors.headerC2, colors.headerC3] };
        }
        if (JSON.stringify(current) === JSON.stringify(selection))
            return;
        this.store.select(this.cancerId, selection);
        if (selection.mode === 'recommended')
            this.applySelectionColors(selection);
        this.updateControls();
        void this.loadSelection(selection);
    }
    async readyForExport() { await this.coordinator.readyForExport(); }
    isRestoring() { return document.documentElement.dataset.restoringAgenda === 'true'; }
    applySelectionColors(selection) {
        const scheme = getRecommendedRoofScheme(this.cancerId, selection.styleId);
        const colors = this.form.getCustomColors();
        this.form.setCustomColors({ ...colors, headerC1: selection.colors[0], headerC2: selection.colors[1], headerC3: selection.colors[2],
            ...(selection.mode === 'recommended' ? {
                agendaBg: scheme.agenda.background, agendaBorder: scheme.agenda.border, agendaAccent: scheme.agenda.accent
            } : {}) });
        this.form.setCurrentColorScheme(selection.mode === 'recommended' ? 'optical_recommended' : 'custom');
    }
    async loadSelection(selection) {
        this.retryable = false;
        this.status = selection && !roofMaterialLibrary.isReady(selection.styleId)
            ? '屋簷載入中，目前暫用原輪廓；下載會等待素材完成。' : '';
        this.updateStatus();
        this.onChange(this.cancerId, selection);
        const result = await this.coordinator.select(selection);
        if (!result.current)
            return;
        this.retryable = Boolean(result.error);
        this.status = result.error ? `${result.error.message}。目前為暫用輪廓，不能作為正式下載。` : '';
        this.updateStatus();
        this.onChange(this.cancerId, this.store.get(this.cancerId));
    }
    render() {
        const focused = document.activeElement;
        const focusHost = focused?.closest('[data-roof-style-host]');
        const focusKey = focused?.dataset.roofStyleId ? `[data-roof-style-id="${focused.dataset.roofStyleId}"]`
            : focused?.dataset.roofAction ? `[data-roof-action="${focused.dataset.roofAction}"]` : null;
        const preset = cancerDesignPresets[this.cancerId];
        this.hosts.forEach((host, index) => {
            const heading = document.createElement('h3');
            heading.textContent = `${preset.label}｜核准屋簷`;
            const grid = document.createElement('div');
            grid.className = 'roof-style-grid';
            grid.setAttribute('role', 'group');
            grid.setAttribute('aria-label', `${preset.label}屋簷款式`);
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
            const modes = document.createElement('div');
            modes.className = 'roof-color-modes';
            for (const [action, label] of [['recommended', '恢復建議配色'], ['custom', '自訂三色'], ['legacy', '使用原輪廓']]) {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.roofAction = action;
                button.textContent = label;
                button.addEventListener('click', () => {
                    const selection = this.store.get(this.cancerId);
                    if (action === 'legacy') {
                        void this.useLegacy();
                        return;
                    }
                    if (!selection)
                        return;
                    if (action === 'recommended') {
                        void this.select(selection.styleId);
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
            retry.textContent = '重試載入屋簷';
            retry.dataset.roofRetry = '';
            retry.addEventListener('click', () => { void this.loadSelection(this.store.get(this.cancerId)); this.updateControls(); });
            host.replaceChildren(heading, grid, modes, colors, notice, status, retry);
            host.dataset.roofControlIndex = String(index);
        });
        this.updateControls();
        if (focusHost && focusKey)
            focusHost.querySelector(focusKey)?.focus();
    }
    updateControls() {
        const selection = this.store.get(this.cancerId);
        const recommendedOption = document.querySelector('#colorScheme option[value="optical_recommended"]');
        if (recommendedOption)
            recommendedOption.disabled = !selection;
        this.hosts.forEach(host => {
            host.querySelectorAll('[data-roof-style-id]').forEach(button => {
                const styleId = button.dataset.roofStyleId;
                button.setAttribute('aria-pressed', String(selection?.styleId === styleId));
                const canvas = button.querySelector('canvas');
                const colors = selection?.styleId === styleId ? selection.colors : getRecommendedRoofScheme(this.cancerId, styleId).header.colors;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                void roofMaterialLibrary.preload(styleId).then(() => {
                    if (!canvas.isConnected)
                        return;
                    const current = this.store.get(this.cancerId);
                    const currentColors = current?.styleId === styleId ? current.colors : colors;
                    const surface = roofMaterialLibrary.getSurface(styleId, currentColors);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    const placement = getRoofPlacement(styleId, canvas.width);
                    ctx.drawImage(surface, 0, 0, placement.width, placement.height);
                }).catch(() => { if (canvas.isConnected) {
                    ctx.fillStyle = '#475569';
                    ctx.font = '14px sans-serif';
                    ctx.fillText('素材未載入', 12, 38);
                } });
            });
            host.querySelectorAll('[data-roof-action]').forEach(button => {
                const action = button.dataset.roofAction;
                button.disabled = action !== 'legacy' && !selection;
                button.setAttribute('aria-pressed', String(action === 'legacy' ? !selection : selection?.mode === action));
            });
            host.querySelectorAll('[data-roof-channel]').forEach(input => {
                input.disabled = !selection;
                input.value = selection?.colors[Number(input.dataset.roofChannel)] || '#FFFFFF';
            });
            const note = host.querySelector('[data-roof-notice]');
            note.textContent = selection?.mode === 'custom'
                ? '自訂三色尚未經藝術／對比審核。光膜保留高光與陰影，不會等比例鋪滿三色；過亮、過暗或跨冷暖可能降低辨識度，可恢復建議配色。'
                : selection ? `建議配色 · ${getRoofStyle(selection.styleId).label}。屋簷與議程標題列同步。` : '保留原輪廓。明確選取新款後才會更換屋簷，不會修改會議內容或器官設定。';
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