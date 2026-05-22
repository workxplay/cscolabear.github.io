# 文章內容圖片自動加上 lazy loading 設計

## 目標

讓本專案文章內容產生的 `<img>` 自動帶有 `loading="lazy"`，提升文章頁圖片的初始載入效率，同時不影響主題元件、導覽、logo 或其他非文章內容圖片。

## 範圍

- 包含：
  - Markdown 圖片語法產生的文章圖片
  - 文章正文中直接撰寫的 HTML `<img>`
- 不包含：
  - VitePress 主題元件內的圖片
  - 站台 logo、導覽列圖示、其他 layout 圖片
  - 站外嵌入內容（如 iframe）

## 現況

- 站台使用 VitePress，Markdown 設定集中在 `pages/.vitepress/config.js`
- 文章來源同時包含手寫 Markdown 與由 `scripts/build-posts.js` 生成的貼文內容
- 既有文章中已存在直接撰寫的 HTML `<img>`，因此只修改文章生成腳本不足以完整覆蓋需求

## 採用方案

在 `pages/.vitepress/config.js` 的 `markdown.config` 中擴充 markdown-it 行為：

1. 覆寫 Markdown 圖片 renderer，讓 Markdown 圖片輸出的 `<img>` 自動補上 `loading="lazy"`
2. 加入 core rule，巡覽文章內容中的 HTML 區塊，針對 `<img>` 補上 `loading="lazy"`
3. 若圖片已經明確宣告 `loading` 屬性，保留原值，不覆寫

## 為什麼選這個方案

- 修改點集中在 VitePress 文章 renderer，能精準限定在文章內容
- 可同時覆蓋 Markdown 圖片與內嵌 HTML `<img>`
- 不需要前端 runtime 掃描 DOM，也不需要改動主題元件
- 對既有文章與未來新文章都生效

## 不採用方案

### 只改 `scripts/build-posts.js`

這只能覆蓋從 GitHub Issues 同步生成的文章，無法處理手寫文章中的 Markdown 圖片或其他手動維護的文章檔。

### 前端 runtime 掃描 DOM 後補屬性

雖然可行，但屬性補得太晚，也增加不必要的前端行為，不符合這個靜態內容站的最小改動原則。

## 風險與處理

- 風險：誤改到非文章內容圖片
  - 處理：只掛在 VitePress 的 Markdown renderer，不碰 theme component
- 風險：重複加入 `loading` 屬性
  - 處理：若原始標籤已帶 `loading`，則直接保留
- 風險：HTML `<img>` 屬性順序被改動
  - 處理：只做最小字串補強，避免不必要重寫

## 驗證方式

1. 執行 `npm run pages:build`
2. 檢查輸出的文章 HTML，確認文章內容中的 `<img>` 帶有 `loading="lazy"`
3. 抽查至少一篇含 HTML `<img>` 的文章與一篇含一般 Markdown 圖片的文章

## 預期結果

- 文章內容圖片預設 lazy loading
- 主題與 layout 圖片維持原狀
- 不需要修改既有文章內容格式
