import type * as hast from 'hast'
import type { RehypePlugin } from '@astrojs/markdown-remark'
import { h } from 'hastscript'

// Authors can prefix the alt text with a sentinel in square brackets to
// hint a size for the image, e.g.:
//   ![[phone] Talkgroup presets](./shot.png "Optional caption.")
// The sentinel is stripped from the rendered alt and emitted as a
// class on the <img> (matched in src/styles/global.css).
//
// Square brackets are safe inside MDX (curly braces would be parsed as
// JSX expressions and get evaluated/stripped by the MDX compiler).
const SIZE_SENTINELS = new Set(['phone', 'small'])
const SENTINEL_RE = /^\[(\w+)\]\s*/

function applyAltSentinel(el: hast.Element) {
  const alt = typeof el.properties?.alt === 'string' ? el.properties.alt : ''
  const match = alt.match(SENTINEL_RE)
  if (!match) return
  const token = match[1]
  if (!SIZE_SENTINELS.has(token)) return
  const newAlt = alt.replace(SENTINEL_RE, '')
  const className = el.properties?.className
  const existing = Array.isArray(className) ? className : className ? [className] : []
  el.properties = {
    ...el.properties,
    alt: newAlt,
    className: [...existing, `size-${token}`],
  }
}

export const rehypeTitleFigure: RehypePlugin = (_options?) => {
  function buildFigure(el: hast.Element) {
    applyAltSentinel(el)
    const title = `${el.properties?.title || ''}`
    if (!title) return el
    // Move title into a <figcaption> and strip it from the <img> so it
    // doesn't render as a hover tooltip alongside the visible caption.
    const { title: _drop, ...imgProps } = el.properties ?? {}
    const figure = h('figure', [h('img', imgProps), h('figcaption', title)])
    return figure
  }
  function isElement(content: hast.RootContent): content is hast.Element {
    return content.type === 'element'
  }
  function transformTree(node: hast.Root | hast.Element) {
    if (node.children) {
      node.children = node.children.map((child) => {
        if (isElement(child)) {
          if (child.tagName === 'img') {
            return buildFigure(child)
          } else {
            transformTree(child) // Recursively process child nodes
          }
        }
        return child
      })
    }
  }
  return function (tree: hast.Root) {
    transformTree(tree) // Start the recursive transformation
  }
}

export default rehypeTitleFigure
