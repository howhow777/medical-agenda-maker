@echo off
echo 🔧 修復 TypeScript 編譯錯誤...
echo.
echo ✅ 修復內容：
echo - 移除了不需要的 setLoadingState(false) 調用
echo - 成功情況：已經觸發下載並顯示成功狀態
echo - 失敗情況：setSubmitState(false) 已經處理載入狀態重置
echo.
echo 🚀 重新編譯測試...
npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ 編譯成功！啟動開發伺服器...
    npm run serve
) else (
    echo.
    echo ❌ 編譯失敗，請檢查錯誤訊息
    pause
)
