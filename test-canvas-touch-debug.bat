@echo off
echo 🔍 啟動 Canvas 觸控除錯測試...
echo.
echo 測試重點:
echo 1. 開啟 F12 Console 看詳細日誌
echo 2. 啟用觸控除錯面板 (右下角)
echo 3. 嘗試拖拽 PNG 控制點
echo 4. 觀察是否被 Canvas 滾動中斷
echo.

npm start

echo.
echo 測試完成！檢查 Console 日誌找出問題點
pause
