import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import config from '../pages/.vitepress/config.js'

const customHomeSource = readFileSync(
  new URL('../pages/.vitepress/theme/components/CustomHome.vue', import.meta.url),
  'utf8'
)

test('homepage custom layout exposes a main landmark', () => {
  assert.match(customHomeSource, /<main class="custom-home">/)
  assert.match(customHomeSource, /<\/main>/)
})

test('theme logo uses explicit dimensions', () => {
  assert.deepEqual(config.themeConfig.logo, {
    src: '/logo.svg',
    alt: 'WorkxPlay logo',
    width: '24',
    height: '24'
  })
})

test('head includes svg favicon with ico fallback', () => {
  assert.ok(
    config.head.some(([tag, attrs]) =>
      tag === 'link' &&
      attrs.rel === 'icon' &&
      attrs.href === '/logo.svg' &&
      attrs.type === 'image/svg+xml'
    )
  )

  assert.ok(
    config.head.some(([tag, attrs]) =>
      tag === 'link' &&
      attrs.rel === 'icon' &&
      attrs.href === '/favicon.ico' &&
      attrs.sizes === 'any'
    )
  )
})

test('public logo asset exists', () => {
  assert.equal(existsSync(new URL('../pages/public/logo.svg', import.meta.url)), true)
})
