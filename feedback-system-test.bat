@echo off
echo =====================================
echo 用戶回饋蒐集系統 - 測試腳本
echo 測試項目：完整回饋流程功能
echo =====================================
echo.

echo 🚀 啟動開發伺服器...
echo.

echo 📋 測試清單：
echo ✅ 1. 設計一個海報
echo ✅ 2. 點擊"下載"按鈕
echo ✅ 3. 確認回饋表單彈出
echo ✅ 4. 填寫機構名稱（必填）
echo ✅ 5. 填寫姓名（必填）
echo ✅ 6. 填寫回饋意見（選填）
echo ✅ 7. 點擊"提交並下載"
echo ✅ 8. 確認顯示"⏳ 提交中..."
echo ✅ 9. 確認顯示成功頁面
echo ✅ 10. 確認海報下載開始
echo.

echo ⚠️  重點測試項目：
echo - 今日第一次使用：顯示表單
echo - 今日已提交過：直接下載
echo - 本地記憶功能：自動填入機構和姓名
echo - 表單驗證：必填欄位檢查
echo - 錯誤處理：網路異常時的提示
echo - 響應式設計：手機和桌面顯示
echo.

echo 🎯 Make.com 設定提醒：
echo 1. 複製 FeedbackController 中的 WEBHOOK_URL
echo 2. 設定 Make.com Scenario：
echo    - Webhook 觸發器
echo    - Airtable 新增記錄模組
echo 3. 建立 Airtable Base：User_Feedback
echo    - Organization (Single line text)
echo    - Name (Single line text) 
echo    - Feedback (Long text)
echo    - Timestamp (Date)
echo    - Source (Single line text)
echo.

echo 💾 本地存儲測試：
echo - 開啟 DevTools → Application → Local Storage
echo - 查看 medical-agenda-user-data
echo - 查看 medical-agenda-last-submit
echo.

npm start
