#!/usr/bin/env node
/**
 * Posts a one-paragraph plain-English summary of a PR's diff as a comment.
 *
 * Required env: OPENROUTER_API_KEY, GH_TOKEN, PR_NUMBER
 * Optional env: PR_SUMMARY_MODEL
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env') })

import { execFileSync } from "node:child_process";
import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error("❌ OPENROUTER_API_KEY not set"); process.exit(1); }

const MODEL = process.env.PR_SUMMARY_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";

let diff;
try {
  diff = execFileSync("git", ["diff", "origin/main...HEAD"], { encoding: "utf8" });
} catch {
  diff = execFileSync("git", ["diff", "HEAD~1"], { encoding: "utf8" });
}

// ponytail: naive slice, upgrade to token-aware split if diffs grow large
diff = diff.slice(0, 10_000);

if (!diff.trim()) { console.log("ℹ️  Empty diff — skipping PR summary."); process.exit(0); }

const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });
const stream = await openrouter.chat.send({
  chatRequest: {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Summarize this pull request in one short paragraph (3-5 sentences) for a technical reviewer. Focus on what changed and why it matters — not file-by-file details. Plain English.

\`\`\`diff
${diff}
\`\`\``,
      },
    ],
    stream: true,
  },
});

let summary = "";
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) summary += text;
}

const comment = `### PR Summary\n\n${summary}\n\n<sub>Powered by OpenRouter</sub>`;
execFileSync("gh", ["pr", "comment", process.env.PR_NUMBER, "--body", comment], { stdio: "inherit" });
console.log("✅ PR summary posted.");
