// Typescript file would be better but it's currently experimental

const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 90,
  tabWidth: 2,
  useTabs: false,
  // Never restyle fenced code blocks inside md/mdx — those are published
  // samples, and the repo's `semi: false` style would rewrite them.
  embeddedLanguageFormatting: 'off',
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
}

export default config
