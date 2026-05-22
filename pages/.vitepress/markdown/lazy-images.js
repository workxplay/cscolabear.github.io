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
