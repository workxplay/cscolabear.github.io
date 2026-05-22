import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addLazyLoadingToImageTag,
  addLazyLoadingToHtmlContent,
  applyLazyImageLoading
} from '../pages/.vitepress/markdown/lazy-images.js'

function createImageToken(attrs = []) {
  return {
    attrs: [...attrs],
    attrIndex(name) {
      return this.attrs.findIndex(([attrName]) => attrName === name)
    },
    attrSet(name, value) {
      const index = this.attrIndex(name)
      if (index === -1) {
        this.attrs.push([name, value])
        return
      }

      this.attrs[index][1] = value
    }
  }
}

function createMarkdownItMock() {
  const pushedRules = []

  return {
    pushedRules,
    renderer: {
      rules: {
        image(tokens, idx) {
          const attrs = tokens[idx].attrs
            .map(([name, value]) => `${name}="${value}"`)
            .join(' ')
          return `<img ${attrs}>`
        }
      }
    },
    core: {
      ruler: {
        push(_name, rule) {
          pushedRules.push(rule)
        }
      }
    }
  }
}

test('adds loading lazy to img tag without loading attribute', () => {
  const result = addLazyLoadingToImageTag('<img src="/cover.png" alt="cover">')

  assert.match(result, /loading="lazy"/)
})

test('adds loading lazy to uppercase html img tag', () => {
  const result = addLazyLoadingToImageTag('<IMG src="/cover.png" alt="cover">')

  assert.match(result, /<IMG[^>]*loading="lazy"/)
})

test('keeps existing loading attribute on img tag', () => {
  const result = addLazyLoadingToImageTag('<img src="/cover.png" loading="eager">')

  assert.match(result, /loading="eager"/)
  assert.doesNotMatch(
    result,
    /loading="lazy".*loading="eager"|loading="eager".*loading="lazy"/
  )
})

test('adds loading lazy to html content img tags', () => {
  const result = addLazyLoadingToHtmlContent('<p>demo</p><img src="/cover.png">')

  assert.match(result, /<img[^>]*loading="lazy"/)
})

test('adds loading lazy for markdown image renderer output', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)

  const result = md.renderer.rules.image(
    [createImageToken([['src', '/cover.png'], ['alt', 'cover']])],
    0,
    {},
    { relativePath: 'posts/article.md' },
    {}
  )

  assert.match(result, /<img[^>]*loading="lazy"/)
})

test('does not add loading lazy outside article markdown files', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)

  const result = md.renderer.rules.image(
    [createImageToken([['src', '/cover.png'], ['alt', 'cover']])],
    0,
    {},
    { relativePath: 'about.md' },
    {}
  )

  assert.doesNotMatch(result, /loading="lazy"/)
})

test('adds loading lazy for article source file paths', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)

  const result = md.renderer.rules.image(
    [createImageToken([['src', '/cover.png'], ['alt', 'cover']])],
    0,
    {},
    { path: '/repo/pages/posts/article.md' },
    {}
  )

  assert.match(result, /loading="lazy"/)
})

test('adds loading lazy for rewritten article real paths', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)

  const result = md.renderer.rules.image(
    [createImageToken([['src', '/cover.png'], ['alt', 'cover']])],
    0,
    {},
    {
      path: '/repo/pages/article.md',
      relativePath: 'article.md',
      realPath: '/repo/pages/posts/article.md'
    },
    {}
  )

  assert.match(result, /loading="lazy"/)
})

test('adds loading lazy to html tokens only for article markdown files', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)
  const token = { type: 'html_block', content: '<IMG src="/cover.png">' }

  md.pushedRules[0]({
    env: { relativePath: 'posts/article.md' },
    tokens: [token]
  })

  assert.match(token.content, /<IMG[^>]*loading="lazy"/)
})

test('keeps html tokens unchanged outside article markdown files', () => {
  const md = createMarkdownItMock()
  applyLazyImageLoading(md)
  const token = { type: 'html_block', content: '<img src="/cover.png">' }

  md.pushedRules[0]({
    env: { relativePath: 'about.md' },
    tokens: [token]
  })

  assert.equal(token.content, '<img src="/cover.png">')
})
