# Terminal/TUI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe jcalado.com so the entire site looks and behaves like a terminal/TUI application — persistent shell prompt, command-line navigation, boot sequence, TUI window chrome — without rewriting post bodies.

**Architecture:** Keep Astro + Tailwind v4. Wrap every page in a `TerminalFrame.astro` layout component. Add a tiny vanilla-JS island (`terminal.ts`) that owns the prompt input, history, tab-complete, and command dispatch. Commands live in a pure `commands.ts` module that maps name → Action (`navigate` or `print`), making them unit-testable. Boot sequence is a once-per-session island gated by `sessionStorage`.

**Tech Stack:** Astro 6, TypeScript, Tailwind v4, vanilla DOM JS. Vitest added for unit tests on `commands.ts`.

**Spec:** `docs/superpowers/specs/2026-04-27-terminal-redesign-design.md`

---

## File Structure

**New files:**
- `src/scripts/commands.ts` — pure command registry + Levenshtein helper
- `src/scripts/commands.test.ts` — vitest unit tests
- `src/scripts/terminal.ts` — DOM client island for prompt
- `src/scripts/boot.ts` — DOM client island for boot sequence
- `src/components/TerminalFrame.astro` — window chrome, prompt row, status line, `?` overlay
- `src/components/AsciiBanner.astro` — `jcalado` figlet block
- `src/components/BootSequence.astro` — boot animation host
- `vitest.config.ts` — vitest config

**Modified files:**
- `package.json` — add `vitest`, `test` script
- `src/site.config.ts` — default theme → `vitesse-black`
- `src/layouts/Layout.astro` — wrap children in `TerminalFrame`, mount islands
- `src/components/Header.astro` — collapse into prompt row
- `src/components/HomeBanner.astro` — motd block + ASCII banner
- `src/components/PostPreview.astro` — `ls -la` row look
- `src/components/Tags.astro` — `--tag=foo` style
- `src/pages/404.astro` — bash-style not-found
- `src/pages/about.md` — prepend `$ cat about.md` line
- `src/styles/global.css` — sharp chrome, bracket buttons

---

## Task 1: Add vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest as a dev dependency**

Run:
```bash
yarn add -D vitest@^2.1.0
```

- [ ] **Step 2: Add test script to package.json**

Edit `package.json` `scripts` block to include:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': new URL('./src', import.meta.url).pathname,
    },
  },
})
```

- [ ] **Step 4: Verify vitest runs (no tests yet — should report 0 passed)**

Run: `yarn test`
Expected: exits 0 with "No test files found" or "0 passed". (vitest 2.x exits 0 when no files match.)

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock vitest.config.ts
git commit -m "chore: add vitest for unit tests"
```

---

## Task 2: Levenshtein helper (TDD)

**Files:**
- Create: `src/scripts/commands.ts`
- Create: `src/scripts/commands.test.ts`

- [ ] **Step 1: Write failing test for levenshtein**

Create `src/scripts/commands.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { levenshtein, suggest } from './commands'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('cat', 'cat')).toBe(0)
  })
  it('returns 1 for single substitution', () => {
    expect(levenshtein('cat', 'bat')).toBe(1)
  })
  it('returns 3 for entirely different short words', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3)
  })
})

describe('suggest', () => {
  it('returns nearest candidate within threshold', () => {
    expect(suggest('pots', ['posts', 'about', 'tags'])).toBe('posts')
  })
  it('returns undefined when nothing is close', () => {
    expect(suggest('zzzz', ['posts', 'about'])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test`
Expected: FAIL — "Cannot find module './commands'".

- [ ] **Step 3: Implement minimal commands.ts**

Create `src/scripts/commands.ts`:
```ts
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }
  return dp[m][n]
}

export function suggest(input: string, candidates: string[], maxDistance = 2): string | undefined {
  let best: string | undefined
  let bestScore = Infinity
  for (const c of candidates) {
    const d = levenshtein(input, c)
    if (d < bestScore) { bestScore = d; best = c }
  }
  return bestScore <= maxDistance ? best : undefined
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/commands.ts src/scripts/commands.test.ts
git commit -m "feat(terminal): add levenshtein + suggest helpers"
```

---

## Task 3: Command Action types and dispatch

**Files:**
- Modify: `src/scripts/commands.ts`
- Modify: `src/scripts/commands.test.ts`

- [ ] **Step 1: Append failing tests for dispatch**

Append to `src/scripts/commands.test.ts`:
```ts
import { dispatch } from './commands'

const ctx = { posts: ['voxlink', 'ulanzi-d200'], tags: ['radio', 'dev'] }

describe('dispatch', () => {
  it('navigates for `posts`', () => {
    expect(dispatch('posts', ctx)).toEqual({ type: 'navigate', url: '/posts' })
  })
  it('navigates for `about`', () => {
    expect(dispatch('about', ctx)).toEqual({ type: 'navigate', url: '/about' })
  })
  it('navigates for `cd /posts`', () => {
    expect(dispatch('cd /posts', ctx)).toEqual({ type: 'navigate', url: '/posts' })
  })
  it('navigates for `cd posts/voxlink`', () => {
    expect(dispatch('cd posts/voxlink', ctx)).toEqual({ type: 'navigate', url: '/posts/voxlink' })
  })
  it('navigates home for `cd ~` and `cd /`', () => {
    expect(dispatch('cd ~', ctx)).toEqual({ type: 'navigate', url: '/' })
    expect(dispatch('cd /', ctx)).toEqual({ type: 'navigate', url: '/' })
  })
  it('cat <slug> navigates to the post', () => {
    expect(dispatch('cat voxlink', ctx)).toEqual({ type: 'navigate', url: '/posts/voxlink' })
  })
  it('tag <name> navigates to /tags/<name>', () => {
    expect(dispatch('tag radio', ctx)).toEqual({ type: 'navigate', url: '/tags/radio' })
  })
  it('whoami prints visitor', () => {
    const r = dispatch('whoami', ctx)
    expect(r.type).toBe('print')
    if (r.type === 'print') expect(r.html).toContain('visitor')
  })
  it('unknown command suggests nearest', () => {
    const r = dispatch('postss', ctx)
    expect(r.type).toBe('print')
    if (r.type === 'print') {
      expect(r.html).toContain('command not found')
      expect(r.html).toContain('posts')
    }
  })
  it('clear returns a clear action', () => {
    expect(dispatch('clear', ctx)).toEqual({ type: 'clear' })
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn test`
Expected: FAIL — `dispatch` not exported.

- [ ] **Step 3: Implement dispatch + Action types**

Append to `src/scripts/commands.ts`:
```ts
export type Action =
  | { type: 'navigate'; url: string }
  | { type: 'print'; html: string }
  | { type: 'clear' }
  | { type: 'noop' }

export interface CommandContext {
  posts: string[]
  tags: string[]
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const COMMAND_NAMES = [
  'help', 'ls', 'cd', 'cat', 'posts', 'about', 'archive',
  'tags', 'tag', 'search', 'theme', 'clear', 'whoami',
  'github', 'mastodon', 'rss',
]

const SOCIAL_URLS: Record<string, string> = {
  github: 'https://github.com/jcalado',
  mastodon: 'https://masto.pt/@jcalado',
  rss: '/rss.xml',
}

export function dispatch(line: string, ctx: CommandContext): Action {
  const trimmed = line.trim()
  if (!trimmed) return { type: 'noop' }
  const [cmd, ...rest] = trimmed.split(/\s+/)
  const arg = rest.join(' ')

  switch (cmd) {
    case 'help':
      return { type: 'print', html: helpHtml() }
    case 'ls':
    case 'posts':
    case 'archive':
      return { type: 'navigate', url: '/posts' }
    case 'about':
      return { type: 'navigate', url: '/about' }
    case 'tags':
      return { type: 'navigate', url: '/tags' }
    case 'tag':
      if (!arg) return { type: 'print', html: 'tag: missing operand' }
      return { type: 'navigate', url: `/tags/${encodeURIComponent(arg)}` }
    case 'cd':
      return cdAction(arg)
    case 'cat':
      if (!arg) return { type: 'print', html: 'cat: missing operand' }
      if (!ctx.posts.includes(arg)) {
        const s = suggest(arg, ctx.posts)
        return { type: 'print', html:
          `cat: ${escapeHtml(arg)}: No such file or directory` +
          (s ? `<br>did you mean: <a href="/posts/${s}">${s}</a>?` : '') }
      }
      return { type: 'navigate', url: `/posts/${arg}` }
    case 'search':
      return { type: 'navigate', url: `/?q=${encodeURIComponent(arg)}#search` }
    case 'theme':
      if (!arg) return { type: 'print', html: 'theme: missing operand' }
      return { type: 'print', html: `__theme:${escapeHtml(arg)}` } // sentinel handled by terminal.ts
    case 'clear':
      return { type: 'clear' }
    case 'whoami':
      return { type: 'print', html: 'visitor' }
    case 'github':
    case 'mastodon':
    case 'rss':
      return { type: 'navigate', url: SOCIAL_URLS[cmd] }
    default: {
      const s = suggest(cmd, COMMAND_NAMES)
      return { type: 'print', html:
        `bash: ${escapeHtml(cmd)}: command not found` +
        (s ? `<br>did you mean: <code>${s}</code>?` : '') }
    }
  }
}

function cdAction(arg: string): Action {
  if (!arg || arg === '~' || arg === '/') return { type: 'navigate', url: '/' }
  if (arg === '..') return { type: 'navigate', url: '/' }
  const stripped = arg.replace(/^\/+/, '').replace(/\/+$/, '')
  return { type: 'navigate', url: '/' + stripped }
}

function helpHtml(): string {
  return [
    'Available commands:',
    '  ls, posts            list posts',
    '  cat &lt;slug&gt;          open a post',
    '  cd &lt;path&gt;            navigate (e.g. cd /posts, cd ~)',
    '  about                about page',
    '  tags                 list tags',
    '  tag &lt;name&gt;           filter by tag',
    '  search &lt;q&gt;           open search',
    '  theme &lt;name&gt;         switch theme',
    '  github / mastodon / rss',
    '  whoami / clear / help',
    '',
    'Keys: / focus prompt   Esc blur   ? toggle help   ↑/↓ history   Tab complete',
  ].join('<br>')
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test`
Expected: all 16 passed.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/commands.ts src/scripts/commands.test.ts
git commit -m "feat(terminal): command dispatcher with help/cd/cat/theme/social"
```

---

## Task 4: Switch default theme

**Files:**
- Modify: `src/site.config.ts:55`

- [ ] **Step 1: Change default theme**

Edit line 55 of `src/site.config.ts`:
- Old: `default: 'catppuccin-mocha',`
- New: `default: 'vitesse-black',`

Verify `'vitesse-black'` is already present in the `include` array (it is, line 122).

- [ ] **Step 2: Verify build passes**

Run: `yarn build`
Expected: build succeeds, no theme warnings in output.

- [ ] **Step 3: Commit**

```bash
git add src/site.config.ts
git commit -m "feat: default theme vitesse-black for terminal aesthetic"
```

---

## Task 5: TerminalFrame component (markup only, no behavior)

**Files:**
- Create: `src/components/TerminalFrame.astro`

- [ ] **Step 1: Create TerminalFrame.astro**

```astro
---
interface Props {
  path: string
}
const { path } = Astro.props
const displayPath = path === '/' ? '~' : `~${path}`
---

<div class="terminal-frame border border-accent/40 bg-background flex flex-col min-h-screen">
  <div class="terminal-titlebar flex items-center gap-2 border-b border-accent/30 px-3 py-1.5 text-xs">
    <span class="flex gap-1.5">
      <span class="size-2.5 rounded-full bg-red/70"></span>
      <span class="size-2.5 rounded-full bg-yellow/70"></span>
      <span class="size-2.5 rounded-full bg-green/70"></span>
    </span>
    <span class="flex-1 text-center text-foreground/70 truncate">
      visitor@jcalado: {displayPath}
    </span>
    <span class="text-foreground/50" data-theme-indicator></span>
  </div>

  <div class="terminal-prompt-row sticky top-0 z-10 bg-background border-b border-accent/20 px-3 py-1 flex items-center gap-2 text-sm">
    <span class="text-green shrink-0">visitor@jcalado</span>
    <span class="text-foreground/60 shrink-0">:</span>
    <span class="text-blue shrink-0" data-prompt-path>{displayPath}</span>
    <span class="text-foreground/60 shrink-0">$</span>
    <input
      id="terminal-input"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-foreground/30"
      placeholder="type `help`"
      aria-label="Terminal command input"
    />
  </div>

  <main class="terminal-body flex-1 px-3 py-4">
    <div id="terminal-output" class="font-mono text-sm"></div>
    <slot />
  </main>

  <div class="terminal-statusline border-t border-accent/30 px-3 py-1 text-xs flex items-center gap-4 text-foreground/60">
    <span>[NORMAL]</span>
    <span data-status-posts></span>
    <span data-status-theme></span>
    <span class="ml-auto"><kbd>?</kbd> help</span>
  </div>

  <div
    id="terminal-help-overlay"
    class="hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
  >
    <div class="border border-accent/60 bg-background p-6 max-w-md font-mono text-sm">
      <h2 class="text-accent mb-3 font-semibold">Keybindings</h2>
      <ul class="space-y-1">
        <li><kbd>/</kbd> &mdash; focus prompt</li>
        <li><kbd>Esc</kbd> &mdash; blur prompt / close this</li>
        <li><kbd>?</kbd> &mdash; toggle this overlay</li>
        <li><kbd>↑</kbd> / <kbd>↓</kbd> &mdash; cycle history</li>
        <li><kbd>Tab</kbd> &mdash; complete command or slug</li>
        <li><kbd>Enter</kbd> &mdash; run</li>
      </ul>
      <p class="mt-4 text-foreground/60">Type <code>help</code> for commands.</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TerminalFrame.astro
git commit -m "feat(terminal): TerminalFrame component shell"
```

---

## Task 6: Wire TerminalFrame into Layout

**Files:**
- Modify: `src/layouts/Layout.astro:157-167`

- [ ] **Step 1: Replace body content**

Replace the body block (lines 157-167) with:
```astro
  <body class="w-full m-0 bg-background text-foreground">
    <TerminalFrame path={Astro.url.pathname}>
      <div class="max-w-3xl mx-auto w-full">
        <Header />
        <div class="py-4">
          <slot />
        </div>
        <Footer />
      </div>
    </TerminalFrame>
  </body>
```

- [ ] **Step 2: Add import at top of frontmatter**

Add to imports block near line 3:
```ts
import TerminalFrame from '~/components/TerminalFrame.astro'
```

- [ ] **Step 3: Verify build**

Run: `yarn build`
Expected: build succeeds.

- [ ] **Step 4: Spot-check dev**

Run: `yarn dev` then open `http://localhost:4321`. Verify the window-chrome titlebar, prompt row with input, and status line are present.

Stop the dev server (Ctrl-C) when done.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(terminal): wrap site in TerminalFrame"
```

---

## Task 7: Generate completions JSON at build time

**Files:**
- Create: `src/components/CompletionsData.astro`
- Modify: `src/components/TerminalFrame.astro`

- [ ] **Step 1: Create CompletionsData.astro**

```astro
---
import { getCollection } from 'astro:content'
const posts = await getCollection('posts')
const tags = [...new Set(posts.flatMap((p) => p.data.tags ?? []))]
const data = {
  posts: posts.map((p) => p.id),
  tags,
}
---
<script id="terminal-completions" type="application/json" set:html={JSON.stringify(data)}></script>
```

- [ ] **Step 2: Mount inside TerminalFrame**

In `src/components/TerminalFrame.astro`, add to the frontmatter imports:
```ts
import CompletionsData from '~/components/CompletionsData.astro'
```
And render `<CompletionsData />` just inside the outer `<div class="terminal-frame ...">` (before the titlebar).

- [ ] **Step 3: Verify build emits the script tag**

Run: `yarn build && grep -l terminal-completions dist/index.html`
Expected: `dist/index.html` is listed.

- [ ] **Step 4: Commit**

```bash
git add src/components/CompletionsData.astro src/components/TerminalFrame.astro
git commit -m "feat(terminal): emit posts/tags completion data at build time"
```

---

## Task 8: Terminal client island

**Files:**
- Create: `src/scripts/terminal.ts`
- Modify: `src/components/TerminalFrame.astro`

- [ ] **Step 1: Create terminal.ts**

```ts
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
        try { localStorage.setItem('selectedTheme', name) } catch {}
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

function appendLine(output: HTMLElement, html: string) {
  const pre = document.createElement('div')
  pre.className = 'whitespace-pre-wrap text-foreground/80 my-1'
  pre.innerHTML = html
  output.appendChild(pre)
}

function complete(input: string, ctx: CommandContext): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  const last = parts[parts.length - 1]
  let pool: string[] = []
  if (parts.length === 1) {
    pool = ['help','ls','cd','cat','posts','about','archive','tags','tag','search','theme','clear','whoami','github','mastodon','rss']
  } else if (['cat','cd'].includes(parts[0])) {
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

  // Status line
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
    attributes: true, attributeFilter: ['data-theme'],
  })

  // Global key handlers
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    const typingElsewhere = target && target !== input &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
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
```

- [ ] **Step 2: Mount the script in TerminalFrame**

In `src/components/TerminalFrame.astro`, append at the bottom of the file:
```astro
<script>
  import '~/scripts/terminal'
</script>
```

- [ ] **Step 3: Run tests, build, and smoke-test dev**

Run: `yarn test && yarn build`
Expected: tests pass, build succeeds.

Then `yarn dev`. Verify:
- typing `posts` + Enter navigates to `/posts`.
- typing `theme dracula` + Enter switches the theme; reload — theme persists.
- `/` focuses the prompt; `Esc` blurs.
- `?` toggles the overlay.
- ↑/↓ cycles history.
- Tab completes `pos` → `posts`.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/terminal.ts src/components/TerminalFrame.astro
git commit -m "feat(terminal): client island with prompt, history, tab-complete, ?-overlay"
```

---

## Task 9: Boot sequence

**Files:**
- Create: `src/scripts/boot.ts`
- Create: `src/components/BootSequence.astro`
- Modify: `src/components/TerminalFrame.astro`

- [ ] **Step 1: Create boot.ts**

```ts
const LINES = [
  '[    0.000000] Linux version 6.19 (jcalado@blog) 2026',
  '[    0.001234] BIOS-provided physical RAM map:',
  '[    0.002001] tty: ttyJC0 at 0x3f8 (irq = 4)',
  '[    0.003812] Loading posts...',
  '[    0.004900] Mounting /home/visitor',
  '[    0.005400] systemd[1]: Started jcalado.com',
  'jcalado.com login: visitor',
  'Last login: just now on tty1',
]

export function runBoot() {
  if (typeof sessionStorage === 'undefined') return
  if (sessionStorage.getItem('booted')) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sessionStorage.setItem('booted', '1')
    return
  }

  const overlay = document.getElementById('boot-overlay')
  const out = document.getElementById('boot-output')
  if (!overlay || !out) return

  overlay.classList.remove('hidden')
  sessionStorage.setItem('booted', '1')

  let i = 0
  let cancelled = false
  const tick = () => {
    if (cancelled || i >= LINES.length) return finish()
    const line = document.createElement('div')
    line.textContent = LINES[i++]
    out.appendChild(line)
    setTimeout(tick, 160)
  }
  const finish = () => {
    overlay.classList.add('opacity-0')
    setTimeout(() => overlay.classList.add('hidden'), 200)
  }
  const skip = () => { cancelled = true; finish() }
  document.addEventListener('keydown', skip, { once: true })
  document.addEventListener('click', skip, { once: true })
  tick()
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot)
  } else {
    runBoot()
  }
}
```

- [ ] **Step 2: Create BootSequence.astro**

```astro
<div
  id="boot-overlay"
  class="hidden fixed inset-0 z-[100] bg-background text-green font-mono text-sm p-6 transition-opacity duration-200 overflow-hidden"
>
  <div id="boot-output" class="space-y-0.5"></div>
  <div class="mt-4 text-foreground/40 text-xs">press any key to skip</div>
</div>

<script>
  import '~/scripts/boot'
</script>
```

- [ ] **Step 3: Mount in TerminalFrame**

In `src/components/TerminalFrame.astro` frontmatter add:
```ts
import BootSequence from '~/components/BootSequence.astro'
```
Then render `<BootSequence />` immediately after `<CompletionsData />`.

- [ ] **Step 4: Smoke test**

Run: `yarn dev`. Open in private window. Verify:
- Boot lines appear once, then disappear (~1.5s total).
- Reload — boot does NOT replay (sessionStorage gate).
- New private window — replays.
- Pressing a key during boot skips it.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/boot.ts src/components/BootSequence.astro src/components/TerminalFrame.astro
git commit -m "feat(terminal): once-per-session skippable boot sequence"
```

---

## Task 10: ASCII banner + motd home

**Files:**
- Create: `src/components/AsciiBanner.astro`
- Modify: `src/components/HomeBanner.astro`

- [ ] **Step 1: Create AsciiBanner.astro**

```astro
---
const banner = String.raw`
   _            _           _
  (_) ___ __ _ | | __ _  __| | ___
  | |/ __/ _\` || |/ _\` |/ _\` |/ _ \
  | | (_| (_| || | (_| | (_| | (_) |
 _/ |\___\__,_||_|\__,_|\__,_|\___/
|__/
`.trim()
---
<pre class="text-accent font-mono text-xs sm:text-sm leading-tight overflow-x-auto select-none">{banner}</pre>
```

- [ ] **Step 2: Rewrite HomeBanner.astro to motd**

Replace the entire file with:
```astro
---
import AsciiBanner from '~/components/AsciiBanner.astro'
import GitHubActivityCalendar from '~/components/GitHubActivityCalendar.astro'

interface Props {
  githubCalendar?: string
}
const { githubCalendar } = Astro.props
const today = new Date().toUTCString()
---

<section class="my-4">
  <AsciiBanner />
  <pre class="text-foreground/60 text-xs sm:text-sm whitespace-pre-wrap mt-3">
Last login: {today} on tty1
Welcome to jcalado.com — pushing code, ham radio, side projects.

Type `help` for commands, `posts` to browse, `about` for more.
</pre>
  <div class="prose mt-6">
    <slot />
  </div>
  {githubCalendar && <div class="mt-6"><GitHubActivityCalendar username={githubCalendar} /></div>}
</section>
```

- [ ] **Step 3: Verify home page renders**

Run: `yarn dev`, open `/`, verify banner + motd block + existing prose intro all show. The `avatarImage` prop is now ignored (intentional — motd replaces it).

- [ ] **Step 4: Commit**

```bash
git add src/components/AsciiBanner.astro src/components/HomeBanner.astro
git commit -m "feat(terminal): motd home banner with ascii art"
```

---

## Task 11: ls -la post list rows

**Files:**
- Modify: `src/components/PostPreview.astro`

- [ ] **Step 1: Replace component body**

Replace `src/components/PostPreview.astro` with:
```astro
---
import type { CollectionEntry } from 'astro:content'
import { render } from 'astro:content'
import { format } from 'date-fns'

interface Props {
  post: CollectionEntry<'posts'>
}
const { post } = Astro.props
const { remarkPluginFrontmatter } = await render(post)
const description = remarkPluginFrontmatter.description || post.data.description
const words = remarkPluginFrontmatter.words ?? 0
const sizeKb = Math.max(1, Math.round((words * 6) / 102.4) / 10)
const sizeStr = `${sizeKb.toFixed(1)}K`.padStart(6, ' ')
const date = post.data.date ? format(post.data.date, 'MMM dd') : '      '
const link = `/posts/${post.id}`
---

<a href={link} class="block font-mono text-sm py-2 hover:bg-accent/10 -mx-2 px-2 no-underline">
  <span class="text-foreground/50">-rw-r--r--</span>
  <span class="text-foreground/40 mx-2">1 jcalado users</span>
  <span class="text-yellow">{sizeStr}</span>
  <span class="text-foreground/60 mx-2">{date}</span>
  <span class="text-link font-semibold">{post.id}.md</span>
  {description && (
    <div class="text-foreground/70 mt-1 ml-[14ch] text-xs">{description}</div>
  )}
</a>
```

- [ ] **Step 2: Verify dev**

Run: `yarn dev`. Open `/posts`. Verify each post is a single ls-style row, hover highlights, click navigates.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostPreview.astro
git commit -m "feat(terminal): post list rendered as ls -la rows"
```

---

## Task 12: Tag rendering as flags

**Files:**
- Modify: `src/components/Tags.astro`

- [ ] **Step 1: Read existing Tags.astro and replace its rendered output**

Run: `cat src/components/Tags.astro` to confirm structure, then update the component so each tag renders as `--tag=<name>`. The existing iteration logic stays; only the per-tag link template changes. For each tag, render:
```astro
<a href={`/tags/${tag.id}`} class="text-magenta hover:underline mr-3 font-mono text-sm">
  --tag={tag.id}
</a>
```
Wrap them in a flex/inline container (use existing wrapper if there is one).

If the component currently uses pill/button styling classes, remove those classes; do not introduce new ones beyond what is shown above.

- [ ] **Step 2: Verify dev**

Open a post page in `yarn dev` and confirm tags render as `--tag=foo`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Tags.astro
git commit -m "feat(terminal): tags render as --tag=name flags"
```

---

## Task 13: 404 page

**Files:**
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Replace 404.astro content**

Replace with:
```astro
---
import Layout from '~/layouts/Layout.astro'
const path = Astro.url.pathname
const knownTopLevel = ['posts', 'about', 'tags']
function suggest(p: string): string | undefined {
  const stripped = p.replace(/^\/+/, '').split('/')[0]
  if (!stripped) return
  let best: string | undefined
  let bestScore = Infinity
  for (const k of knownTopLevel) {
    const d = lev(stripped, k)
    if (d < bestScore) { bestScore = d; best = k }
  }
  return bestScore <= 2 ? best : undefined
}
function lev(a: string, b: string): number {
  const m=a.length,n=b.length
  const dp:number[][]=Array.from({length:m+1},()=>new Array(n+1).fill(0))
  for(let i=0;i<=m;i++)dp[i][0]=i
  for(let j=0;j<=n;j++)dp[0][j]=j
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    const c=a[i-1]===b[j-1]?0:1
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c)
  }
  return dp[m][n]
}
const s = suggest(path)
---
<Layout title="404">
  <pre class="font-mono text-sm whitespace-pre-wrap my-8">
$ cat {path}
bash: {path}: No such file or directory
{s ? `did you mean: /${s}?` : ''}

$ exit 1
</pre>
  {s && <a class="text-link underline" href={`/${s}`}>cd /{s}</a>}
</Layout>
```

- [ ] **Step 2: Smoke test**

Run: `yarn dev`. Hit `http://localhost:4321/postss`. Verify the 404 prints the bash error and suggests `/posts`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat(terminal): bash-style 404 with did-you-mean"
```

---

## Task 14: About page header

**Files:**
- Modify: `src/pages/about.md`

- [ ] **Step 1: Prepend a cat header line**

Read the current `about.md`. Insert this as the very first content line under the existing frontmatter (do not modify frontmatter):
```markdown
```text
$ cat about.md
```
```
(That is a fenced `text` block containing one line.)

- [ ] **Step 2: Verify**

Run: `yarn dev`, open `/about`. Confirm the `$ cat about.md` line shows above existing content.

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.md
git commit -m "feat(terminal): add cat header to about page"
```

---

## Task 15: Header collapse + bracket buttons

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Slim the Header**

Replace the visible top bar block (the `<div class="relative flex items-center justify-between bg-accent/10 rounded-xl">`) so the logo is plain text and the rounded background is removed:

```astro
<header class="flex items-center justify-between mb-4 text-sm font-mono">
  <a id="logo" href="/" class="text-accent font-bold no-underline">{siteConfig.title}</a>
  <div class="flex items-center gap-3">
    <Search trailingSlashes={siteConfig.trailingSlashes} />
    {lightDarkAutoTheme && <LightDarkAutoButton />}
    {selectTheme && <SelectTheme />}
  </div>
</header>
<nav class="hidden sm:flex gap-3 mb-6 text-sm font-mono text-foreground/60">
  {siteConfig.navLinks.map((link) => (
    <a href={link.url} class="hover:text-accent no-underline">[{link.name.toLowerCase()}]</a>
  ))}
</nav>
```

Remove the mobile `<nav id="nav-mobile">` block and its associated `<script>` at the bottom of the file (no longer needed — the prompt is the mobile nav).

- [ ] **Step 2: Sharpen chrome in global.css**

In `src/styles/global.css`, change line 96 (`a.button` rule). Replace:
```css
a.button {
  @apply inline-flex text-accent border-3 border-accent/30 border-double py-1.5 px-3 whitespace-nowrap hover:bg-accent/8 rounded-xl transition-colors;
}
```
With:
```css
a.button {
  @apply inline-flex text-accent py-1 px-2 whitespace-nowrap hover:bg-accent/10 transition-colors;
}
a.button::before { content: '['; @apply mr-1 text-accent/60; }
a.button::after  { content: ']'; @apply ml-1 text-accent/60; }
```

- [ ] **Step 3: Smoke test**

Run: `yarn dev`. Verify header is sparse, nav shows `[home] [about] [archive] [github]`, mobile width still works (the prompt is always visible).

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/styles/global.css
git commit -m "feat(terminal): slim header, bracket buttons"
```

---

## Task 16: Full smoke pass

**Files:** none

- [ ] **Step 1: Run unit tests**

Run: `yarn test`
Expected: all tests pass.

- [ ] **Step 2: Run build**

Run: `yarn build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manual smoke checklist (`yarn dev`)**

Walk through each of these. Tick only after personally verifying:
- [ ] Boot sequence plays once per session, skippable on key.
- [ ] `/` focuses prompt; `Esc` blurs.
- [ ] `?` toggles help overlay; clicking outside the panel closes it.
- [ ] `posts`, `about`, `tags`, `github`, `mastodon`, `rss` all navigate.
- [ ] `cat <real-slug>` navigates; `cat zzzzz` prints error with suggestion.
- [ ] `theme dracula` switches and persists across reload.
- [ ] `theme catppuccin-mocha` works (sanity: original default still selectable).
- [ ] ↑/↓ cycle history; Tab completes `pos` → `posts`.
- [ ] `clear` empties transient output region.
- [ ] `/postss` shows bash-style 404 with suggestion.
- [ ] Mobile width (DevTools, 375px): prompt usable, no horizontal scroll on body.
- [ ] JS disabled (DevTools): regular links still navigate; `<noscript>`-free state is graceful.
- [ ] `prefers-reduced-motion: reduce` (DevTools emulate): boot does not animate.

- [ ] **Step 4: Commit any small fixups discovered during smoke pass**

If issues found, fix them and commit per usual.

```bash
git add -p
git commit -m "fix(terminal): smoke-test fixups"
```

---

## Self-review notes

- Spec coverage: every section of the spec maps to a task — vitest setup (T1), commands+dispatch (T2-T3), default theme (T4), TerminalFrame (T5-T6), completions (T7), terminal island (T8), boot (T9), motd home (T10), ls rows (T11), tags (T12), 404 (T13), about header (T14), header/global.css (T15), smoke (T16).
- All `levenshtein`, `suggest`, `dispatch`, `Action`, and `CommandContext` names are consistent across tasks.
- No TBDs or "implement later" placeholders.
- `clear` action is handled in `applyAction` and tested in T3.
- `theme` uses a sentinel string (`__theme:<name>`) printed to output then intercepted in `applyAction`; this keeps `commands.ts` pure (no DOM access) while allowing the side effect.
