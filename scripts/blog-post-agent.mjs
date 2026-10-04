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

const BLOG_POST_API_URL = process.env.BLOG_POST_API_URL;
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

const trimmed = content.trim();
const slug = `${repo.split("/").pop()}-${date.toISOString().slice(0, 10)}`;
// first sentence(s) up to 160 chars as excerpt
const excerpt = trimmed.split(/(?<=[.!?])\s+/).reduce((acc, s) => acc.length < 160 ? `${acc} ${s}`.trim() : acc, "");

const payload = {
  title: `${repoName} — What shipped ${dateStr}`,
  slug,
  content: trimmed,
  excerpt,
  published: true,
  tags: [{ name: "Release", slug: "release" }],
};

const res = await fetch(BLOG_POST_API_URL, {
  method: "POST",
  headers: {
    "x-api-key": process.env.BLOG_POST_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log(`${res.ok ? "✅" : "❌"} Blog post (${res.status}): ${body}`);
if (!res.ok) process.exit(1);
