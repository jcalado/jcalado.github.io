# Terminal/TUI Redesign — Design Spec

**Date:** 2026-04-27
**Owner:** Joel Calado
**Site:** jcalado.com (Astro + Tailwind v4, JetBrains Mono)

## Goal

Reframe the entire site as if it IS a terminal. Heavy commitment to the bit:
persistent fake shell prompt, command-line navigation, boot sequence on first
visit, TUI window chrome around every page. Existing post content stays
untouched; only page chrome and listings get reframed.

## Decisions (locked during brainstorming)

- **Aesthetic:** terminal/TUI (not BBS/cyberpunk/CLI-cues).
- **Commitment level:** heavy — site IS a terminal.
- **Boot sequence:** short (~1.5s), skippable, once per session.
- **Navigation:** hybrid — regular links work everywhere, plus an always-on
  command line. `/` focuses, `Esc` blurs.
- **Default theme:** switch from `catppuccin-mocha` to `vitesse-black`. All
  existing themes remain available via `theme <name>`.
- **Content reframing:** light — chrome/listings reframed, post bodies and
  About copy untouched.
- **Keybindings cheatsheet:** `?` overlay.

## Architecture

Astro stays. No SPA. The "terminal" is a layout + small client island.

- `Layout.astro` wraps every page in a terminal frame.
- `terminal.ts` is a vanilla-JS island (~150 LOC): prompt input, history,
  tab-complete, key handling, command dispatch.
- `commands.ts` is a pure map: `name -> (args, ctx) => Action`, where
  `Action` is `{type: 'navigate', url}` or `{type: 'print', html}`.
  Pure-function design enables unit tests.
- `BootSequence.astro` + tiny client script: renders fake `dmesg` lines on
  first visit, gated by `sessionStorage.booted`.

### Terminal frame structure

```
┌─ visitor@jcalado: ~/posts ─────────────── [ vitesse-black ▾ ] ─┐
│ visitor@jcalado:~/posts $ _                                    │
│                                                                │
│ <page content rendered as command output>                      │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [NORMAL]  posts: 23   theme: vitesse-black   ? help            │
└────────────────────────────────────────────────────────────────┘
```

- Top bar: title shows fake user@host plus current path; theme indicator.
- Prompt row sits sticky at top of body; reflects current path.
- Body: page content.
- Status line at bottom of viewport.

## File changes

### New files

- `src/components/TerminalFrame.astro` — window chrome, prompt row, status
  line, `?` overlay markup.
- `src/components/BootSequence.astro` (+ inline client script) — once-per-session
  boot animation, skippable on keypress/click.
- `src/components/AsciiBanner.astro` — figlet-style `jcalado` block, home only.
- `src/scripts/terminal.ts` — prompt input, history (↑/↓), tab-complete (Tab),
  key bindings (`/`, `Esc`, `?`), dispatch loop.
- `src/scripts/commands.ts` — command registry and Levenshtein helper.
- `src/scripts/commands.test.ts` — vitest unit tests.

### Modified files

- `src/layouts/Layout.astro` — wrap children in `TerminalFrame`, mount
  terminal island, mount boot sequence.
- `src/components/Header.astro` — collapse into prompt row; nav links live in
  the `?` overlay as `cd` shortcuts. Keep mobile menu listing same commands.
- `src/components/HomeBanner.astro` — replace card layout with `motd` block:
  ASCII banner + `Last login:` line + "available commands" hint.
- `src/components/PostPreview.astro` and post-list page — render each row as
  `-rw-r--r-- 1 jcalado users 4.2K Apr 12 voxlink-companion.md`. Whole row is
  a link.
- `src/components/Tags.astro` — render tags as `--tag=foo --tag=bar`.
- `src/pages/404.astro` — `bash: <path>: No such file or directory` plus a
  did-you-mean suggestion (Levenshtein over known paths).
- `src/pages/about.*` — prepend a `$ cat about.md` line above existing content.
- `src/site.config.ts` — `themes.default` → `'vitesse-black'`.
- `src/styles/global.css` — drop `rounded-xl` on terminal chrome (sharp
  corners), thin 1px accent borders, replace double-border buttons with
  bracket-style `[ button ]`.

## Commands

| Command | Behavior |
|---|---|
| `help` | Print command list and key bindings. |
| `ls` | List contents of current path (posts in `/posts`, etc.). |
| `cd <path>` | Navigate. Accepts `/`, `..`, `~`, `posts`, `posts/<slug>`. |
| `cat <slug>` | Navigate to post by slug. |
| `posts` | Alias for `cd /posts`. |
| `about` | Alias for `cd /about`. |
| `archive` | Alias for `cd /posts`. |
| `tags` | List all tags. |
| `tag <name>` | Filter posts by tag. |
| `search <q>` | Open search dialog with prefilled query. |
| `theme <name>` | Switch theme; persists via existing theme system. |
| `clear` | Clear transient output region. |
| `whoami` | Print `visitor`. |
| `github`, `mastodon`, `rss` | Open corresponding social link. |
| _unknown_ | `bash: <cmd>: command not found` + suggestion. |

Tab-complete sources: command names + post slugs + tag names. Slugs and tags
emitted at build time as a JSON `<script id="completions" type="application/json">`.

## Data flow

```
keypress
  └─ terminal.ts captures
       └─ parse line
            └─ commands.ts dispatch
                 ├─ {type:'navigate', url} → location.assign(url)
                 └─ {type:'print', html}  → append <pre> in transient output
```

History persists in `localStorage.cmdHistory` (capped 50 entries).

## Error handling

- Unknown command: `bash: <cmd>: command not found` + nearest match via
  Levenshtein.
- Unknown path in `cd`: `cd: no such file or directory: <path>`.
- JS disabled: prompt `<input>` is `disabled`; `<noscript>` note explains.
  All navigation still works via the existing `<a>` tags rendered in the page
  body. Boot sequence is JS-only and simply does not appear.
- Reduced motion: boot sequence collapses to a single line, no typing
  animation. Respects `prefers-reduced-motion`.
- Mobile: prompt is still rendered and tappable; on small screens the status
  line collapses to just `? help`.

## Testing

- **Unit (vitest):**
  - Every command returns the expected Action.
  - Unknown command yields a not-found Action with a suggestion.
  - Levenshtein helper correctness on a small fixture.
- **Manual smoke checklist:**
  - Boot plays once per session, skippable.
  - `/` focuses prompt; `Esc` blurs; `?` toggles overlay.
  - ↑/↓ cycle history; Tab completes a known post slug.
  - `theme dracula` switches and persists across reload.
  - JS disabled: links still navigate; no broken layout.
  - Mobile (≤480px): prompt usable, no horizontal scroll.
  - 404 page suggests a near match for a typo.
- No e2e framework added; vitest + checklist suffice for a personal blog.

## Out of scope

- Rewriting post bodies or About copy.
- A real in-browser shell (no `pipe`, no `grep`, no actual filesystem).
- A custom phosphor theme (vitesse-black is the new default; phosphor can be
  added later if desired).
- SPA-style transitions beyond what Astro view-transitions already provide.

## Build sequence (high-level)

1. Add `terminal.ts` + `commands.ts` + tests; verify dispatch in isolation.
2. Add `TerminalFrame.astro`; mount in `Layout.astro` behind a feature check.
3. Switch default theme to `vitesse-black`; tune global.css for sharp chrome.
4. Reframe `HomeBanner`, post list rows, tags, 404, about header.
5. Add `BootSequence` last (cosmetic; safest to ship behind sessionStorage gate).
6. Manual smoke pass on desktop + mobile + JS-disabled.
