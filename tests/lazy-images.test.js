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

test('adds loading lazy to img tag without loading attribute', () => {
  const result = addLazyLoadingToImageTag('<img src="/cover.png" alt="cover">')

  assert.match(result, /loading="lazy"/)
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
  const md = {
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
        push() {}
      }
    }
  }
  applyLazyImageLoading(md)

  const result = md.renderer.rules.image(
    [createImageToken([['src', '/cover.png'], ['alt', 'cover']])],
    0,
    {},
    {},
    {}
  )

  assert.match(result, /<img[^>]*loading="lazy"/)
})
