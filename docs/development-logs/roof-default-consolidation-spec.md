# 屋簷預設與經典版本收斂規格

日期：2026-09-16
狀態：已實作；2026-09-16依使用者實際操作回饋追加「全員以新版光影屋簷重新起始」規格。

## 1. 已驗證基準

- 開發分支：`feature/cancer-design-switcher-preview`
- 基準 commit：`5d401cfad52e5afdf70836ea75f04b06c72c0bf8`
- tracked working tree：乾淨；唯一既有未追蹤項目為受保護的 `assets/cancer-motifs-v2/`
- 受保護研究 worktree：`/private/tmp/medical-agenda-roof-spike-wt.HaOLnu`，不得修改或清理
- safety tag：`preview/before-default-roof-consolidation-20260916`
- 基準測試：`npm test` = 39 passed／0 failed／0 skipped；`npx tsc --noEmit` = 0
- Cloudflare preview：`https://medical-agenda-preview.promelink.link`
  - version：`c9573652-6238-4342-bb1c-84402427be00`
  - deployment：`78fce8cd-2d74-4d0a-828a-c9914197ae3e`
  - marker：`immunotherapy-contours-v1`
  - `index.html` SHA-256：`9ed5eaa33e86f624a91b133c17212caf40454a3d1ab2cd674f3996854b155d3c`
- GitHub Pages：`https://howhow777.github.io/medical-agenda-maker/`
  - source：`origin/Try_to_remove_cutting_model` @ `e786b82934417e8828b935d1c2b8dc593182934f`
  - public `index.html` SHA-256：`a5aa242b6b9f3ef62a57ff54d3b9bd40a05085cb98cb13fa718fb2e45e0b9b92`

## 2. 最初版波浪屋簷的唯一來源

來源為 GitHub Pages commit `e786b82934417e8828b935d1c2b8dc593182934f` 的 `src/logic/posterRenderer.ts`；該檔 SHA-256 為 `30f9651dc975876062f994f4f9131527dfe987314c06f9845dcabf375bf26704`。

800px 寬的 canonical geometry：

```text
headerHeight = 120
M 0,0
L 800,0
L 800,100
Q 600,130 400,110
Q 200,90 0,120
Z
```

正式實作只建立一個同比例 path function，供選擇卡、正常 Canvas、overlay clipping、fallback 與 2400×1800 匯出共用。經典屋簷只固定幾何，不固定綠色色票；癌別建議配色及自訂三色仍由目前色彩狀態提供。

## 3. 正式保留的屋簷

| family | style ID | 名稱 | 核准癌別 |
|---|---|---|---|
| cool | `optical-signal` | 青藍交錯光膜 | 肺癌、頭頸癌、泌尿癌、腸癌 |
| cool | `satin-arc` | 清透弧帶 | 肺癌、頭頸癌、泌尿癌、腸癌 |
| cool | `waterlight` | 水光流域 | 肺癌、頭頸癌、泌尿癌、腸癌 |
| warm | `rose-satin` | 晨曦柔綢 | 乳癌、婦癌 |
| warm | `coral-arch` | 珊瑚杏光 | 乳癌、婦癌 |
| warm | `peach-flow` | 桃金流光 | 乳癌、婦癌 |

共 18 個核准 cancer/style 配對。每個癌別的 fresh default：

| 癌別 | fresh default |
|---|---|
| `lung` | `optical-signal` |
| `headneck` | `satin-arc` |
| `urinary` | `waterlight` |
| `colorectal` | `satin-arc` |
| `breast` | `rose-satin` |
| `uterus` | `coral-arch` |

另保留一款 `classic`，使用者介面名稱精確為「最初版波浪屋簷」。

## 4. 移除盤點

以下四個 ID 是設計討論的中間產物，不再是正式產品選項：

- `soft-wave`
- `arc-sweep`
- `layered-ribbon`
- `clean-diagonal`

實作前引用分布：

- 型別與 preset：`src/assets/types.ts`、`src/logic/cancerDesignPresets.ts`
- 幾何／材質：`src/logic/headerContours.ts`
- renderer：`src/logic/posterRenderer.ts`
- UI：`src/interface/cancerDesignSwitcher.ts`、`src/interface/uiController.ts`、`index.html`
- tests／QA：`test/cancer-design-presets.test.mjs`、`test/approved-roofs.test.mjs`、`qa/immunotherapy-contours-runtime-qa.html`、`qa/approved-roofs-runtime-qa.js`、`qa/approved-roofs-maker-state-qa.js`、`qa/poster-export-smoke.html`

完成後四個字串只能存在於 isolated migration parser、migration fixtures、歷史文件與設計審核證據；不得存在於正式 renderer、正式 UI 或新狀態輸出。

## 5. 新狀態語意與 migration 矩陣

新屋簷狀態使用完整的 per-cancer versioned record；每個 entry 明確為 optical 或 classic，兩者都保存 recommended/custom mode 與三個 header colors。`undefined` 不再代表 legacy。

| 輸入 | 判定 | 新狀態 |
|---|---|---|
| 沒有本版 `agendaPoster.roofs.v3` | 本版一律視為 fresh user | 不論退役V1/V2瀏覽器偏好內容，六癌別均 seed 上表最新 optical defaults |
| 退役 `agendaPoster.opticalRoofs.v1` 或 `agendaPoster.roofs.v2` 存在 | rollback-only browser bytes | 啟動時不讀、不刪、不改寫；不能影響本版第一個可見frame |
| 本版 `agendaPoster.roofs.v3` | current browser choice | 驗證後原樣 round-trip；缺漏／非法項目以 classic 安全補齊並回報 issue |
| 舊 CancerDesign V1/V2存在 | motif/cancer compatibility only | 照原規則遷移癌別與器官選擇，但不得把退役輪廓轉成瀏覽器屋簷偏好 |
| 舊模板沒有 `roofSelectionState` | legacy template | 六癌別 explicit classic |
| 舊模板含 V1 partial state | legacy template with explicit optical | 合法 optical 保留，其餘 classic |
| 新模板 | current template | 儲存完整六癌別 explicit optical/classic state，載入後一致 |
| optical 素材載入中 | transient | 保留上一個可見 render，不改 persistent selection |
| optical 素材載入失敗 | transient failure | 顯示 classic fallback、錯誤及重試；persistent selection 仍是 optical，正式下載拒絕 |

本版啟動重置必須idempotent：第一次建立V3後，使用者在本版主動選擇的光影／最初版與自訂三色必須持久保存。重置不能改動退役屋簷bytes、器官圖、癌別、議程、overlay或其他localStorage資料。顯式模板解析仍保留舊schema相容；無法辨識的本版原始bytes在第一次explicit write前先保存到diagnostic key。

## 6. 首次可見畫面與載入策略

1. HTML 初始標記將海報 Canvas 設為屋簷初始化中。
2. fresh store 已解析出目前癌別的 optical default。
3. 初始化流程先載入該 optical asset，再把 resolved selection 交給 renderer。
4. 成功或明確失敗後才解除初始遮蔽：成功的第一個可見 frame 必須是 optical；失敗才可顯示 classic fallback 與重試訊息。
5. 一般切換時保留上一個完整 frame直到新素材成功；不得在正常 loading 間短暫切換 classic。

## 7. UI 目標

- 刪除「原有向量輪廓」section。
- 刪除「使用原輪廓」action。
- 每個癌別只顯示其三個核准 optical cards，加上一張「最初版波浪屋簷」card。
- classic 是明確 selected card，不是 reset 行為。
- 保留「恢復建議配色」、「自訂三色」、色票、status、retry、鍵盤、focus 與 ARIA。
- 癌別總覽縮圖與標籤依 explicit roof state 顯示 optical 或 classic。

## 8. 驗證閘門

- `npm test`：至少 45 passed／0 failed／0 skipped。
- `npx tsc --noEmit`：退出碼 0。
- 新增 fresh、退役V1/V2瀏覽器偏好忽略且bytes不變、四個V2 ID隔離、old/new template、canonical classic、runtime 無中間輪廓、custom colors、preload/fallback tests。
- 既有 research／visual suite：至少 46 passed／0 failed／0 skipped。
- Browser QA：18/18 optical、6/6 classic、24/24 PNG/JPEG 高解析輸出，並覆蓋 desktop 1400×900、mobile 390×844、鍵盤、focus、drawer、一般動畫、reduced-motion、console 0。
- 線上 smoke：以舊版classic偏好開站仍得到fresh optical default、latest/classic切換與本版持久化、輸出成功、HTTP 200、marker/hash對應follow-up commit。

## 9. 部署與回滾

只部署 `wrangler.preview.jsonc` 指向的 `medical-agenda-preview`；不 push、不部署 GitHub Pages。

正常回滾：

```bash
git revert <implementation-commit>
```

緊急 preview 回滾：從 `preview/before-default-roof-consolidation-20260916` 建立 detached worktree，依 allowlist 打包 preview runtime subset，重新部署同一 Worker，驗證基準 marker/hash 後移除該臨時 worktree。執行前先做不接觸 Cloudflare、且不移動 active branch 的 dry-run。

實際 implementation commit、新 Cloudflare version/deployment ID、線上 hashes、Pages after 證據與 dry-run 路徑將在 rollout 記錄中補齊。
