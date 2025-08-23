@echo off
echo "🔍 測試 CropController 編譯"
echo "========================="

echo "檢查 TypeScript 編譯..."

:: 嘗試編譯單個檔案
echo "Step 1: 編譯 cropController-minimal.ts..."
call tsc src/interface/cropController-minimal.ts --outDir dist --target ES2020 --module ESNext --declaration --sourceMap

if %errorlevel% equ 0 (
    echo "✅ 最小版本編譯成功!"
    
    echo "Step 2: 編譯整個專案..."
    call tsc
    
    if %errorlevel% equ 0 (
        echo "✅ 完整專案編譯成功!"
        echo "檢查輸出檔案..."
        dir dist\interface\*crop* /b
    else (
        echo "❌ 完整專案編譯失敗!"
    )
) else (
    echo "❌ 最小版本編譯失敗!"
    echo "TypeScript 語法可能有錯誤"
)

pause
