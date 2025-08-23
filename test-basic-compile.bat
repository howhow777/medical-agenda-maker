@echo off
echo "🔧 基本版本編譯測試"
echo "==================="

echo "清理舊編譯檔案..."
if exist dist\interface\*.js del dist\interface\*.js /Q
if exist dist\interface\*.d.ts del dist\interface\*.d.ts /Q

echo "編譯基本版本..."
call tsc --noEmit
if %errorlevel% neq 0 (
    echo "❌ 語法檢查失敗"
    pause
    exit /b 1
)

echo "✅ 語法檢查通過"

echo "完整編譯..."
call tsc
if %errorlevel% neq 0 (
    echo "❌ 完整編譯失敗"
    pause
    exit /b 1
)

echo "✅ 編譯成功!"

echo "檢查輸出檔案..."
if exist dist\interface\uiController.js echo "✅ uiController.js"
if exist dist\interface\cropController-basic.js echo "✅ cropController-basic.js"

echo "啟動測試伺服器..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""  
echo "🎯 基本功能測試："
echo "1. 頁面正常載入"
echo "2. Console 顯示 'CropController 基本初始化成功'"
echo "3. 現有PNG功能正常"
echo ""
pause
