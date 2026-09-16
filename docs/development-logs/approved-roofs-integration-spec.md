# 核准屋簷正式整合規格

狀態：正式整合與本機畫布／瀏覽器驗收已通過；等待單一 commit、allowlist 打包與 preview 線上驗收。實際 commit／deployment version 只寫入外置發布報告，避免 commit 自引用。

## 規格與基準

- 完整約束：`/Users/promelink/Documents/ChatGPT/medical agenda maker/approved-roof-integration-goal-20260916-v2.md`。
- 規格 SHA-256：`1e4c4ce1d03834d0c5b2f711c7ce4710774f4b31117c2954af289ff2cbaed623`（404行；最新使用者授權的 goal 預算為2,000,000 tokens，不改變本規格實質驗收條件）。
- 主區：`/Users/promelink/Hermes/projects/medical-agenda-maker-wt-cancer-design`；分支 `feature/cancer-design-switcher-preview`；起點 `989231d80aec43fb24927cef4abfd7ace8ccead7`。
- 研究區：`/private/tmp/medical-agenda-roof-spike-wt.HaOLnu`，保留原有 dirty 內容、4178 伺服器和審閱頁。
- 外置證據根目錄：`/Users/promelink/Documents/ChatGPT/medical agenda maker/roof-integration-evidence/`。
- 備份 `baseline-20260916/study-snapshot.tar.gz` 含77個來源檔；解出逐檔比對通過。SHA：`a41868c89ad5a9fd7f1ad3cab38ac4fe38c7184e30cc414a5479e6988bb9afd0`。
- 主區17項、研究區46項基準測試通過；不是新版的驗收結果。

## 精確移入清單

原樣複製研究區 `qa/roof-material-spike/` 中下列6張PNG至正式 `assets/header-contour-materials-v2/`：

| 原始檔名 | 正式獨立款式ID | 適用癌別 |
| --- | --- | --- |
| signal-mother-v4.png | optical-signal | lung、urinary、headneck、colorectal |
| lung-satin-arc-v1.png | satin-arc | 同上 |
| urinary-waterlight-v1.png | waterlight | 同上 |
| breast-rose-satin-v1.png | rose-satin | breast、uterus |
| gyn-coral-arch-v1.png | coral-arch | 同上 |
| warm-peach-flow-v1.png | peach-flow | 同上 |

尺寸、bytes、SHA及核准來源集中於素材 manifest。原稿不是2400px原生：signal為2167×726，其餘2172×724。2400px輸出會作少量等比例放大；不重製原圖。

必要程式移植（不整包複製研究區）：

- `signalRoofMaterial.ts` 的 OKLab、色度轉移、白底分離、原比例構圖算法 → 正式 `roofColorMath.ts`、`roofMaterials.ts`；不移入全域研究view或「首個已載入instance」路由。
- `cool-roof-series.js`、`shared-roof-studies.js`、breast/gyn palette 的核准資料 → `roofStyles.ts`；不移入 query routing、QA preload。
- 新增 `roofTypes.ts`、`roofSelection.ts`，以獨立版本化狀態記錄款式及三色；不把六款塞進四個舊 HeaderContourId。
- 修改既有 `posterRenderer.ts`、`uiController.ts`、`overlayManager.ts`、`cancerDesignSwitcher.ts`、`templateManager.ts`、必要型別與HTML/CSS，另增正式款式控制器。公開舊簽章及 CancerDesignStateV2 保持。
- 新增素材 manifest、正式測試、正式 runtime QA 及明確JS依賴；build生成dist；新增可驗證的打包／回滾工具。
- 研究六檔46項測試留在原區完整重跑，不複製未交付的研究功能來假裝正式測試。

## 狀態及藝術邊界

新存檔可含 `roofSelectionState`（version 1）；無此欄位表示舊行為，不推測新款。每癌別僅允許核准的三款。獨立localStorage key不覆寫舊癌別key。壞JSON／未知版本不刪原資料；明確新選擇前先保留診斷副本。

建議色按核准catalog：冷色按癌別、暖色按款式。自訂保留使用者的三個HEX，既有自訂色輸入為單一來源；給對比提示與恢復按鈕，不宣稱任意自訂配色已獲藝術核准。文字只允許細邊補救，正式800px描邊不超過2px。

柔邊是連續coverage，不是150px或原比例矩形clip。屋簷／表格獨立關係及使用者透明度必須與獨立參考合成器比對，不能以兩次source-over的互補遮罩替代一次正確合成。

## 舊目標條款取捨

| 處理 | 條款 |
| --- | --- |
| 保留 | 真實Canvas、SHA、相容性、圖層獨立、文字安全、非同步fallback、桌手機/reduced-motion、完整測試、preview隔離、單一commit、安全tag及兩種回滾 |
| 取代 | 4×6通用款 → 冷3×4＋暖3×2＝18組；硬向量邊 → coverage柔邊；150px → 母稿完整比例；固定1800高 → 2400寬動態高 |
| 撤除 | 未核准02試作閘門、SuperDesign、灰階限制、6MiB限制、禁止新增任何狀態 |
| 不變 | 四個legacy ID、預設映射、舊migration語意、按鈕動態與操作、受保護素材、GitHub Pages |

## 已落地的正式管線

- 六款新 ID 只存在 `roofStyles` catalog，不覆寫四個 legacy `HeaderContourId`；每癌別只列出核准的三款。
- `roofSelectionState` 是 additive version 1 狀態，分癌別保存款式、建議／自訂模式與三個原始 HEX；舊存檔不會被默認套入光學屋簷。
- `RoofMaterialLibrary` 共用成功 decode promise、拒絕後可重試並以有界 surface cache 控制改色記憶體；`LatestRoofSelection` 與器官 primary request version 防止 A/B/A 晚到結果覆寫新選擇。
- `PosterRenderer` 的縮圖、正式 Canvas、柔邊分層及 3× 匯出共用明確 style／palette／placement／coverage；下載會等待所選素材與字型，不把 fallback 冒充正式輸出。
- `RoofStyleControls` 同時放在視覺設計及抽屜，提供建議、自訂三色、恢復建議與不適配提示；同步提交顏色到觸發輸入的癌別，快速切癌別不會串色。
- 標題使用 palette 衍生且不為純黑的細邊（800px主標1.8px、副標1.5px）；Agenda 標題字仍跟隨癌別色系。

## 驗收追蹤

需求→程式→測試→原始證據及目前狀態見 `approved-roofs-integration-qa.md`；發布、allowlist、正常／緊急回滾見 `approved-roofs-preview-rollout.md`。外置證據根為 `/Users/promelink/Documents/ChatGPT/medical agenda maker/roof-integration-evidence/`。藝術核准與產品、部署驗收分開記錄，未執行項目不填 pass。
