import mediumZoom, { type Zoom } from 'medium-zoom'

let zoom: Zoom | null = null

function init() {
  zoom?.detach()
  zoom = mediumZoom('article img:not([data-no-zoom])', {
    margin: 24,
    scrollOffset: 64,
    background:
      'color-mix(in oklab, var(--theme-background) 92%, var(--theme-foreground) 8%)',
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Re-init across Astro client-side navigations (no-op if not present).
document.addEventListener('astro:page-load', init)
