@echo off
echo "=== 單一高品質下載測試 ==="
echo "編譯 TypeScript..."
call tsc
if %errorlevel% equ 0 (
    echo "✅ 編譯成功！"
    echo ""
    echo "🚀 啟動測試服務..."
    echo "📋 測試項目："
    echo "  1. 唯一下載按鈕 - 3倍高品質解析度"
    echo "  2. 檔案大小驗證（約9倍像素）" 
    echo "  3. 清晰度檢查（文字和圖片）"
    echo "  4. 手機查看效果"
    echo ""
    start http://localhost:3001
    call npm start
) else (
    echo "❌ 編譯失敗！請檢查 TypeScript 錯誤"
    pause
)
