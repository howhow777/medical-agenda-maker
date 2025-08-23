@echo off
echo "🔧 使用乾淨版本修復"
echo "=================="

echo "清理編譯輸出..."
if exist dist rmdir /s /q dist

echo "編譯測試..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯仍然失敗"
    echo "列出 src/interface/ 中的 crop 相關檔案："
    dir src\interface\crop*.ts /b
    pause
    exit /b 1
)

echo "✅ 編譯成功!"

echo "啟動伺服器..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""
echo "請檢查："
echo "1. 頁面正常載入"
echo "2. Console 顯示 'CropController 初始化完成'"
echo "3. PNG 功能正常"
pause
