import { describe, it, expect } from 'vitest'
import { levenshtein, suggest, dispatch } from './commands'

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
