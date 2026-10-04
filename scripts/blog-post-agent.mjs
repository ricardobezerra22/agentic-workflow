#!/usr/bin/env node
/**
 * Generates a release blog post from CHANGELOG.md [Unreleased] and POSTs it to the blog API.
 *
 * Payload sent to the API:
 *   { title, slug (unique), content (MDX), excerpt?, published, tags: [{ name, slug }] }
 *
 * Required env: OPENROUTER_API_KEY, BLOG_POST_API_KEY
 * Optional env: BLOG_POST_API_URL, BLOG_POST_MODEL,
 *               GH_SHA, GH_REF, GH_ACTOR, GH_REPO, GH_RUN_ID, GH_DEPLOYED_AT
 */

import { readFileSync } from "node:fs";
import { OpenRouter } from "@openrouter/sdk";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not set");
  process.exit(1);
}

const BLOG_POST_API_KEY = process.env.BLOG_POST_API_KEY;
if (!BLOG_POST_API_KEY) {
  console.error("❌ BLOG_POST_API_KEY not set");
  process.exit(1);
}

const BLOG_POST_API_URL = "https://blog-docs-nine.vercel.app/api/posts";
const MODEL =
  process.env.BLOG_POST_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";

// ---------------------------------------------------------------------------
// Input: CHANGELOG [Unreleased]
// ---------------------------------------------------------------------------
const changelog = readFileSync("CHANGELOG.md", "utf8");
const match = changelog.match(/## \[Unreleased\](.*?)(?=\n## |$)/s);
const rawEntries = match?.[1]?.trim() ?? "";

if (!rawEntries) {
  console.log("ℹ️  No unreleased entries — skipping blog post.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Deployment context (deterministic — never left to the LLM)
// ---------------------------------------------------------------------------
const deployedAt = process.env.GH_DEPLOYED_AT ?? new Date().toISOString();
const repo = process.env.GH_REPO ?? "unknown/repo";
const ref = process.env.GH_REF ?? "";
const actor = process.env.GH_ACTOR ?? "";
const fullSha = process.env.GH_SHA ?? "";
const runId = process.env.GH_RUN_ID ?? "";
const repoName = repo
  .split("/")
  .pop()
  .replace(/-/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase());
const date = new Date(deployedAt);
const dateStr = date.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function buildDeploymentSection() {
  const lines = [`- **Deployed at:** ${date.toISOString()}`];
  if (ref)
    lines.push(`- **Ref:** \`${ref.replace(/^refs\/(heads|tags)\//, "")}\``);
  if (fullSha) {
    const short = fullSha.slice(0, 7);
    lines.push(
      repo !== "unknown/repo"
        ? `- **Commit:** [\`${short}\`](https://github.com/${repo}/commit/${fullSha})`
        : `- **Commit:** \`${short}\``,
    );
  }
  if (actor) lines.push(`- **Triggered by:** ${actor}`);
  if (runId && repo !== "unknown/repo") {
    lines.push(
      `- **Pipeline run:** [#${runId}](https://github.com/${repo}/actions/runs/${runId})`,
    );
  }
  return `## Deployment details\n\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a senior engineer and technical writer producing release documentation.
The same post is read by three audiences, so write it to serve all of them:
- BUSINESS / PRODUCT: wants to know what changed for users and why it matters, in plain language.
- DEVELOPERS: wants technical specifics — what changed, where, and anything they must do (migrations, config, env vars, API changes).
- QA: wants to know what to verify, which areas carry regression risk, and what is out of scope.

GROUND RULES
1. Use ONLY information present in the changelog entries. Never invent features, endpoints, file names, metrics, versions, ticket IDs, or test results. If something is unknown, omit it.
2. Changelog labels mean: **Added** = new capability, **Changed** = behaviour/internal change, **Fixed** = bug fix, **Security** = security fix, **Hotfix** = urgent production fix, **Deprecated/Removed** = lifecycle changes, **CI/Docs/Style/Perf** = maintenance.
3. Keep technical identifiers (commands, paths, endpoints, flags, env vars) in \`inline code\`. Preserve any PR/issue/ticket references exactly as written.
4. Be concise and specific. No marketing fluff, no filler, no emojis.
5. If there are no user-facing changes (e.g. only CI/chore), say so plainly in the summary instead of inflating it.

OUTPUT FORMAT (strict)
Line 1:  EXCERPT: <one plain-text sentence, max 160 characters, no markdown, summarising the release>
Line 2:  ===BODY===
Then the MDX body, using EXACTLY these H2 sections, in this order. Omit a section entirely if it has nothing to report (never write "N/A" or "None"):

## Summary
2-3 sentences, plain language, business-friendly: what shipped and what users or the team gain.

## What's new
Bullets for **Added** items. Each bullet: **short bold title** — one sentence on the user/business value.

## Improvements & changes
Bullets for **Changed / Perf / Deprecated / Removed** items, same style.

## Fixes
Bullets for **Fixed / Security / Hotfix** items. State the problem that is now resolved, not just "fixed X".

## Technical notes
For developers: bullet list of implementation-level details, API/schema/config changes, new env vars, migrations, deprecations. Include "Breaking changes" as a bold bullet when applicable.

## QA checklist
A GitHub task list ("- [ ] ...") of concrete things to verify, derived from the changes above. Each item must be a testable statement (e.g. "- [ ] Submitting the form with an empty field shows a validation error"). Add a final bullet "Regression risk:" naming the areas most likely to be affected, only if it can be inferred from the entries.

MDX SAFETY (the body is compiled as MDX; invalid syntax breaks the page)
- Do NOT use H1 (#); the title is provided separately. Start at H2.
- Do NOT use import/export statements, JSX components, HTML tags, or HTML comments.
- Outside code spans/fences, never write the characters { } < >. Rephrase, or put them inside \`inline code\`.
- Do NOT wrap the answer in a code fence.
- Do NOT add a "Deployment details" section; it is appended automatically.
- Output nothing before "EXCERPT:" and nothing after the body.`;

const userPrompt = `Repository: ${repoName}
Deployed: ${dateStr}
Branch/ref: ${ref || "n/a"}

Raw changelog entries ([Unreleased]):
"""
${rawEntries}
"""

Write the release post now, following the output format exactly.`;

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------
const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });
const stream = await openrouter.chat.send({
  chatRequest: {
    model: MODEL,
    temperature: 0.3, // factual documentation: favour consistency over creativity
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  },
});

let llmOutput = "";
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) llmOutput += text;
}

if (!llmOutput.trim()) {
  console.error("❌ Model returned an empty response.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Post-processing: parse, sanitise for MDX, derive excerpt
// ---------------------------------------------------------------------------

/** Strip a wrapping ```markdown / ```mdx fence if the model added one. */
function unwrapFence(text) {
  const m = text.trim().match(/^```(?:mdx|markdown|md)?\n([\s\S]*?)\n```$/i);
  return m ? m[1] : text.trim();
}

/** Escape characters that would break MDX, leaving code fences and inline code untouched. */
function escapeMdx(md) {
  let inFence = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part, i) =>
          i % 2
            ? part
            : part
                .replace(/\\?\{/g, "\\{")
                .replace(/\\?\}/g, "\\}")
                .replace(/</g, "&lt;"),
        )
        .join("");
    })
    .join("\n");
}

function stripMarkdown(s) {
  return s
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, max = 160) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

const cleaned = unwrapFence(llmOutput);
const parsed = cleaned.match(
  /^EXCERPT:\s*(.+?)\s*\n+\s*===BODY===\s*\n([\s\S]*)$/,
);

let excerptRaw;
let bodyRaw;
if (parsed) {
  excerptRaw = parsed[1];
  bodyRaw = parsed[2];
} else {
  // Model ignored the format: use whole output as body and derive the excerpt from it.
  console.warn(
    "⚠️  Model output did not follow EXCERPT/BODY format — using fallback parsing.",
  );
  bodyRaw = cleaned.replace(/^EXCERPT:.*\n?/i, "");
  const firstParagraph = bodyRaw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#"));
  excerptRaw = firstParagraph ?? "";
}

const body = escapeMdx(bodyRaw.trim());
if (!body) {
  console.error("❌ Model produced no body content.");
  process.exit(1);
}

const content = `${body}\n\n${buildDeploymentSection()}\n`;
const excerpt = truncate(stripMarkdown(excerptRaw)) || undefined;

// ---------------------------------------------------------------------------
// Tags: map CHANGELOG labels → GitFlow tag. Order matters: hotfix > release > fix > chore.
// ---------------------------------------------------------------------------
const TAG_MAP = [
  { pattern: /\*\*Hotfix\*\*/i, name: "Hotfix", slug: "hotfix" },
  { pattern: /\*\*Added\*\*/i, name: "Release", slug: "release" },
  { pattern: /\*\*Fixed\*\*|\*\*Security\*\*/i, name: "Fix", slug: "fix" },
  {
    pattern: /\*\*(Changed|CI|Deprecated|Removed|Docs|Style|Perf)\*\*/i,
    name: "Chore",
    slug: "chore",
  },
];

function deriveTagsFromChangelog(entries) {
  const tags = TAG_MAP.filter(({ pattern }) => pattern.test(entries)).map(
    ({ name, slug }) => ({ name, slug }),
  );
  return tags.length ? tags : [{ name: "Release", slug: "release" }];
}

// ---------------------------------------------------------------------------
// Payload (matches API contract)
//   title: string (required)  slug: string (required, unique)  content: MDX (required)
//   excerpt: string (optional)  published: boolean  tags: [{ name, slug }]
// ---------------------------------------------------------------------------
const sha = (fullSha || Date.now().toString(36)).slice(0, 7);
const slug = `${repo.split("/").pop()}-${date.toISOString().slice(0, 10)}-${sha}`;

const payload = {
  title: `${repoName} — What shipped ${dateStr}`,
  slug,
  content,
  ...(excerpt ? { excerpt } : {}),
  published: true,
  tags: deriveTagsFromChangelog(rawEntries),
};

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
const res = await fetch(BLOG_POST_API_URL, {
  method: "POST",
  headers: {
    "x-api-key": BLOG_POST_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const contentType = res.headers.get("content-type") ?? "";
if (!contentType.includes("application/json")) {
  console.error(
    `❌ Blog post API returned unexpected content-type "${contentType}" (status ${res.status}). Expected JSON — got HTML or a redirect?`,
  );
  process.exit(1);
}

const raw = await res.text();

if (!raw?.trim()) {
  console.error(
    `❌ Blog post API returned ${res.status} with an empty response body.`,
  );
  process.exit(1);
}

let result;
try {
  result = JSON.parse(raw);
} catch {
  console.error(
    `❌ Blog post API returned non-JSON body (status ${res.status}): ${raw.slice(0, 200)}`,
  );
  process.exit(1);
}

if (!res.ok) {
  const message = result?.error ?? result?.message ?? raw;
  console.error(`❌ Blog post API error ${res.status}: ${message}`);
  process.exit(1);
}

console.log(`✅ Blog post published (${res.status}):`, JSON.stringify(result));
