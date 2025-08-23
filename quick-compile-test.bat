@echo off
echo "🔧 快速編譯測試"
echo "==============="

echo "Step 1: 編譯修復版本..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯失敗，檢查錯誤..."
    pause
    exit /b 1
)

echo "✅ 編譯成功!"

echo "Step 2: 檢查關鍵檔案..."
if exist "dist\interface\cropController-fixed.js" (
    echo "✅ cropController-fixed.js 已生成"
) else (
    echo "❌ cropController-fixed.js 遺失"
)

echo "Step 3: 啟動服務..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""
echo "🎯 修復版本重點測試："
echo "=================="
echo "1. PNG選中後出現裁切按鈕"
echo "2. 進入裁切模式看到4個白色推桿"
echo "3. 拖拉推桿只調整裁切框，PNG不縮小"
echo "4. 推桿不會分裂或重複"
echo "5. 現有變形功能完全正常"
echo ""
echo "Console應該顯示："
echo "'🔒 裁切事件已綁定（capture模式）'"
echo "'🎯 推桿命中: xxx'"
echo "'📐 裁切區域更新: {...}'"
echo ""
pause
