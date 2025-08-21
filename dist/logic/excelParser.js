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
            // 🔍 DEBUG: 檢查原始解析結果
            console.log('=== XLSX 原始解析結果 ===');
            console.log('總行數:', jsonData.length);
            jsonData.forEach((row, index) => {
                if (index < 20) { // 只顯示前20行避免過多輸出
                    console.log(`Row ${index}:`, row, `| Length: ${row ? row.length : 0}`);
                }
            });
            console.log('========================');
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
        // 搜尋關鍵字段（加強對特定格式的支持）
        for (let i = 0; i < Math.min(data.length, 15); i++) {
            const row = data[i];
            if (!row)
                continue;
            for (let j = 0; j < row.length; j++) {
                const cell = String(row[j] || '').trim();
                const nextCell = String(row[j + 1] || '').trim();
                // 主題識別 - 擴大關鍵字範圍
                if (cell.includes('Topic') || cell.includes('主題') ||
                    cell.includes('Meeting Agenda') || cell.includes('Total solution')) {
                    const title = nextCell || this.findValueInRow(row, j + 1);
                    if (title && !title.includes('Venue') && !title.includes('Date')) {
                        basicInfo.title = title;
                    }
                }
                // 地點識別 - 加強辨識
                if (cell.includes('Venue') || cell.includes('地點') || cell.includes('場地')) {
                    const venue = nextCell || this.findValueInRow(row, j + 1);
                    if (venue && venue.length > 2) { // 確保不是空值
                        basicInfo.venue = venue;
                    }
                }
                // 日期識別 - 支持多種格式
                if (cell.includes('Date') || cell.includes('日期')) {
                    const dateStr = nextCell || this.findValueInRow(row, j + 1);
                    if (dateStr && (dateStr.includes('/') || dateStr.includes('-') || dateStr.includes('年'))) {
                        basicInfo.date = dateStr;
                    }
                }
                // 時間識別
                if (cell.includes('Time') || cell.includes('時間')) {
                    const timeStr = nextCell || this.findValueInRow(row, j + 1);
                    if (timeStr && (timeStr.includes(':') || timeStr.includes('-'))) {
                        basicInfo.time = timeStr;
                    }
                }
                // 集合地點識別
                if (cell.includes('Meetup') || cell.includes('集合') || cell.includes('meetup')) {
                    const meetupStr = nextCell || this.findValueInRow(row, j + 1);
                    if (meetupStr) {
                        basicInfo.meetupPoint = meetupStr;
                        // 🔧 修復: 預設不勾選集合地點顯示
                        // basicInfo.showMeetupPoint = true;
                    }
                }
            }
        }
        // 如果主題仍為空，嘗試從檔案名稱獲取
        if (!basicInfo.title) {
            // 從 data 中找到第一個非空內容
            for (let i = 0; i < Math.min(data.length, 5); i++) {
                const row = data[i];
                if (row && row[0]) {
                    const cellValue = String(row[0]).trim();
                    if (cellValue && cellValue.length > 3 && !cellValue.includes('**')) {
                        basicInfo.title = cellValue;
                        break;
                    }
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
                    console.log('🔍 找到表格標題行:', row);
                    continue; // 跳過標題行
                }
            }
            if (foundTableStart) {
                console.log(`🔍 解析第 ${i} 行:`, row);
                const item = this.parseAgendaRow(row);
                if (item) {
                    items.push(item);
                    console.log('✅ 解析成功:', item);
                }
            }
        }
        console.log(`📊 總共解析出 ${items.length} 個議程項目`);
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
        // 🔍 詳細檢查每個欄位
        console.log(`  原始行長度: ${row.length}`);
        console.log(`  [0] 時間: "${timeStr}"`);
        console.log(`  [1] 內容: "${contentStr}"`);
        console.log(`  [2] Speaker: "${row[2] || ''}"`);
        console.log(`  [3] 位置3: "${row[3] || ''}"`);
        console.log(`  [4] Moderator: "${row[4] || ''}"`);
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
        // 🔧 修復：Moderator 在 row[4] 而不是 row[3]
        const speaker = row[2] ? String(row[2]).trim() : undefined;
        const moderator = row[4] ? String(row[4]).trim() : undefined;
        console.log(`  最終結果: Speaker="${speaker}", Moderator="${moderator}"`);
        return {
            time: timeStr,
            content: contentStr,
            speaker,
            moderator,
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