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
      return { type: 'print', html: `__theme:${escapeHtml(arg)}` }
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
