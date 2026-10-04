import { describe, it, expect } from 'vitest'
import {
  parseChangelog,
  formatRepoName,
  buildSlug,
  buildExcerpt,
  buildPayload,
} from '../scripts/blog-post-agent.mjs'

// ─── parseChangelog ────────────────────────────────────────────────────────────

describe('parseChangelog', () => {
  it('extracts the [Unreleased] section', () => {
    const md = `# Changelog\n\n## [Unreleased]\n\n- Added thing\n- Fixed other\n\n## [1.0.0] - 2026-01-01\n\n- First release`
    expect(parseChangelog(md)).toBe('- Added thing\n- Fixed other')
  })

  it('returns empty string when [Unreleased] section is absent', () => {
    const md = `# Changelog\n\n## [1.0.0] - 2026-01-01\n\n- First release`
    expect(parseChangelog(md)).toBe('')
  })

  it('returns empty string when [Unreleased] section is empty', () => {
    const md = `# Changelog\n\n## [Unreleased]\n\n## [1.0.0] - 2026-01-01`
    expect(parseChangelog(md)).toBe('')
  })

  it('handles [Unreleased] at end of file with no following version', () => {
    const md = `# Changelog\n\n## [Unreleased]\n\n- Only entry`
    expect(parseChangelog(md)).toBe('- Only entry')
  })
})

// ─── formatRepoName ────────────────────────────────────────────────────────────

describe('formatRepoName', () => {
  it('converts org/repo-name to Title Case', () => {
    expect(formatRepoName('ricardobezerra22/agentic-workflow')).toBe('Agentic Workflow')
  })

  it('handles single-word repo names', () => {
    expect(formatRepoName('org/myrepo')).toBe('Myrepo')
  })

  it('handles repos with no org prefix', () => {
    expect(formatRepoName('my-cool-project')).toBe('My Cool Project')
  })
})

// ─── buildSlug ─────────────────────────────────────────────────────────────────

describe('buildSlug', () => {
  it('includes the full UTC timestamp for uniqueness', () => {
    const date = new Date('2026-10-04T23:40:39Z')
    expect(buildSlug('org/agentic-workflow', date)).toBe('agentic-workflow-2026-10-04-23-40-39')
  })

  it('uses only the repo part, not the org', () => {
    const date = new Date('2026-01-15T08:05:00Z')
    expect(buildSlug('someorg/my-app', date)).toBe('my-app-2026-01-15-08-05-00')
  })

  it('two runs a second apart produce different slugs', () => {
    const a = new Date('2026-10-04T12:00:00Z')
    const b = new Date('2026-10-04T12:00:01Z')
    expect(buildSlug('org/repo', a)).not.toBe(buildSlug('org/repo', b))
  })
})

// ─── buildExcerpt ──────────────────────────────────────────────────────────────

describe('buildExcerpt', () => {
  it('returns the full text when it is under 160 chars', () => {
    const text = 'Short sentence. Another short one.'
    expect(buildExcerpt(text)).toBe(text)
  })

  it('stops before a sentence that would exceed the limit', () => {
    const s1 = 'First sentence here.'                          // 20 chars
    const s2 = 'Second sentence that is a bit longer.'        // 37 chars
    const s3 = 'Third sentence that would push us well past the 160 character limit set for excerpts in this blog system.'
    const text = `${s1} ${s2} ${s3}`
    const result = buildExcerpt(text)
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result).toContain(s1)
    expect(result).toContain(s2)
    expect(result).not.toContain(s3)
  })

  it('always includes at least the first sentence even if it exceeds maxLen', () => {
    const longSentence = 'A'.repeat(200) + '.'
    expect(buildExcerpt(longSentence)).toBe(longSentence)
  })

  it('respects a custom maxLen', () => {
    const text = 'Hello world. Goodbye world.'
    const result = buildExcerpt(text, 15)
    expect(result).toBe('Hello world.')
  })
})

// ─── buildPayload ──────────────────────────────────────────────────────────────

describe('buildPayload', () => {
  const base = {
    repoName: 'Agentic Workflow',
    slug: 'agentic-workflow-2026-10-04',
    content: 'We shipped something great.',
    excerpt: 'We shipped something great.',
    deployedAt: '2026-10-04T23:00:00Z',
  }

  it('sets published: true', () => {
    expect(buildPayload(base).published).toBe(true)
  })

  it('includes the release tag', () => {
    const { tags } = buildPayload(base)
    expect(tags).toEqual([{ name: 'Release', slug: 'release' }])
  })

  it('formats the title with DD/MM/YYYY HH:MM:SS timestamp', () => {
    const { title } = buildPayload(base)
    expect(title).toBe('Agentic Workflow — What shipped 04/10/2026 23:00:00')
  })

  it('passes content and excerpt through unchanged', () => {
    const payload = buildPayload(base)
    expect(payload.content).toBe(base.content)
    expect(payload.excerpt).toBe(base.excerpt)
  })

  it('passes slug through unchanged', () => {
    expect(buildPayload(base).slug).toBe(base.slug)
  })
})
