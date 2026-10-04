#!/usr/bin/env node
/**
 * Generates a blog post from CHANGELOG.md [Unreleased] and POSTs it to the blog API.
 *
 * Required env: OPENROUTER_API_KEY, BLOG_POST_API_KEY, BLOG_POST_API_URL
 * Optional env: BLOG_POST_MODEL, GH_SHA, GH_REF, GH_ACTOR, GH_REPO, GH_RUN_ID, GH_DEPLOYED_AT
 */

import { config } from 'dotenv'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { OpenRouter } from '@openrouter/sdk'

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

/** Extract the [Unreleased] section from a CHANGELOG.md string. */
export function parseChangelog(content) {
  const match = content.match(/## \[Unreleased\](.*?)(?=\n## |$)/s)
  return match?.[1]?.trim() ?? ''
}

/** "org/my-cool-repo" → "My Cool Repo" */
export function formatRepoName(repo) {
  return repo
    .split('/')
    .pop()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Build the URL-safe post slug — includes full UTC timestamp to avoid 409 conflicts. */
export function buildSlug(repo, date) {
  const ts = date.toISOString().slice(0, 19).replace(/[T:]/g, '-')
  return `${repo.split('/').pop()}-${ts}`
}

/**
 * Build the excerpt: join sentences until the result would exceed maxLen chars.
 * Always includes at least the first sentence.
 */
export function buildExcerpt(text, maxLen = 160) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  return sentences.reduce((acc, s) => {
    if (!acc) return s  // always include the first sentence
    const next = `${acc} ${s}`
    return next.length <= maxLen ? next : acc
  }, '')
}

/** Build the full POST payload. */
export function buildPayload({ repoName, slug, content, excerpt, deployedAt }) {
  const date = new Date(deployedAt)
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = [
    pad(date.getUTCDate()),
    pad(date.getUTCMonth() + 1),
    date.getUTCFullYear(),
  ].join('/') + ' ' + [
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join(':')
  return {
    title: `${repoName} — What shipped ${dateStr}`,
    slug,
    content,
    excerpt,
    published: true,
    tags: [{ name: 'Release', slug: 'release' }],
  }
}

// ─── Runtime (only runs when executed directly) ────────────────────────────────

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    const __dir = dirname(fileURLToPath(import.meta.url))
    config({ path: join(__dir, '..', '.env') })
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set')
    process.exit(1)
  }

  const BLOG_POST_API_URL =
    process.env.BLOG_POST_API_URL ?? 'https://blog-docs-nine.vercel.app/api/posts'
  if (!BLOG_POST_API_URL) {
    console.error('❌ BLOG_POST_API_URL not set')
    process.exit(1)
  }

  const MODEL = process.env.BLOG_POST_MODEL ?? 'z-ai/glm-5.3-flash'

  const changelog = readFileSync('CHANGELOG.md', 'utf8')
  const rawEntries = parseChangelog(changelog)

  if (!rawEntries) {
    console.log('ℹ️  No unreleased entries — skipping blog post.')
    process.exit(0)
  }

  const deployedAt = process.env.GH_DEPLOYED_AT ?? new Date().toISOString()
  const repo = process.env.GH_REPO ?? 'unknown/repo'
  const repoName = formatRepoName(repo)
  const date = new Date(deployedAt)
  const slug = buildSlug(repo, date)

  const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY })
  const stream = await openrouter.chat.send({
    chatRequest: {
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `You are a developer writing a short release blog post. Turn these raw changelog entries into 2-3 sentences of friendly, readable prose for a technical audience. No headers, no bullets — just prose. Focus on what users gain.

Changelog entries:
${rawEntries}

Write the blog post body only (no title).`,
        },
      ],
      stream: true,
    },
  })

  let content = ''
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) content += text
  }

  const trimmed = content.trim()
  const excerpt = buildExcerpt(trimmed)
  const payload = buildPayload({ repoName, slug, content: trimmed, excerpt, deployedAt })

  const res = await fetch(BLOG_POST_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.BLOG_POST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await res.text()

  if (!raw?.trim()) {
    console.error(`❌ Blog post API returned ${res.status} with an empty response body.`)
    process.exit(1)
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = raw
  }

  if (!res.ok) {
    const message = parsed?.error ?? parsed?.message ?? raw
    console.error(`❌ Blog post API error ${res.status}: ${message}`)
    process.exit(1)
  }

  console.log(
    `✅ Blog post published (${res.status}):`,
    typeof parsed === 'object' ? JSON.stringify(parsed) : parsed
  )
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) await main()
