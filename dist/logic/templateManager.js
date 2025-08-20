import { DataManager } from './dataManager.js';
export class TemplateManager {
    constructor() {
        this.dataManager = new DataManager();
    }
    // 儲存範本
    saveTemplate(name, customState) {
        try {
            const templateData = this.collectCurrentState(customState);
            const template = {
                name: name.trim() || '未命名範本',
                createdAt: new Date().toISOString(),
                data: templateData
            };
            // 生成檔案名稱
            const timestamp = new Date().toISOString().split('T')[0];
            const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
            const filename = `${safeName}_${timestamp}.json`;
            // 下載檔案
            this.downloadFile(JSON.stringify(template, null, 2), filename, 'application/json');
            this.showToast(`範本已下載: ${filename}`);
        }
        catch (e) {
            console.error('儲存範本失敗:', e);
            throw e;
        }
    }
    // 載入範本
    loadTemplateFromFile(file, customStateCallback) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const template = JSON.parse(e.target?.result);
                    if (!this.validateTemplate(template)) {
                        reject(new Error('無效的範本檔案格式'));
                        return;
                    }
                    // 還原表單狀態（包含完整圖層）
                    this.dataManager.applyState({
                        version: 'template-v1',
                        savedAt: template.createdAt,
                        title: template.name,
                        form: template.data.form,
                        customState: {
                            agendaItems: template.data.agendaItems,
                            overlays: template.data.overlays, // 恢復完整圖層，包含PNG資料
                            customColors: template.data.customColors
                        }
                    }, customStateCallback);
                    this.showToast(`範本已載入: ${template.name}`);
                    resolve();
                }
                catch (e) {
                    reject(new Error('解析範本檔案失敗'));
                }
            };
            reader.readAsText(file);
        });
    }
    // 下載檔案
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    // 收集當前狀態
    collectCurrentState(customState) {
        const formState = this.dataManager.collectFormState();
        return {
            form: formState,
            agendaItems: customState?.agendaItems || [],
            overlays: customState?.overlays || [], // 恢復完整儲存，包含PNG圖片資料
            customColors: customState?.customColors || {}
        };
    }
    // 驗證範本格式
    validateTemplate(template) {
        try {
            return template &&
                typeof template.name === 'string' &&
                template.data &&
                typeof template.data === 'object';
        }
        catch (e) {
            return false;
        }
    }
    // 顯示提示訊息
    showToast(msg, duration = 2000) {
        try {
            let bar = document.getElementById('toaster');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'toaster';
                bar.style.cssText =
                    'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
                        'background:rgba(0,0,0,.75);color:#fff;padding:8px 12px;border-radius:10px;z-index:9999;pointer-events:none';
                document.body.appendChild(bar);
            }
            bar.textContent = msg;
            bar.style.opacity = '1';
            setTimeout(() => (bar.style.opacity = '0'), duration);
        }
        catch (e) {
            // 忽略錯誤
        }
    }
}
//# sourceMappingURL=templateManager.js.map