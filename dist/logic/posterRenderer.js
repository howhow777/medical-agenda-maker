import { colorSchemes, gradientDirections } from './colorSchemes.js';
import { templates } from './templates.js';
import { OverlayProcessor } from './overlay-processor.js';
import { CanvasUtils } from './canvas-utils.js';
import { drawHeaderContour, traceHeaderContourPath } from './headerContours.js';
import { getOverlayFixedRelations } from './overlayManager.js';
import { getRecommendedRoofScheme, isApprovedRoofPair } from './roofStyles.js';
import { roofMaterialLibrary } from './roofMaterials.js';
import { compositeOpticalRoof } from './roofCompositor.js';
import { getRoofTitleInk, getRoofAgendaInk } from './roofTypography.js';
export const AGENDA_START_Y = 350;
export const AGENDA_START_Y_WITH_MEETUP = 380;
export function partitionOverlayLayers(overlays) {
    return {
        belowTable: overlays.filter(overlay => !getOverlayFixedRelations(overlay).aboveTable),
        aboveTable: overlays.filter(overlay => getOverlayFixedRelations(overlay).aboveTable),
        belowHeader: overlays.filter(overlay => !getOverlayFixedRelations(overlay).aboveHeader),
        aboveHeader: overlays.filter(overlay => getOverlayFixedRelations(overlay).aboveHeader)
    };
}
export class PosterRenderer {
    constructor(canvas) {
        this.useHighQualityOverlays = false;
        this.processedOverlayCache = new Map();
        this.headerContourId = 'soft-wave';
        this.roofCancerId = 'lung';
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    }
    setHeaderContour(contourId) {
        this.headerContourId = contourId;
    }
    setRoofSelection(cancerId, selection) {
        if (selection && !isApprovedRoofPair(cancerId, selection.styleId))
            throw new Error('不適用的屋簷款式');
        this.roofCancerId = cancerId;
        this.roofSelection = selection ? { ...selection, colors: [...selection.colors] } : undefined;
    }
    // 創建梯度效果
    createGradient(w, h, colors, direction) {
        if (direction === 'radial') {
            const centerX = w / 2;
            const centerY = h / 2;
            const radius = Math.max(w, h) / 2;
            const g = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
            return g;
        }
        else {
            const d = gradientDirections[direction];
            if (d) {
                const g = this.ctx.createLinearGradient(d.x1 * w, d.y1 * h, d.x2 * w, d.y2 * h);
                colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
                return g;
            }
            else {
                // 預設為水平漸層
                const g = this.ctx.createLinearGradient(0, 0, w, 0);
                colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
                return g;
            }
        }
    }
    // 計算文字行數（支援手動換行）
    calculateTextLinesWithBreaks(text, maxWidth) {
        if (!text)
            return 1;
        const manualLines = text.split('\n');
        let totalLines = 0;
        manualLines.forEach(line => {
            if (!line.trim()) {
                totalLines += 1;
                return;
            }
            // 使用相同的改進邏輯
            const words = [];
            let currentWord = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const isCJK = /[\u4e00-\u9fff]/.test(char);
                if (char === ' ') {
                    if (currentWord) {
                        words.push(currentWord);
                        currentWord = '';
                    }
                    words.push(' ');
                }
                else if (isCJK) {
                    if (currentWord) {
                        words.push(currentWord);
                        currentWord = '';
                    }
                    words.push(char);
                }
                else {
                    currentWord += char;
                }
            }
            if (currentWord) {
                words.push(currentWord);
            }
            let currentLine = '';
            let lineCount = 0;
            for (let i = 0; i < words.length; i++) {
                const test = currentLine + words[i];
                if (this.ctx.measureText(test).width > maxWidth && currentLine !== '') {
                    lineCount++;
                    currentLine = words[i];
                }
                else {
                    currentLine = test;
                }
            }
            if (currentLine.trim() !== '')
                lineCount++;
            totalLines += Math.max(1, lineCount);
        });
        return totalLines;
    }
    // 文字自動換行並繪製（支援對齊）
    wrapTextWithBreaks(text, x, y, maxWidth, lineHeight, align = 'left') {
        if (!text)
            return 0;
        const manualLines = text.split('\n');
        let currentY = y;
        manualLines.forEach(line => {
            if (!line.trim()) {
                currentY += lineHeight;
                return;
            }
            // 改進的中英文混合處理：保留空格，智能分割
            const words = [];
            let currentWord = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const isCJK = /[\u4e00-\u9fff]/.test(char);
                if (char === ' ') {
                    // 遇到空格，結束當前單詞
                    if (currentWord) {
                        words.push(currentWord);
                        currentWord = '';
                    }
                    words.push(' '); // 保留空格作為獨立元素
                }
                else if (isCJK) {
                    // 中文字符，結束當前單詞並將中文字符單獨處理
                    if (currentWord) {
                        words.push(currentWord);
                        currentWord = '';
                    }
                    words.push(char);
                }
                else {
                    // 英文字符，累積到當前單詞
                    currentWord += char;
                }
            }
            // 處理最後的單詞
            if (currentWord) {
                words.push(currentWord);
            }
            let currentLine = '';
            let linesToDraw = [];
            for (let i = 0; i < words.length; i++) {
                const test = currentLine + words[i];
                if (this.ctx.measureText(test).width > maxWidth && currentLine !== '') {
                    linesToDraw.push(currentLine.trim());
                    currentLine = words[i];
                }
                else {
                    currentLine = test;
                }
            }
            if (currentLine.trim() !== '')
                linesToDraw.push(currentLine.trim());
            linesToDraw.forEach(lineText => {
                let drawX = x;
                if (align === 'center') {
                    const textWidth = this.ctx.measureText(lineText).width;
                    drawX = x + (maxWidth / 2) - (textWidth / 2);
                }
                else if (align === 'right') {
                    const textWidth = this.ctx.measureText(lineText).width;
                    drawX = x + maxWidth - textWidth;
                }
                this.ctx.fillText(lineText, drawX, currentY);
                currentY += lineHeight;
            });
        });
        return currentY - y;
    }
    // 垂直置中繪製文字
    drawCenteredTextWithBreaks(text, x, y, maxWidth, lineHeight, cellHeight, align = 'center') {
        if (!text)
            return 0;
        const totalLines = this.calculateTextLinesWithBreaks(text, maxWidth);
        const textHeight = totalLines * lineHeight;
        const startY = y + (cellHeight - textHeight) / 2 + lineHeight * 0.8;
        return this.wrapTextWithBreaks(text, x, startY, maxWidth, lineHeight, align);
    }
    // 繪製癌症裝飾圖案
    drawCancerDecorations(template, scheme, W, H) {
        try {
            this.ctx.globalAlpha = 0.15;
            this.ctx.fillStyle = scheme.agenda.accent;
            this.ctx.strokeStyle = scheme.agenda.accent;
            switch (template.title) {
                case '肺癌':
                    this.ctx.beginPath();
                    this.ctx.arc(W - 100, 300, 40, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.arc(W - 60, 300, 35, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
                case '頭頸癌':
                    this.ctx.beginPath();
                    this.ctx.arc(W - 100, 280, 30, 0, Math.PI);
                    this.ctx.stroke();
                    this.ctx.fillRect(W - 110, 310, 20, 40);
                    break;
                case '子宮體癌':
                    for (let i = 0; i < 5; i++) {
                        this.ctx.beginPath();
                        this.ctx.arc(W - 150 + i * 20, 300, 8, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    break;
                case '泌尿道癌':
                    this.ctx.beginPath();
                    this.ctx.ellipse(W - 100, 300, 25, 40, 0, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
                case '大腸直腸癌':
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(W - 150, 250);
                    this.ctx.quadraticCurveTo(W - 100, 300, W - 50, 350);
                    this.ctx.stroke();
                    break;
                case '乳癌':
                    this.ctx.lineWidth = 8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(W - 120, 280);
                    this.ctx.quadraticCurveTo(W - 80, 250, W - 60, 300);
                    this.ctx.quadraticCurveTo(W - 80, 350, W - 120, 320);
                    this.ctx.stroke();
                    break;
            }
            this.ctx.globalAlpha = 1;
        }
        catch (e) {
            this.ctx.globalAlpha = 1;
        }
    }
    // The same native Canvas geometry is used by the drawer previews.
    drawPresetHeader(_templateId, scheme, W, direction) {
        drawHeaderContour(this.ctx, this.headerContourId, W, 150, this.createGradient(W, 150, scheme.header.colors, direction));
    }
    drawHeaderText(text, x, y, font, fill, edge, lineWidth) {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.textAlign = 'center';
        this.ctx.lineJoin = 'round';
        this.ctx.miterLimit = 2;
        this.ctx.strokeStyle = edge;
        this.ctx.lineWidth = lineWidth;
        this.ctx.shadowColor = 'rgba(15, 33, 55, 0.28)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetY = 1;
        this.ctx.strokeText(text, x, y);
        this.ctx.shadowColor = 'transparent';
        this.ctx.fillStyle = fill;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }
    // 計算所需的海報高度
    calculateRequiredHeight(agendaItems, showFooter, footerText, W, renderOptions = {}) {
        let total = AGENDA_START_Y - 25;
        // Canvas 上若顯示集合地點，表格會往下移 30px；下載用高解析重繪也要保留同樣高度。
        if (renderOptions.showMeetupPoint) {
            total += 30;
        }
        if (agendaItems.length > 0) {
            this.ctx.font = '16px Microsoft JhengHei';
            let agendaH = 75 + 35 + 45; // 標題區 + 間隔 + 欄位標題
            // 計算表格幾何
            const tableOuterLeft = 40;
            const tableOuterRight = W - 40;
            const innerPad = 20;
            const innerLeft = tableOuterLeft + innerPad;
            const innerRight = tableOuterRight - innerPad;
            const innerWidth = innerRight - innerLeft;
            const hideModerator = Boolean(renderOptions.hideModerator);
            const wTime = Math.round(innerWidth * 0.1765);
            const wTopic = hideModerator ? Math.round(innerWidth * 0.50) : Math.round(innerWidth * 0.4412);
            const wSpeaker = hideModerator ? innerWidth - wTime - wTopic : Math.round(innerWidth * 0.2059);
            const wModerator = hideModerator ? 0 : innerWidth - wTime - wTopic - wSpeaker;
            const pad = 10;
            agendaItems.forEach(item => {
                const topicLines = this.calculateTextLinesWithBreaks(item.topic, Math.max(10, wTopic - pad));
                const speakerLines = item.speaker ? this.calculateTextLinesWithBreaks(item.speaker, Math.max(10, wSpeaker - pad)) : 1;
                const moderatorLines = !hideModerator && item.moderator ? this.calculateTextLinesWithBreaks(item.moderator, Math.max(10, wModerator - pad)) : 1;
                const timeLines = this.calculateTextLinesWithBreaks(item.time, Math.max(10, wTime - pad));
                const maxLines = Math.max(topicLines, speakerLines, moderatorLines, timeLines);
                const rowH = Math.max(50, maxLines * 22 + 16);
                agendaH += rowH;
            });
            total += agendaH + 40;
        }
        // 頁尾註解高度
        if (showFooter && footerText.trim()) {
            this.ctx.font = '11px Microsoft JhengHei';
            const noteW = W - 80;
            const noteLines = this.calculateTextLinesWithBreaks(footerText, noteW);
            const noteH = 5 + (noteLines * 15);
            total += noteH;
        }
        total += 10; // 底部間距
        return total;
    }
    // 主要海報繪製方法
    drawPoster(agendaItems, currentTemplate, currentColorScheme, currentGradientDirection, customColors, conferenceData, showFooter, footerText, overlays = [], tableOpacity = 1.0) {
        this.lastRenderArgs = [agendaItems.map(item => ({ ...item })), currentTemplate, currentColorScheme,
            currentGradientDirection, { ...customColors }, { ...conferenceData }, showFooter, footerText,
            overlays.map(overlay => ({ ...overlay })), tableOpacity];
        const W = this.canvas.width;
        const H = this.canvas.height;
        const scheme = this.getActiveColorScheme(currentColorScheme, customColors, tableOpacity);
        const template = templates[currentTemplate] || templates.lung;
        // 背景
        if (currentColorScheme === 'custom' && customColors.bgGradientDir !== 'none') {
            this.ctx.fillStyle = this.createGradient(W, H, [customColors.bgC1, customColors.bgC2], customColors.bgGradientDir);
        }
        else {
            this.ctx.fillStyle = currentColorScheme === 'custom' ? customColors.bgC1 : '#fff';
        }
        this.ctx.fillRect(0, 0, W, H);
        const overlayLayers = partitionOverlayLayers(overlays);
        const agendaStartY = conferenceData.showMeetupPoint ? AGENDA_START_Y_WITH_MEETUP : AGENDA_START_Y;
        const agendaEndY = agendaItems.length > 0
            ? this.calculateAgendaTableEndY(agendaItems, W, agendaStartY, Boolean(conferenceData.hideModerator))
            : agendaStartY;
        const tableBounds = agendaItems.length > 0
            ? { x: 40, y: agendaStartY - 8, width: W - 80, height: agendaEndY - agendaStartY + 8 }
            : null;
        const material = this.roofSelection
            ? roofMaterialLibrary.getSurface(this.roofSelection.styleId, this.roofSelection.colors)
            : null;
        // 固定物件以外只繪製一次；屋簷與表格範圍則依各自的獨立關係分開合成。
        this.drawOverlaysOutsideFixedObjects(overlays, W, H, tableBounds, Boolean(material));
        if (tableBounds)
            this.drawOverlaysClippedToRect(overlayLayers.belowTable, tableBounds);
        if (material && this.roofSelection) {
            const originalContext = this.ctx;
            compositeOpticalRoof(this.ctx, material, this.roofSelection.styleId, W, inside => {
                this.ctx = inside;
                try {
                    this.drawPosterTitle(conferenceData, template, scheme, W, material);
                    this.drawOverlays(overlayLayers.aboveHeader);
                }
                finally {
                    this.ctx = originalContext;
                }
            });
        }
        else
            this.drawOverlaysClippedToHeader(overlayLayers.belowHeader, W);
        // 日期地點資訊
        const infoCardY = 140;
        this.ctx.fillStyle = '#333';
        this.ctx.font = '18px Microsoft JhengHei';
        this.ctx.textAlign = 'left';
        if (conferenceData.date)
            this.ctx.fillText('📅 ' + conferenceData.date, 60, infoCardY + 30);
        if (conferenceData.time)
            this.ctx.fillText('🕐 ' + conferenceData.time, 60, infoCardY + 60);
        if (conferenceData.location)
            this.ctx.fillText('🏢 ' + conferenceData.location, 60, infoCardY + 90);
        // 集合地點資訊
        let nextY = infoCardY + 120;
        if (conferenceData.showMeetupPoint) {
            const meetupText = this.generateMeetupText(conferenceData);
            this.ctx.fillText('📍 ' + meetupText, 60, nextY);
            nextY += 30;
        }
        // 議程表
        let afterAgendaY = agendaStartY;
        if (agendaItems.length > 0) {
            afterAgendaY = this.drawAgendaTable(agendaItems, scheme, W, afterAgendaY, {
                hideModerator: conferenceData.hideModerator,
                mergeSameModerator: conferenceData.mergeSameModerator
            });
        }
        // 頁尾註解
        if (showFooter && footerText.trim()) {
            afterAgendaY = this.drawFooterNote(footerText, W, afterAgendaY);
        }
        // 底部裝飾條 (已移除)
        // this.ctx.fillStyle = scheme.agenda.background;
        // this.ctx.fillRect(0, H - 60, W, 60);
        // 屋簷是獨立固定物件。
        if (!material) {
            this.drawPresetHeader(currentTemplate, scheme, W, currentGradientDirection);
            this.drawPosterTitle(conferenceData, template, scheme, W);
        }
        if (tableBounds)
            this.drawOverlaysClippedToRect(overlayLayers.aboveTable, tableBounds);
        if (!material)
            this.drawOverlaysClippedToHeader(overlayLayers.aboveHeader, W);
    }
    drawPosterTitle(conferenceData, template, scheme, W, material) {
        const title = conferenceData.title || `${template.title}醫學會議`;
        const opticalInk = material && this.roofSelection
            ? getRoofTitleInk(this.roofSelection.styleId, this.roofSelection.colors, material) : null;
        this.ctx.fillStyle = scheme.header.text;
        let titleSize = 36;
        while (titleSize > 24) {
            this.ctx.font = `bold ${titleSize}px Microsoft JhengHei`;
            if (this.ctx.measureText(title).width <= W - 80)
                break;
            titleSize -= 1;
        }
        this.drawHeaderText(title, W / 2, 50, `bold ${titleSize}px Microsoft JhengHei`, opticalInk?.fill || scheme.header.text, opticalInk?.edge || scheme.agenda.accent, (opticalInk ? 1.8 : 3) * (W / 800));
        if (conferenceData.subtitle) {
            this.drawHeaderText(conferenceData.subtitle, W / 2, 85, '20px Microsoft JhengHei', opticalInk?.fill || scheme.header.text, opticalInk?.edge || scheme.agenda.accent, (opticalInk ? 1.5 : 2.5) * (W / 800));
        }
    }
    /**
     * 生成集合地點顯示文字
     */
    generateMeetupText(conferenceData) {
        const sameChecked = conferenceData.meetupType === 'same' ? '[■]' : '[  ]';
        const otherChecked = conferenceData.meetupType === 'other' ? '[■]' : '[  ]';
        if (conferenceData.meetupType === 'other' && conferenceData.meetupCustomText) {
            return `Meetup point: ${sameChecked}同會議地點  ${otherChecked}其他：${conferenceData.meetupCustomText}`;
        }
        else {
            return `Meetup point: ${sameChecked}同會議地點  ${otherChecked}其他：`;
        }
    }
    // 繪製議程表
    drawAgendaTable(agendaItems, scheme, W, startY, renderOptions = {}) {
        const agendaStartY = startY;
        const hideModerator = Boolean(renderOptions.hideModerator);
        const mergeSameModerator = Boolean(renderOptions.mergeSameModerator) && !hideModerator;
        // 移除獨立的 Agenda 標題，讓表格自成一體
        // 表格幾何計算
        const tableOuterLeft = 40;
        const tableOuterRight = W - 40;
        const innerPad = 20;
        const innerLeft = tableOuterLeft + innerPad;
        const innerRight = tableOuterRight - innerPad;
        const innerWidth = innerRight - innerLeft;
        const wTime = Math.round(innerWidth * 0.1765);
        const wTopic = hideModerator ? Math.round(innerWidth * 0.50) : Math.round(innerWidth * 0.4412);
        const wSpeaker = hideModerator ? innerWidth - wTime - wTopic : Math.round(innerWidth * 0.2059);
        const wModerator = hideModerator ? 0 : innerWidth - wTime - wTopic - wSpeaker;
        const xTime = innerLeft;
        const xTopic = xTime + wTime;
        const xSpeaker = xTopic + wTopic;
        const xModerator = xSpeaker + wSpeaker;
        const cTime = xTime + wTime / 2;
        const cTopic = xTopic + wTopic / 2;
        const cSpeaker = xSpeaker + wSpeaker / 2;
        const cModerator = xModerator + wModerator / 2;
        const rowHeights = this.calculateAgendaRowHeights(agendaItems, W, hideModerator);
        // 欄位標題行（直接從議程開始位置繪製）
        let yPos = agendaStartY;
        const previousAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = scheme.tableOpacity;
        const agendaHeaderGradient = this.ctx.createLinearGradient(tableOuterLeft, 0, tableOuterRight, 0);
        scheme.header.colors.forEach((color, index) => {
            agendaHeaderGradient.addColorStop(index / Math.max(1, scheme.header.colors.length - 1), color);
        });
        this.ctx.fillStyle = agendaHeaderGradient;
        this.ctx.fillRect(tableOuterLeft, yPos - 8, W - 80, 35);
        this.ctx.globalAlpha = previousAlpha;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Microsoft JhengHei';
        this.ctx.textAlign = 'center';
        const setHeaderInk = (x) => {
            if (this.roofSelection)
                this.ctx.fillStyle = getRoofAgendaInk(scheme.header.colors, (x - tableOuterLeft) / (W - 80), scheme.agenda.accent);
        };
        setHeaderInk(cTime);
        this.ctx.fillText('Time', cTime, yPos + 15);
        setHeaderInk(cTopic);
        this.ctx.fillText('Content', cTopic, yPos + 15);
        setHeaderInk(cSpeaker);
        this.ctx.fillText('Speaker', cSpeaker, yPos + 15);
        if (!hideModerator) {
            setHeaderInk(cModerator);
            this.ctx.fillText('Moderator', cModerator, yPos + 15);
        }
        yPos += 45;
        // 資料行
        const pad = 10;
        const rowLayouts = [];
        const normalizeModerator = (value) => value.trim().replace(/\s+/g, ' ');
        agendaItems.forEach((item, idx) => {
            this.ctx.font = '16px Microsoft JhengHei';
            const itemH = rowHeights[idx];
            const rowTop = yPos - 18;
            // 斑馬紋背景：一般模式畫整列；Moderator 合併模式先只畫左三欄，
            // 右側 Moderator 欄稍後依 merge group 一次畫好，避免像事後拼貼覆蓋。
            const previousAlpha = this.ctx.globalAlpha;
            this.ctx.globalAlpha = scheme.tableOpacity;
            if (idx % 2 === 0) {
                this.ctx.fillStyle = scheme.agenda.background;
            }
            else {
                this.ctx.fillStyle = scheme.agenda.alternateBackground;
            }
            const rowBackgroundRight = mergeSameModerator ? xModerator : tableOuterRight;
            this.ctx.fillRect(tableOuterLeft, rowTop, rowBackgroundRight - tableOuterLeft, itemH);
            this.ctx.globalAlpha = previousAlpha;
            this.ctx.textAlign = 'left';
            // 時間
            this.ctx.fillStyle = scheme.agenda.accent;
            this.ctx.font = 'bold 16px Microsoft JhengHei';
            this.drawCenteredTextWithBreaks(item.time || '', xTime + pad / 2, rowTop, wTime - pad, 22, itemH, 'center');
            // 主題
            this.ctx.fillStyle = scheme.agenda.accent;
            this.ctx.font = '16px Microsoft JhengHei';
            this.drawCenteredTextWithBreaks(item.topic || '', xTopic + pad / 2, rowTop, wTopic - pad, 22, itemH, 'center');
            // 講者 - 如果隱藏 Moderator，Speaker 欄自動吃掉原 Moderator 寬度
            const hasSpeaker = Boolean(item.speaker && item.speaker.trim());
            const hasModerator = Boolean(item.moderator && item.moderator.trim());
            if (hasSpeaker) {
                this.ctx.fillStyle = scheme.agenda.accent;
                this.ctx.font = '14px Microsoft JhengHei';
                const speakerSpanWidth = hideModerator || !hasModerator ? wSpeaker + wModerator : wSpeaker;
                this.drawCenteredTextWithBreaks(item.speaker, xSpeaker + pad / 2, rowTop, speakerSpanWidth - pad, 20, itemH, 'center');
            }
            rowLayouts.push({ item, top: rowTop, height: itemH, index: idx });
            yPos += itemH + 5;
        });
        // Moderator 欄另行繪製，才能支援「相同 Moderator 垂直跨列置中」。
        if (!hideModerator) {
            let i = 0;
            while (i < rowLayouts.length) {
                const current = rowLayouts[i];
                const moderator = current.item.moderator || '';
                const normalized = normalizeModerator(moderator);
                let end = i;
                if (mergeSameModerator && normalized) {
                    while (end + 1 < rowLayouts.length &&
                        normalizeModerator(rowLayouts[end + 1].item.moderator || '') === normalized) {
                        end += 1;
                    }
                }
                const isMergedGroup = mergeSameModerator && normalized && end > i;
                const first = rowLayouts[i];
                const last = rowLayouts[end];
                const groupTop = first.top;
                const groupHeight = (last.top + last.height) - groupTop;
                // 合併模式下，Moderator 欄背景從一開始就按 group 繪製，
                // 而不是蓋在已畫好的整列背景上；視覺上會像真正的 merged cell。
                if (mergeSameModerator) {
                    const previousAlpha = this.ctx.globalAlpha;
                    this.ctx.globalAlpha = scheme.tableOpacity;
                    this.ctx.fillStyle = first.index % 2 === 0 ? scheme.agenda.background : scheme.agenda.alternateBackground;
                    this.ctx.fillRect(xModerator, groupTop, tableOuterRight - xModerator, groupHeight);
                    this.ctx.globalAlpha = previousAlpha;
                }
                if (!normalized) {
                    i = end + 1;
                    continue;
                }
                const hasSpeaker = Boolean(first.item.speaker && first.item.speaker.trim());
                const drawX = isMergedGroup || hasSpeaker ? xModerator + pad / 2 : xSpeaker + pad / 2;
                const drawWidth = isMergedGroup || hasSpeaker ? wModerator - pad : wSpeaker + wModerator - pad;
                this.ctx.fillStyle = scheme.agenda.accent;
                this.ctx.font = '14px Microsoft JhengHei';
                this.drawCenteredTextWithBreaks(moderator, drawX, groupTop, Math.max(10, drawWidth), 20, groupHeight, 'center');
                i = end + 1;
            }
            // 很淡的欄位分隔線，讓右側 merged-cell 區域看起來是表格欄位本身，而不是貼片。
            if (mergeSameModerator && rowLayouts.length > 0) {
                const firstRow = rowLayouts[0];
                const lastRow = rowLayouts[rowLayouts.length - 1];
                const tableBodyTop = firstRow.top;
                const tableBodyHeight = (lastRow.top + lastRow.height) - tableBodyTop;
                const previousAlpha = this.ctx.globalAlpha;
                this.ctx.globalAlpha = Math.min(0.18, scheme.tableOpacity * 0.18);
                this.ctx.fillStyle = scheme.agenda.border;
                this.ctx.fillRect(xModerator, tableBodyTop, 1, tableBodyHeight);
                this.ctx.globalAlpha = previousAlpha;
            }
        }
        return yPos + 10;
    }
    calculateAgendaRowHeights(agendaItems, W, hideModerator) {
        const innerWidth = (W - 80) - 40;
        const wTime = Math.round(innerWidth * 0.1765);
        const wTopic = hideModerator ? Math.round(innerWidth * 0.50) : Math.round(innerWidth * 0.4412);
        const wSpeaker = hideModerator ? innerWidth - wTime - wTopic : Math.round(innerWidth * 0.2059);
        const wModerator = hideModerator ? 0 : innerWidth - wTime - wTopic - wSpeaker;
        const pad = 10;
        this.ctx.font = '16px Microsoft JhengHei';
        return agendaItems.map(item => {
            const timeLines = this.calculateTextLinesWithBreaks(item.time, Math.max(10, wTime - pad));
            const topicLines = this.calculateTextLinesWithBreaks(item.topic, Math.max(10, wTopic - pad));
            const speakerLines = item.speaker ? this.calculateTextLinesWithBreaks(item.speaker, Math.max(10, wSpeaker - pad)) : 1;
            const moderatorLines = !hideModerator && item.moderator
                ? this.calculateTextLinesWithBreaks(item.moderator, Math.max(10, wModerator - pad))
                : 1;
            return Math.max(45, Math.max(timeLines, topicLines, speakerLines, moderatorLines) * 22 + 15);
        });
    }
    calculateAgendaTableEndY(agendaItems, W, startY, hideModerator) {
        const rowHeights = this.calculateAgendaRowHeights(agendaItems, W, hideModerator);
        return startY + 45 + rowHeights.reduce((total, height) => total + height + 5, 0) + 10;
    }
    // 繪製頁尾註解
    drawFooterNote(noteText, W, startY) {
        const noteX = 40;
        const noteW = W - 80;
        const noteY = startY + 20;
        this.ctx.fillStyle = '#333';
        this.ctx.font = '11px Microsoft JhengHei';
        this.ctx.textAlign = 'left';
        const lines = this.calculateTextLinesWithBreaks(noteText, noteW);
        const contentH = lines * 15;
        this.wrapTextWithBreaks(noteText, noteX, noteY, noteW, 15);
        return noteY + contentH;
    }
    // 取得當前配色方案
    getActiveColorScheme(currentColorScheme, customColors, tableOpacity = 1.0) {
        if (this.roofSelection?.mode === 'recommended') {
            return { ...getRecommendedRoofScheme(this.roofCancerId, this.roofSelection.styleId), tableOpacity };
        }
        if (currentColorScheme === 'custom') {
            return {
                name: '自訂配色',
                header: {
                    colors: [customColors.headerC1, customColors.headerC2, customColors.headerC3],
                    text: '#FFFFFF'
                },
                agenda: {
                    background: customColors.agendaBg,
                    alternateBackground: '#FFFFFF', // 自訂配色的透明列使用白色
                    border: customColors.agendaBorder,
                    accent: customColors.agendaAccent
                },
                tableOpacity: tableOpacity
            };
        }
        // 取得預設配色方案，並覆蓋 tableOpacity
        const scheme = colorSchemes[currentColorScheme];
        return {
            ...scheme,
            tableOpacity: tableOpacity
        };
    }
    // 渲染PNG圖層（增強版，支持高品質處理）
    drawOverlays(overlays) {
        overlays.forEach(overlay => {
            if (!overlay.visible || !overlay.img)
                return;
            this.ctx.save();
            // 設定透明度
            this.ctx.globalAlpha = overlay.opacity;
            // 檢查是否有高品質處理的版本
            const processedCanvas = this.processedOverlayCache.get(overlay.id);
            if (this.useHighQualityOverlays && processedCanvas) {
                // 使用高品質預處理版本
                this.ctx.translate(overlay.x, overlay.y);
                this.ctx.drawImage(processedCanvas, -processedCanvas.width / 2, -processedCanvas.height / 2);
            }
            else {
                // 使用原始的標準處理
                // overlay.x, overlay.y 就是中心點
                this.ctx.translate(overlay.x, overlay.y);
                this.ctx.rotate(overlay.rotation);
                // 繪製圖層（相對於中心點）
                const drawX = (-overlay.w / 2) * overlay.scaleX;
                const drawY = (-overlay.h / 2) * overlay.scaleY;
                const drawW = overlay.w * overlay.scaleX;
                const drawH = overlay.h * overlay.scaleY;
                this.ctx.drawImage(overlay.img, drawX, drawY, drawW, drawH);
            }
            this.ctx.restore();
        });
    }
    drawOverlaysOutsideFixedObjects(overlays, W, H, tableBounds, optical = false) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, W, H);
        if (!optical)
            traceHeaderContourPath(this.ctx, this.headerContourId, W, 150);
        if (tableBounds) {
            this.ctx.rect(tableBounds.x, tableBounds.y, tableBounds.width, tableBounds.height);
        }
        this.ctx.clip('evenodd');
        this.drawOverlays(overlays);
        this.ctx.restore();
    }
    drawOverlaysClippedToRect(overlays, bounds) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.ctx.clip();
        this.drawOverlays(overlays);
        this.ctx.restore();
    }
    drawOverlaysClippedToHeader(overlays, W) {
        this.ctx.save();
        this.ctx.beginPath();
        traceHeaderContourPath(this.ctx, this.headerContourId, W, 150);
        this.ctx.clip();
        this.drawOverlays(overlays);
        this.ctx.restore();
    }
    // === 新增：高品質圖片處理支持 ===
    /**
     * 啟用/停用高品質圖層處理
     * @param enabled - 是否啟用高品質模式
     */
    enableHighQualityOverlays(enabled) {
        this.useHighQualityOverlays = enabled;
        if (!enabled) {
            // 停用時清除快取
            this.processedOverlayCache.clear();
        }
    }
    /**
     * 預處理圖層（高品質處理）
     * @param overlays - 要處理的圖層陣列
     * @param onProgress - 進度回調
     */
    async preprocessOverlays(overlays, onProgress) {
        if (!this.useHighQualityOverlays) {
            return;
        }
        // 清除舊的快取
        this.processedOverlayCache.clear();
        // 過濾需要處理的圖層
        const layersToProcess = overlays.filter(overlay => overlay.visible && OverlayProcessor.needsHighQualityProcessing(overlay));
        let processed = 0;
        for (const overlay of layersToProcess) {
            if (onProgress) {
                onProgress(processed, layersToProcess.length, overlay.name);
            }
            try {
                const result = await OverlayProcessor.processOverlay(overlay, {
                    outputFormat: 'png',
                    quality: 0.95,
                    smoothing: true,
                    maxSize: 2048
                });
                // 快取處理結果
                this.processedOverlayCache.set(overlay.id, result.canvas);
            }
            catch (error) {
                console.error(`預處理圖層 ${overlay.name} 失敗:`, error);
            }
            processed++;
        }
        if (onProgress) {
            onProgress(processed, layersToProcess.length, '完成');
        }
    }
    /**
     * 導出高品質海報
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param scaleFactor - 解析度倍數（預設 2 倍）
     */
    async exportHighQuality(format = 'png', quality = 0.95, scaleFactor = 2) {
        const roofAtStart = JSON.stringify(this.roofSelection);
        if (this.roofSelection)
            await roofMaterialLibrary.preload(this.roofSelection.styleId);
        if (typeof document !== 'undefined')
            await document.fonts?.ready;
        if (roofAtStart !== JSON.stringify(this.roofSelection))
            throw new Error('屋簷選擇已改變，請重新下載');
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        const highQualityWidth = originalWidth * scaleFactor;
        const highQualityHeight = originalHeight * scaleFactor;
        // 創建高解析度 Canvas
        const hqCanvas = document.createElement('canvas');
        hqCanvas.width = highQualityWidth;
        hqCanvas.height = highQualityHeight;
        const hqCtx = hqCanvas.getContext('2d');
        // 設定高品質渲染
        hqCtx.imageSmoothingEnabled = true;
        hqCtx.imageSmoothingQuality = 'high';
        // 設定文字渲染品質（如果支援）
        if ('textRenderingOptimization' in hqCtx) {
            hqCtx.textRenderingOptimization = 'optimizeQuality';
        }
        // 縮放座標系到高解析度
        hqCtx.scale(scaleFactor, scaleFactor);
        // 重新渲染整個海報到高解析度 Canvas
        await this.renderHighQualityPoster(hqCtx, originalWidth, originalHeight);
        // 導出高品質版本
        const blob = await CanvasUtils.canvasToBlob(hqCanvas, format, quality);
        const dataURL = CanvasUtils.canvasToDataURL(hqCanvas, format, quality);
        return {
            blob,
            dataURL,
            originalSize: { width: originalWidth, height: originalHeight },
            highQualitySize: { width: highQualityWidth, height: highQualityHeight }
        };
    }
    /**
     * 取得處理統計資訊
     * @param overlays - 圖層陣列
     */
    getProcessingStats(overlays) {
        const stats = OverlayProcessor.getProcessingStats(overlays);
        const processed = overlays.filter(overlay => this.processedOverlayCache.has(overlay.id)).length;
        return {
            ...stats,
            processed
        };
    }
    /**
     * 清除處理快取
     */
    clearProcessingCache() {
        this.processedOverlayCache.clear();
    }
    /**
     * 取得快取狀態
     */
    getCacheInfo() {
        let totalPixels = 0;
        const overlayIds = Array.from(this.processedOverlayCache.keys());
        this.processedOverlayCache.forEach(canvas => {
            totalPixels += canvas.width * canvas.height;
        });
        // 估算記憶體使用量（RGBA = 4 bytes per pixel）
        const memoryBytes = totalPixels * 4;
        const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);
        return {
            size: this.processedOverlayCache.size,
            overlayIds,
            memoryUsage: `${memoryMB} MB`
        };
    }
    /**
     * 創建圖層預覽
     * @param overlay - 要預覽的圖層
     * @param size - 預覽尺寸
     */
    createOverlayPreview(overlay, size = 150) {
        return OverlayProcessor.createPreview(overlay, size);
    }
    /**
     * 渲染高品質海報
     * 需要重新取得海報數據並渲染
     */
    async renderHighQualityPoster(ctx, width, height) {
        // 暫存原始 Canvas 和 Context
        const originalCanvas = this.canvas;
        const originalCtx = this.ctx;
        // 臨時切換到高解析度 Canvas
        this.ctx = ctx;
        try {
            // Export the exact last render, including transparent table and optical state.
            if (this.lastRenderArgs) {
                this.drawPoster(...this.lastRenderArgs);
                return;
            }
            // 未曾繪製時才沿用舊 DOM／全域來源。
            const posterData = this.getCurrentPosterData();
            // 重新繪製整個海報
            this.drawPoster(posterData.agendaItems, posterData.currentTemplate, posterData.currentColorScheme, posterData.currentGradientDirection, posterData.customColors, posterData.conferenceData, posterData.showFooter, posterData.footerText, posterData.overlays, posterData.tableOpacity ?? 1.0);
        }
        finally {
            // 恢復原始 Canvas 和 Context
            this.ctx = originalCtx;
        }
    }
    /**
     * 從 DOM 或全域狀態取得當前海報數據
     */
    getCurrentPosterData() {
        // 從全域 app 物件取得數據（如果存在）
        const app = window.app;
        if (app && app.getAppState) {
            const state = app.getAppState();
            const conferenceData = app.getConferenceData ? app.getConferenceData() : this.getConferenceDataFromDOM();
            return {
                agendaItems: state.agendaItems || [],
                currentTemplate: state.currentTemplate || 'lung',
                currentColorScheme: state.currentColorScheme || 'medical_green',
                currentGradientDirection: state.currentGradientDirection || 'horizontal',
                customColors: state.customColors || {},
                conferenceData,
                showFooter: this.getCheckboxValue('showFooterNote'),
                footerText: this.getInputValue('footerNoteContent') || '',
                overlays: state.overlays || [],
                tableOpacity: app.formControls ? app.formControls.getTableOpacity() : 1.0
            };
        }
        // 如果沒有全域狀態，從 DOM 直接讀取
        return this.getPosterDataFromDOM();
    }
    /**
     * 從 DOM 讀取會議資訊；高品質下載需使用同一份選項，避免下載檔漏掉 Canvas 上的集合地點或 Moderator 設定。
     */
    getConferenceDataFromDOM() {
        return {
            title: this.getInputValue('conferenceTitle') || '醫學會議',
            subtitle: this.getInputValue('conferenceSubtitle') || '',
            date: this.getInputValue('conferenceDate') || '',
            time: this.getInputValue('conferenceTime') || '',
            location: this.getInputValue('conferenceLocation') || '',
            showMeetupPoint: this.getCheckboxValue('showMeetupPoint'),
            meetupType: this.getRadioValue('meetupType') === 'other' ? 'other' : 'same',
            meetupCustomText: this.getInputValue('meetupCustomText') || '',
            hideModerator: this.getCheckboxValue('hideModeratorColumn'),
            mergeSameModerator: this.getCheckboxValue('mergeSameModerator')
        };
    }
    /**
     * 從 DOM 元素讀取當前海報數據
     */
    getPosterDataFromDOM() {
        // 從全域 formControls 取得議程數據（如果可用）
        const app = window.app;
        let agendaItems = [];
        let overlays = [];
        if (app && app.formControls && app.formControls.getAgendaItems) {
            agendaItems = app.formControls.getAgendaItems();
        }
        if (app && app.overlayManager && app.overlayManager.getOverlays) {
            overlays = app.overlayManager.getOverlays();
        }
        return {
            agendaItems,
            currentTemplate: 'lung',
            currentColorScheme: 'medical_green',
            currentGradientDirection: 'horizontal',
            customColors: {
                headerC1: '#1B4D3E',
                headerC2: '#2D8659',
                headerC3: '#4CAF85',
                agendaBg: '#E8F5E8',
                agendaBorder: '#1B4D3E',
                agendaAccent: '#2D8659',
                bgC1: '#ffffff',
                bgC2: '#f8f9fa',
                bgGradientDir: 'none'
            },
            conferenceData: this.getConferenceDataFromDOM(),
            showFooter: this.getCheckboxValue('showFooterNote'),
            footerText: this.getInputValue('footerNoteContent') || '',
            overlays,
            tableOpacity: app && app.formControls ? app.formControls.getTableOpacity() : 1.0
        };
    }
    /**
     * 輔助方法：從 DOM 取得輸入值
     */
    getInputValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }
    /**
     * 輔助方法：從 DOM 取得 radio 群組值
     */
    getRadioValue(name) {
        const element = document.querySelector(`input[name="${name}"]:checked`);
        return element ? element.value : '';
    }
    /**
     * 輔助方法：從 DOM 取得 checkbox 值
     */
    getCheckboxValue(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
    }
}
//# sourceMappingURL=posterRenderer.js.map