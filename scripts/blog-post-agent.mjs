#!/usr/bin/env node
/**
 * Generates a blog post from CHANGELOG.md [Unreleased] and POSTs it to the blog API.
 * Replaces the Python regex approach with an OpenRouter prose generation call.
 *
 * Required env: OPENROUTER_API_KEY, BLOG_POST_API_KEY, BLOG_POST_API_URL
 * Optional env: BLOG_POST_MODEL, GH_SHA, GH_REF, GH_ACTOR, GH_REPO, GH_RUN_ID, GH_DEPLOYED_AT
 */

import { readFileSync } from "node:fs";
import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error("❌ OPENROUTER_API_KEY not set"); process.exit(1); }

const BLOG_POST_API_URL = process.env.BLOG_POST_API_URL ?? "https://blog-docs-nine.vercel.app/api/posts";
if (!BLOG_POST_API_URL) { console.error("❌ BLOG_POST_API_URL not set"); process.exit(1); }

const MODEL = process.env.BLOG_POST_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";

const changelog = readFileSync("CHANGELOG.md", "utf8");
const match = changelog.match(/## \[Unreleased\](.*?)(?=\n## |$)/s);
const rawEntries = match?.[1]?.trim() ?? "";

if (!rawEntries) {
  console.log("ℹ️  No unreleased entries — skipping blog post.");
  process.exit(0);
}

const deployedAt = process.env.GH_DEPLOYED_AT ?? new Date().toISOString();
const repo = process.env.GH_REPO ?? "unknown/repo";
const repoName = repo.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const date = new Date(deployedAt);
const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });
const stream = await openrouter.chat.send({
  chatRequest: {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `You are a developer writing a short release blog post. Turn these raw changelog entries into 2-3 sentences of friendly, readable prose for a technical audience. No headers, no bullets — just prose. Focus on what users gain.

Changelog entries:
${rawEntries}

Write the blog post body only (no title).`,
      },
    ],
    stream: true,
  },
});

let content = "";
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) content += text;
}

// Map CHANGELOG labels → GitFlow tag. Order matters: hotfix > release > fix > chore.
const TAG_MAP = [
  { pattern: /\*\*Hotfix\*\*/i,              name: "Hotfix",   slug: "hotfix"  },
  { pattern: /\*\*Added\*\*/i,               name: "Release",  slug: "release" },
  { pattern: /\*\*Fixed\*\*|\*\*Security\*\*/i, name: "Fix",   slug: "fix"     },
  { pattern: /\*\*(Changed|CI|Deprecated|Removed|Docs|Style|Perf)\*\*/i, name: "Chore", slug: "chore" },
];

function deriveTagsFromChangelog(entries) {
  const tags = TAG_MAP.filter(({ pattern }) => pattern.test(entries))
    .map(({ name, slug }) => ({ name, slug }));
  return tags.length ? tags : [{ name: "Release", slug: "release" }];
}

const trimmed = content.trim();
const sha = (process.env.GH_SHA ?? Date.now().toString(36)).slice(0, 7);
const slug = `${repo.split("/").pop()}-${date.toISOString().slice(0, 10)}-${sha}`;
// first sentence(s) up to 160 chars as excerpt
const excerpt = trimmed.split(/(?<=[.!?])\s+/).reduce((acc, s) => acc.length < 160 ? `${acc} ${s}`.trim() : acc, "");

const payload = {
  title: `${repoName} — What shipped ${dateStr}`,
  slug,
  content: trimmed,
  excerpt,
  published: true,
  tags: deriveTagsFromChangelog(rawEntries),
};

const res = await fetch(BLOG_POST_API_URL, {
  method: "POST",
  headers: {
    "x-api-key": process.env.BLOG_POST_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const contentType = res.headers.get("content-type") ?? "";
if (!contentType.includes("application/json")) {
  console.error(`❌ Blog post API returned unexpected content-type "${contentType}" (status ${res.status}). Expected JSON — got HTML or a redirect?`);
  process.exit(1);
}

const raw = await res.text();

if (!raw?.trim()) {
  console.error(`❌ Blog post API returned ${res.status} with an empty response body.`);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error(`❌ Blog post API returned non-JSON body (status ${res.status}): ${raw.slice(0, 200)}`);
  process.exit(1);
}

if (!res.ok) {
  const message = parsed?.error ?? parsed?.message ?? raw;
  console.error(`❌ Blog post API error ${res.status}: ${message}`);
  process.exit(1);
}

console.log(`✅ Blog post published (${res.status}):`, JSON.stringify(parsed));
