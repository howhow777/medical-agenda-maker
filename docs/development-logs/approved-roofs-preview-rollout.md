# 核准屋簷 preview rollout / rollback

狀態：本機QA與離線緊急回滾dry-run已通過；implementation commit及preview deployment完成後，實際完整hash、deployment version與線上結果只寫入外置發布報告，避免反覆amend造成commit自引用。

外置證據根：`/Users/promelink/Documents/ChatGPT/medical agenda maker/roof-integration-evidence/`。

## 已驗證基準

- 開發分支 `feature/cancer-design-switcher-preview`，起點 `989231d80aec43fb24927cef4abfd7ace8ccead7`。
- annotated tag `preview/before-approved-roof-integration-20260916` 指向該起點。
- Preview Worker `medical-agenda-preview`；唯一自訂網域 `medical-agenda-preview.promelink.link`。
- 基準 version `3023a8b8-2563-47af-9aa7-1beb93a9ce7f`；deployment `9a61dda2-31b8-4884-9f26-9c2ea519d368`；marker `immunotherapy-contours-v1`。
- 56個基準runtime檔案HTTP 200且SHA與起點提交相同；保存於 `baseline-20260916/public/preview-bundle/`，manifest為 `public-baseline.json`。
- GitHub Pages遠端 `origin/Try_to_remove_cutting_model` 基準 `e786b82934417e8828b935d1c2b8dc593182934f`；站點index SHA-256 `a5aa242b6b9f3ef62a57ff54d3b9bd40a05085cb98cb13fa718fb2e45e0b9b92`。

## 打包／部署工具

`scripts/approved-roofs-preview.mjs`只從指定的已提交ref讀取檔案，預設是dry-run，不讀token、不呼叫Cloudflare。release逐檔allowlist包括：

- `index.html`、`styles.css`、`src/assets/feedback-modal.css`
- `dist/main.js`及由正式Maker與QA靜態import可達的30個必要dist JS
- 既有18張 `assets/cancer-motifs-v3/*.png`
- 六張核准屋簷及 `assets/header-contour-materials-v2/manifest.json`
- 單一QA入口 `qa/approved-roofs-runtime-qa.html` 及其7個明確JS/JSON依賴
- 打包後生成的 `build-info.json`，只含version、完整commit及bundle manifest SHA

禁止v2、`.superdesign`、研究／design-review素材、tests、docs、source maps、憑證、`.git`、`.wrangler`、`node_modules`及任何未列檔案。工具複製後逐檔重算bytes/SHA並再次比對實際bundle清單；任何多檔／缺檔即失敗並刪除該次未完成output。

release dry-run／真部署格式：

```sh
npm run preview:approved-roofs -- \
  --source <完整implementation commit> \
  --output <全新bundle目錄> \
  --report <外置report.json>
```

只有全部本機驗收、單一commit及Pages-before讀回通過後才可加入 `--deploy`。真部署前呼叫端只將 `/Users/promelink/.hermes/.env` 中的 `CLOUDFLARE_API_TOKEN` 單獨注入環境；不source整檔、不輸出token。工具再驗 `wrangler.preview.jsonc` 的Worker名稱與唯一custom domain，才執行固定 `wrangler@4.131.1 deploy --assets`。

## 已完成的離線緊急回滾dry-run

2026-09-16由安全tag建立新的detached worktree：

```sh
git worktree add --detach <新臨時路徑> preview/before-approved-roof-integration-20260916
```

再以baseline profile讀取事前保存的56檔manifest，從tag提交內容重建bundle；結果：

- source `989231d80aec43fb24927cef4abfd7ace8ccead7`
- fileCount `56`
- `baselineVerified: true`
- bundle manifest SHA-256 `1762995189326cb2108db73e011f08ad84d7c9d17335ed55e53b8945f3896ef1`
- Worker／domain驗證通過
- 全程沒有token、API、Cloudflare或GitHub寫入
- active branch仍為 `feature/cancer-design-switcher-preview`，HEAD未移動
- 只移除本次新建worktree與暫存bundle；研究worktree保留

原始結果：`rollback-dry-run-20260916/baseline-package-report.json`。

## 正常Git回滾

實際commit由外置發布報告讀出；先確認位於正確分支且沒有會被覆寫的使用者變更，再執行：

```sh
implementation_commit=$(jq -r '.implementationCommit' '/Users/promelink/Documents/ChatGPT/medical agenda maker/roof-integration-evidence/release-20260916/release-report.json')
git revert "$implementation_commit"
PATH=/Users/promelink/.local/bin:$PATH npm test
PATH=/Users/promelink/.local/bin:$PATH ./node_modules/.bin/tsc --noEmit
```

若revert衝突即停止，不使用reset／checkout／force覆蓋；測試通過後才從新revert commit重建release bundle並部署同一preview Worker。此任務的dry-run不真的revert已完成實作。

## 緊急preview復原

不移動目前開發分支：

```sh
rollback_worktree=$(mktemp -d /private/tmp/approved-roofs-emergency-rollback.XXXXXX)
git worktree add --detach "$rollback_worktree" preview/before-approved-roof-integration-20260916
```

以工具的baseline profile及事前 `public-baseline.json` 重建56檔並驗SHA。若tag與事前線上bundle任何一檔不符，改用已保存且驗證的 `baseline-20260916/public/preview-bundle/`；不得把不符的tag產物假稱線上基準。只有實際故障回復時才明確加入部署旗標或直接對verified baseline bundle執行相同Worker部署。部署後核對marker、index/styles、核心JS及56檔hash。

完成後先確認臨時worktree無未保存內容，再：

```sh
git worktree remove "$rollback_worktree"
```

不得force移除、不得刪研究worktree、不得部署GitHub Pages。

## 發布前／後門檻

發布前：

1. build、typecheck、39/39正式測試及46/46研究測試全部exit 0、0 skip。
2. 本機正式QA：6/6、18/18、24/24、18PNG、18JPEG、96/96 compositor、Maker state、responsive、0 console error。
3. protected paths無diff；只有 `assets/cancer-motifs-v2/` 保持既有untracked。
4. 單一scoped implementation commit後，release bundle必須從該commit生成。
5. 重新讀取Pages ref與站點hash；若已由他人變更，記錄新狀態，不能宣稱未變。

發布後：

1. 記錄Cloudflare deployment version與CLI結果。
2. bundle全部資產HTTP 200（合法redirect記final 200）且線上SHA等於commit bundle。
3. 線上正式QA重新獨立跑完，不混用本機artifact；再做1400×900與390×844開關／重點鍵盤操作。
4. 再讀Pages ref與站點hash，必須與發布前相同；不push、不回滾他人變更。
5. 寫 `release-20260916/release-report.json`，至少包含 `implementationCommit`、`cloudflareDeploymentVersion`、bundle manifest、HTTP/hash/QA、Pages before/after、rollback dry-run及剩餘限制。
6. 清理只屬本次的新預覽伺服器、bundle與`.wrangler`產物；最終主區除受保護v2外乾淨，研究worktree與耐久備份保留。
