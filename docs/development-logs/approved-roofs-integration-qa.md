# 核准屋簷整合 QA 索引

狀態：本機正式驗收已通過；preview 線上驗收待 deployment 後執行。本文件不預填線上成功，實際 commit、deployment version 與線上結果寫入外置發布報告。

完整規格：`/Users/promelink/Documents/ChatGPT/medical agenda maker/approved-roof-integration-goal-20260916-v2.md`，SHA-256 `1e4c4ce1d03834d0c5b2f711c7ce4710774f4b31117c2954af289ff2cbaed623`。外置證據根：`/Users/promelink/Documents/ChatGPT/medical agenda maker/roof-integration-evidence/`。

## 最終本機摘要

- 正式 `npm test`：39/39 passed、0 failed、0 skipped（舊17＋正式新增22）。
- 保留研究六檔：46/46 passed、0 failed、0 skipped；其中17與正式舊測試重疊，因此總計68個不重複測試，超過規格要求58。
- 正式 runtime：六素材6/6、核准18/18、legacy 24/24、PNG 18/18、JPEG 18/18、2400×1800短版通過。
- 研究核准Canvas→正式候選：18/18屋簷 ROI raw RGB MAE≤3；最高 `1.6164807930607188`。合法 glyph-expanded mask 排除後最高 `1.1466619083495249`，同時保留原始值及排除像素數。
- 正常→3×縮回：36個PNG/JPEG輸出逐組≤3；最高 `2.6081335192069393`。
- 獨立 compositor：六款×四種 aboveHeader/aboveTable 關係×四透明度＝96/96，0 failure；25/50/100%及全透明探針、連續 coverage、互補、128 alpha均通過。
- 文字：18/18主副標具有連續薄邊補救且最低有效辨識對比≥3；保留 fill-only不足像素，沒有以P10掩蓋。Agenda實際glyph全部≥4.5，觀察最低 `4.505065620746503`。
- 正式 Maker 狀態：18/18真實UI選款；六癌別各自建議／自訂三色還原；save/load、reload、legacy、A/B/A屋簷與器官primary競態均通過，會議文字、五列議程與器官使用者設定不被重寫。
- 響應式：1400×900與390×844，無水平溢出；按鈕精確文案、44px、單行、sticky；Enter/Space、Tab/Shift+Tab、focus trap、Escape與focus return通過。
- 動態：三次 discovery→3.6s breathing、亮度差≤4%、8s漸層、3s流光、hover/active暫停；reduced-motion關閉上述動態。桌面／手機×normal/reduce×抽屜開關共8張實圖。
- `applicationConsoleErrors=0`；專案來源未包含 `MutationObserver.observe`，本次正式頁與乾淨 headless 截圖流程均未重現歷史錯誤，沒有把未知錯誤歸咎於工具。

最終本機機器報告：`integration-checkpoint-06/approved-roofs-runtime-qa-final-local.json`。八張操作證據及 metadata：`integration-checkpoint-05/`。

## 需求 → 實作 → 證據索引

| ID | 實作／測試 | 執行／原始證據 | 本機狀態 |
| --- | --- | --- | --- |
| A1 規格／來源鎖定 | 三份整合文件、6圖manifest、18 pair catalog | `baseline-20260916/`、安全tag、spec SHA | pass |
| A2 研究備份可還原 | 77檔snapshot＋tracked patch＋hash restore | `baseline-20260916/study-snapshot.tar.gz`、baseline report | pass |
| A3 Preview／Pages基準 | 56檔線上bundle、版本、Pages ref/hash | `baseline-20260916/public/`、`preview-version.json` | pass（基準） |
| B01 catalog | `roofStyles.ts`，冷12＋暖6，錯配拒絕 | `B01 six explicit optical styles...` | pass |
| B02 manifest | 6個bytes／尺寸／SHA／核准來源 | `B02 six immutable native PNGs...` | pass |
| B03 loader | 共用promise、6 identity、單次decode | `B03 concurrent same-artwork requests...` | pass |
| B04 race | selection coordinator＋器官primary request version | 兩項B04測試、Maker state A/B/A | pass |
| B05 failure | 404/decode/offline、fallback、retry、wrong-size | 兩項B05測試 | pass |
| B06 legacy | 四舊ID、V1/V2、mapping、migration不變 | B06＋舊17項＋runtime legacy24 | pass |
| B07 persistence | 六癌別獨立狀態、壞資料備份、同步color input | 四項B07＋Maker save/load/reload | pass |
| B08 colors／text | 18建議＋39自訂、極端色、OKLab、Agenda/標題 | 四項B08＋18 glyph QA | pass |
| B09 cache | style/color/size key、有界LRU、retry | B09測試 | pass |
| B10 geometry | 原比例縮圖／800／2400、穩定readback | 兩項B10＋18 export MAE | pass |
| B11 overlays／coverage | 四關係、四透明度、independent oracle | 三項B11＋96-case compositor | pass |
| B12 export | 18 PNG＋18 JPEG、2400×2490、2400×1800 | runtime JSON及解碼／非空／MAE assertions | pass |
| C1 研究→正式 | 同一800×830 fixture、raw＋glyph mask | `integration-checkpoint-03/reference-bundle.json`、180 PNG | pass |
| C2 柔邊人工／數值 | coverage heatmap、0.1/0.5/0.9等值線、完整海報 | `integration-checkpoint-02/`及formal gallery | pass |
| D1 可讀性 | 實際drawHeaderText與Agenda glyph取樣 | runtime `typography`、18 glyph mask | pass |
| D2 真實Maker狀態 | 18選款、六癌別、save/reload/legacy/race | runtime `makerState` | pass |
| D3 responsive／motion | 2 viewport、鍵盤／ARIA、8截圖 | runtime `responsive`、`integration-checkpoint-05/` | pass |
| E 本機正式報告 | 所有要求欄位由assertion產生 | `integration-checkpoint-06/approved-roofs-runtime-qa-final-local.json` | pass |
| F1 pack／rollback dry-run | 從提交物逐檔allowlist、預設dry-run | `scripts/approved-roofs-preview.mjs`、`rollback-dry-run-20260916/` | pass |
| F2 commit／preview／online QA | 單一commit、release bundle、online formal QA、Pages after | 外置發布報告 | pending deployment |

## 正式新增22項測試名稱

1. `B07 color input commits to its originating cancer before an immediate cancer switch`
2. `B01 six explicit optical styles expose exactly eighteen approved pairs; cross-family and unknown pairs rejected`
3. `B02 six immutable native PNGs match approved hashes, manifest dimensions/bytes/catalog and provenance`
4. `B03 concurrent same-artwork requests share one promise and all six identities decode once`
5. `B04 delayed A then B cannot overwrite B; repeated A/B/A resolves only the latest selection`
6. `B04 delayed cancer primary loads cannot overwrite the newest motif or steal selection after a cancer switch`
7. `B05 404/decode/offline failures are visible and retryable; failed or stale selections cannot export`
8. `B05 wrong-size decoded artwork is rejected without poisoning retry`
9. `B06 legacy defaults and V1 migration retain exact old meaning and never select an optical roof implicitly`
10. `B07 six cancer selections independently round-trip through reload with exact custom HEX and no shared references`
11. `B07 invalid JSON/version/style survives reads and is backed up before explicit changes; storage errors do not erase it`
12. `B07 invalid custom colors are rejected; recommended palettes restore exactly without mutating legacy palettes`
13. `B08 eighteen recommended and thirty-nine custom cases remain finite, nonempty and preserve supplied HEX`
14. `B08 optical transfer preserves RGB round trips, native warm chroma and neutral white highlights`
15. `B08 Agenda header ink keeps its cancer hue while reaching a 4.8:1 analytic contrast margin`
16. `B08 cool roof title keeps a white fill with a thin palette-derived non-black edge`
17. `B09 surface cache keys include style, every color and dimensions; LRU is bounded and reuses exact entries`
18. `B10 every optical placement retains the full native aspect at thumbnail, 800px and 2400px sizes`
19. `B10 native material uses a readback-stable context before first paint and reuses the same cached surface`
20. `B11 every 8-bit soft coverage and complement sum exactly to one without binary clipping`
21. `B11 transparent/25/50/100-percent probes stay single-opacity across every soft-boundary coverage`
22. `B11 coverage compositor agrees with independently expanded premultiplied scene reference, including differing alphas`

## 可重跑命令

主區，Node22：

```sh
PATH=/Users/promelink/.local/bin:$PATH npm run build
PATH=/Users/promelink/.local/bin:$PATH ./node_modules/.bin/tsc --noEmit
PATH=/Users/promelink/.local/bin:$PATH npm test
```

研究區原六檔，不改 assertion：

```sh
/Users/promelink/.local/bin/node --experimental-default-type=module --test test/cancer-design-presets.test.mjs test/signal-roof-material.test.mjs test/cool-roof-series.test.mjs test/breast-roof-material.test.mjs test/gyn-roof-material.test.mjs test/shared-roof-studies.test.mjs
```

正式瀏覽器 QA：開啟 `qa/approved-roofs-runtime-qa.html`，依序執行「桌面／手機／鍵盤與動態」、「正式Maker狀態與競態」、「18組與高畫質輸出」、「柔邊與四種圖層關係」，下載 JSON。任何 `unverified`、failures、console error 或缺欄皆不是通過。

## 固定量測定義

- 屋簷ROI為素材以800px寬等比例完整高度的ceil：signal `269px`，其餘 `267px`；sRGB 8-bit RGB逐值絕對差平均，範圍0–255。
- glyph排除只使用實際字形與描邊擴張區，必須同時報 raw MAE、排除後MAE及像素數；不排除背景或器官。
- 正常→高解析以同一固定縮回方法比較；每組PNG與JPEG各自≤3，不能用整體平均掩蓋單組。
- 主／副標以實際glyph填色與連續有效邊緣量測；fill不足仍保留，只有≤2px的可量測連續薄邊可補救。Agenda 16px glyph目標4.5。
- coverage為[0,1]連續值；互補誤差≤1/255。獨立reference compositor不呼叫正式mix／partition／clip函式，50%透明探針保持alpha128±1。
- 1400×900與390×844各驗開／關、normal／reduced；截圖和機器 metadata 都是正式 Maker，沒有研究 query。

## 外置檢查點

- `integration-checkpoint-01/`：首次整合、6/6、18/18、24/24、36 exports。
- `integration-checkpoint-02/`：獨立 compositor、60張柔邊／reference圖及早期失敗證據。
- `integration-checkpoint-03/`：18組研究→正式、180張full/roof/transition/glyph-mask圖。
- `integration-checkpoint-04/`：競態與文字修正後 build／test。
- `integration-checkpoint-05/`：8張桌面／手機／normal／reduce／drawer開關截圖與metadata。
- `integration-checkpoint-06/`：focus修正後完整本機正式JSON，96/96 compositor與0 failures。
- `rollback-dry-run-20260916/`：安全tag detached worktree的56檔baseline重建報告。

歷史檢查點中的失敗與 `unverified` 保留作除錯時間線；只有 checkpoint 06 與最後線上獨立報告代表目前候選狀態，不能回填或刪除早期證據。
