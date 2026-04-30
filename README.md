# jcalado.com

The source for **[jcalado.com](https://jcalado.com)** — an irregular zine on
software, amateur radio, and side-projects, by Joel Calado (CS7BLE / PT).

The site is published as a static zine: a Departure Mono masthead, numbered
TOC entries on the homepage, a magazine-style index of tags, and a colophon
in place of a footer. Two themes — aged paper / navy ink, or deep ink /
parchment amber — toggled with one click.

## Stack

- [Astro](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com)
- [Expressive Code](https://expressive-code.com) for syntax highlighting
- [Pagefind](https://pagefind.app) for client-side search
- [Satori](https://github.com/vercel/satori) for OpenGraph card generation
- Type: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (body) +
  [Departure Mono](https://departuremono.com) (display)

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # build static site to dist/
npm run preview    # serve the built site locally
npm test           # vitest
```

## Layout

- `src/pages/` — routes (`index`, `about`, `posts/[slug]`, `tags/[tag]`,
  `series/[slug]`, RSS, sitemap, social cards)
- `src/content/posts/` — blog content as `.md` / `.mdx`
- `src/components/` — `Masthead`, `SectionHeader`, `PostPreview`,
  `TagsSection`, `Footer` (colophon), etc.
- `src/site.config.ts` — site title, nav, theme palette overrides,
  social links
- `src/styles/global.css` — fonts, prose styles, palette wiring

## Credit

Originally forked from [MultiTerm Astro](https://github.com/stelcodes/multiterm-astro)
by [Stel Clementine](https://stelclementine.com). The current design is a
ground-up rework — masthead, sections, palette, typography — but the
content/theme/SEO plumbing came from there. Thanks Stel.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
