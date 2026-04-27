import { dispatch, type CommandContext, type Action } from './commands'

const HISTORY_KEY = 'cmdHistory'
const HISTORY_MAX = 50

function getCtx(): CommandContext {
  const el = document.getElementById('terminal-completions')
  if (!el?.textContent) return { posts: [], tags: [] }
  try {
    return JSON.parse(el.textContent)
  } catch {
    return { posts: [], tags: [] }
  }
}

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(h: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-HISTORY_MAX)))
}

function appendLine(output: HTMLElement, html: string) {
  const pre = document.createElement('div')
  pre.className = 'whitespace-pre-wrap text-foreground/80 my-1'
  pre.innerHTML = html
  output.appendChild(pre)
}

function applyAction(action: Action, output: HTMLElement) {
  switch (action.type) {
    case 'navigate':
      location.assign(action.url)
      return
    case 'clear':
      output.innerHTML = ''
      return
    case 'print': {
      if (action.html.startsWith('__theme:')) {
        const name = action.html.slice('__theme:'.length)
        document.documentElement.setAttribute('data-theme', name)
        try {
          localStorage.setItem('selectedTheme', name)
        } catch {}
        appendLine(output, `theme: ${name}`)
        return
      }
      appendLine(output, action.html)
      return
    }
    case 'noop':
      return
  }
}

function complete(input: string, ctx: CommandContext): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  const last = parts[parts.length - 1]
  let pool: string[] = []
  if (parts.length === 1) {
    pool = [
      'help', 'ls', 'cd', 'cat', 'posts', 'about', 'archive',
      'tags', 'tag', 'search', 'theme', 'clear', 'whoami',
      'github', 'mastodon', 'rss',
    ]
  } else if (['cat', 'cd'].includes(parts[0])) {
    pool = ctx.posts
  } else if (parts[0] === 'tag') {
    pool = ctx.tags
  }
  const matches = pool.filter((c) => c.startsWith(last))
  if (matches.length === 1) {
    parts[parts.length - 1] = matches[0]
    return parts.join(' ')
  }
  return null
}

export function init() {
  const input = document.getElementById('terminal-input') as HTMLInputElement | null
  const output = document.getElementById('terminal-output')
  const overlay = document.getElementById('terminal-help-overlay')
  if (!input || !output || !overlay) return

  const ctx = getCtx()
  let history = loadHistory()
  let historyIdx = history.length

  const postsEl = document.querySelector<HTMLElement>('[data-status-posts]')
  if (postsEl) postsEl.textContent = `posts: ${ctx.posts.length}`
  const themeEl = document.querySelector<HTMLElement>('[data-status-theme]')
  const indicatorEl = document.querySelector<HTMLElement>('[data-theme-indicator]')
  const updateThemeLabel = () => {
    const t = document.documentElement.getAttribute('data-theme') || ''
    if (themeEl) themeEl.textContent = `theme: ${t}`
    if (indicatorEl) indicatorEl.textContent = `[ ${t} ]`
  }
  updateThemeLabel()
  new MutationObserver(updateThemeLabel).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    const typingElsewhere =
      target &&
      target !== input &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    if (typingElsewhere) return

    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault()
      input.focus()
      return
    }
    if (e.key === 'Escape') {
      if (!overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden')
      } else if (document.activeElement === input) {
        input.blur()
      }
      return
    }
    if (e.key === '?' && document.activeElement !== input) {
      e.preventDefault()
      overlay.classList.toggle('hidden')
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden')
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const line = input.value
      if (line.trim()) {
        history = [...history, line].slice(-HISTORY_MAX)
        saveHistory(history)
        historyIdx = history.length
      }
      const action = dispatch(line, ctx)
      input.value = ''
      applyAction(action, output)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIdx > 0) {
        historyIdx--
        input.value = history[historyIdx] ?? ''
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx < history.length) {
        historyIdx++
        input.value = history[historyIdx] ?? ''
      }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const completed = complete(input.value, ctx)
      if (completed) input.value = completed
      return
    }
  })
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
