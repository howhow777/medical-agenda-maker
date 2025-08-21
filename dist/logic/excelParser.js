export class ExcelAgendaParser {
    /**
     * 解析 Excel 檔案為議程資料
     */
    async parseExcelFile(file) {
        // 檢查 XLSX 是否已載入
        if (typeof XLSX === 'undefined') {
            return { success: false, error: 'XLSX 程式庫未載入，請重新整理頁面' };
        }
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                cellStyles: true,
                cellDates: true,
                cellNF: true
            });
            // 取得第一個工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // 轉換為 JSON 陣列
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: ''
            });
            // 解析基本資訊和議程項目
            const basicInfo = this.parseBasicInfo(jsonData);
            const items = this.parseAgendaItems(jsonData);
            const agendaData = {
                basicInfo,
                items,
                metadata: {
                    totalDuration: this.calculateTotalDuration(items),
                    createdAt: new Date()
                }
            };
            return {
                success: true,
                data: agendaData
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Excel 解析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
            };
        }
    }
    /**
     * 解析基本資訊
     */
    parseBasicInfo(data) {
        const basicInfo = {
            title: '',
            venue: '',
            date: '',
            time: ''
        };
        // 搜尋關鍵字段
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (!row)
                continue;
            for (let j = 0; j < row.length; j++) {
                const cell = String(row[j] || '').trim();
                const nextCell = String(row[j + 1] || '').trim();
                // 主題識別
                if (cell.includes('Topic') || cell.includes('主題') || cell.includes('會議主題')) {
                    basicInfo.title = nextCell || this.findValueInRow(row, j + 1);
                }
                // 地點識別
                if (cell.includes('Venue') || cell.includes('地點') || cell.includes('場地')) {
                    basicInfo.venue = nextCell || this.findValueInRow(row, j + 1);
                }
                // 日期識別
                if (cell.includes('Date') || cell.includes('日期')) {
                    basicInfo.date = nextCell || this.findValueInRow(row, j + 1);
                }
                // 時間識別
                if (cell.includes('Time') || cell.includes('時間')) {
                    basicInfo.time = nextCell || this.findValueInRow(row, j + 1);
                }
            }
        }
        return basicInfo;
    }
    /**
     * 解析議程項目
     */
    parseAgendaItems(data) {
        const items = [];
        let foundTableStart = false;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row)
                continue;
            // 尋找表格開始（包含時間欄位）
            if (!foundTableStart) {
                const hasTimeColumn = row.some(cell => String(cell || '').toLowerCase().includes('time') ||
                    String(cell || '').includes('時間'));
                if (hasTimeColumn) {
                    foundTableStart = true;
                    continue; // 跳過標題行
                }
            }
            if (foundTableStart) {
                const item = this.parseAgendaRow(row);
                if (item) {
                    items.push(item);
                }
            }
        }
        return items;
    }
    /**
     * 解析單一議程行
     */
    parseAgendaRow(row) {
        if (!row || row.length < 2)
            return null;
        const timeStr = String(row[0] || '').trim();
        const contentStr = String(row[1] || '').trim();
        // 過濾空行或無效行
        if (!timeStr || !contentStr)
            return null;
        if (timeStr.toLowerCase().includes('time') || timeStr.includes('時間'))
            return null;
        // 判斷議程類型
        let type = 'presentation';
        const lowerContent = contentStr.toLowerCase();
        if (lowerContent.includes('break') || lowerContent.includes('休息')) {
            type = 'break';
        }
        else if (lowerContent.includes('dinner') || lowerContent.includes('晚餐')) {
            type = 'dinner';
        }
        else if (lowerContent.includes('opening') || lowerContent.includes('開場')) {
            type = 'opening';
        }
        else if (lowerContent.includes('closing') || lowerContent.includes('結束')) {
            type = 'closing';
        }
        else if (lowerContent.includes('discussion') || lowerContent.includes('討論')) {
            type = 'discussion';
        }
        return {
            time: timeStr,
            content: contentStr,
            speaker: row[2] ? String(row[2]).trim() : undefined,
            moderator: row[3] ? String(row[3]).trim() : undefined,
            type
        };
    }
    /**
     * 輔助方法：在行中找到值
     */
    findValueInRow(row, startIndex) {
        for (let i = startIndex; i < row.length; i++) {
            const value = String(row[i] || '').trim();
            if (value)
                return value;
        }
        return '';
    }
    /**
     * 計算總時長
     */
    calculateTotalDuration(items) {
        if (items.length === 0)
            return '0 小時';
        const firstTime = items[0].time;
        const lastTime = items[items.length - 1].time;
        return `${firstTime} - ${lastTime}`;
    }
}
//# sourceMappingURL=excelParser.js.map