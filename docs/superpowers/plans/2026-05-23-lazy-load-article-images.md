# Lazy Load Article Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 VitePress 文章內容產生的圖片自動帶上 `loading="lazy"`，並保留既有 `loading` 設定。

**Architecture:** 把圖片屬性補強邏輯抽成一個獨立 markdown helper，讓 VitePress `markdown.config` 同時套用在 Markdown 圖片 renderer 與文章內嵌 HTML `<img>` token。用 Node 內建測試驗證屬性補強邏輯，避免引入額外測試框架。

**Tech Stack:** VitePress 1.x、markdown-it、Node.js built-in test runner

---

### Task 1: 建立圖片 lazy-loading helper 與測試

**Files:**
- Create: `pages/.vitepress/markdown/lazy-images.js`
- Create: `tests/lazy-images.test.js`

- [ ] **Step 1: 寫失敗測試**

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addLazyLoadingToImageTag,
  addLazyLoadingToHtmlContent
} from '../pages/.vitepress/markdown/lazy-images.js'

test('adds loading lazy to img tag without loading attribute', () => {
  const result = addLazyLoadingToImageTag('<img src="/cover.png" alt="cover">')
  assert.match(result, /loading="lazy"/)
})

test('keeps existing loading attribute on img tag', () => {
  const result = addLazyLoadingToImageTag('<img src="/cover.png" loading="eager">')
  assert.match(result, /loading="eager"/)
  assert.doesNotMatch(result, /loading="lazy".*loading="eager"|loading="eager".*loading="lazy"/)
})

test('adds loading lazy to html content img tags', () => {
  const result = addLazyLoadingToHtmlContent('<p>demo</p><img src="/cover.png">')
  assert.match(result, /<img[^>]*loading="lazy"/)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node --test tests/lazy-images.test.js`  
Expected: FAIL，因為 helper 尚未建立

- [ ] **Step 3: 寫最小實作**

```js
const IMG_TAG_PATTERN = /<img\b[^>]*>/gi
const LOADING_ATTR_PATTERN = /\sloading\s*=/i

export function addLazyLoadingToImageTag(imgTag) {
  if (LOADING_ATTR_PATTERN.test(imgTag)) {
    return imgTag
  }

  return imgTag.replace('<img', '<img loading="lazy"')
}

export function addLazyLoadingToHtmlContent(content) {
  return content.replace(IMG_TAG_PATTERN, addLazyLoadingToImageTag)
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node --test tests/lazy-images.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/lazy-images.test.js pages/.vitepress/markdown/lazy-images.js
git commit -m "test: cover lazy-loading image helpers"
```

### Task 2: 接上 VitePress markdown renderer

**Files:**
- Modify: `pages/.vitepress/config.js`
- Test: `tests/lazy-images.test.js`

- [ ] **Step 1: 補一個 renderer/HTML token 整合測試**

```js
import MarkdownIt from 'markdown-it'

import { applyLazyImageLoading } from '../pages/.vitepress/markdown/lazy-images.js'

test('adds loading lazy for markdown image renderer output', () => {
  const md = new MarkdownIt()
  applyLazyImageLoading(md)

  const result = md.render('![cover](/cover.png)')
  assert.match(result, /<img[^>]*loading="lazy"/)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node --test tests/lazy-images.test.js`  
Expected: FAIL，因為 `applyLazyImageLoading` 尚未實作

- [ ] **Step 3: 在 helper 與 VitePress config 寫最小整合**

```js
export function applyLazyImageLoading(md) {
  const defaultImageRenderer =
    md.renderer.rules.image ||
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]

    if (token.attrIndex('loading') === -1) {
      token.attrSet('loading', 'lazy')
    }

    return defaultImageRenderer(tokens, idx, options, env, self)
  }

  md.core.ruler.push('lazy_article_html_images', (state) => {
    state.tokens.forEach((token) => {
      if (token.type === 'html_block' || token.type === 'html_inline') {
        token.content = addLazyLoadingToHtmlContent(token.content)
      }
    })
  })
}
```

```js
import { applyLazyImageLoading } from './markdown/lazy-images.js'

markdown: {
  // existing options...
  config: (md) => {
    applyLazyImageLoading(md)
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node --test tests/lazy-images.test.js`  
Expected: PASS

- [ ] **Step 5: 跑建置驗證整體輸出**

Run: `npm run pages:build`  
Expected: exit 0，且輸出的文章 HTML 內文圖片包含 `loading="lazy"`

- [ ] **Step 6: Commit**

```bash
git add pages/.vitepress/config.js pages/.vitepress/markdown/lazy-images.js tests/lazy-images.test.js
git commit -m "feat: lazy load article images"
```
