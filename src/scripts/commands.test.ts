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
