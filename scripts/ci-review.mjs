#!/usr/bin/env node
/**
 * Security & performance code review agent for CI.
 * Uses OpenRouter to call the model and prints a grade card.
 * Exits 1 when the overall grade is D or F.
 *
 * Required env: OPENROUTER_API_KEY
 * Optional env: REVIEW_FAIL_BELOW (letter grade threshold, default "D")
 *               REVIEW_MODEL      (OpenRouter model id, default nvidia nemotron free)
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env') })

import { execFileSync } from "node:child_process";
import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY is not set.");
  process.exit(1);
}

const FAIL_BELOW = (process.env.REVIEW_FAIL_BELOW ?? "D").toUpperCase();
const MODEL = process.env.REVIEW_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
const GRADE_ORDER = ["A", "B", "C", "D", "F"];

function gradeBelow(grade, threshold) {
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(threshold);
}

// Collect the diff: prefer PR base comparison, fall back to last commit
let diff;
try {
  diff = execFileSync("git", ["diff", "origin/main...HEAD"], { encoding: "utf8" });
} catch {
  diff = execFileSync("git", ["diff", "HEAD~1"], { encoding: "utf8" });
}

// ponytail: naive slice, upgrade to token-aware split if reviews truncate badly
diff = diff.slice(0, 10_000);

if (!diff.trim()) {
  console.log("ℹ️  No diff found — nothing to review.");
  process.exit(0);
}

const prompt = `You are a senior code reviewer. Analyze the following git diff strictly for SECURITY and PERFORMANCE concerns only. Ignore style, formatting, and feature logic unless they directly create a vulnerability or a measurable performance issue.

Respond with a JSON object — no markdown, no prose — matching this exact shape:
{
  "security": {
    "grade": "<A|B|C|D|F>",
    "issues": ["<concise finding>"]
  },
  "performance": {
    "grade": "<A|B|C|D|F>",
    "issues": ["<concise finding>"]
  },
  "overall": "<A|B|C|D|F>",
  "summary": "<2-3 sentence plain-text summary>"
}

Grading scale:
A — no significant issues
B — minor issues, low risk
C — moderate issues worth fixing before merge
D — serious issues that should block merge
F — critical vulnerabilities or severe regressions

Diff:
\`\`\`diff
${diff}
\`\`\``;

const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });

const stream = await openrouter.chat.send({
  chatRequest: {
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  },
});

let responseText = "";
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) responseText += content;
}

let review;
try {
  review = JSON.parse(responseText);
} catch {
  console.error("❌ Could not parse review response:\n", responseText);
  process.exit(1);
}

const { security, performance, overall, summary } = review;
console.log("\n┌─────────────────────────────────────┐");
console.log("│        CI Code Review Report         │");
console.log("├──────────────┬───────────────────────┤");
console.log(`│ Security     │ Grade: ${security.grade.padEnd(15)}│`);
console.log("├──────────────┼───────────────────────┤");
console.log(`│ Performance  │ Grade: ${performance.grade.padEnd(15)}│`);
console.log("├──────────────┴───────────────────────┤");
console.log(`│ Overall: ${overall.padEnd(29)}│`);
console.log("└──────────────────────────────────────┘");
console.log(`\nSummary: ${summary}`);

if (security.issues.length) {
  console.log("\nSecurity issues:");
  security.issues.forEach((i) => console.log(`  • ${i}`));
}
if (performance.issues.length) {
  console.log("\nPerformance issues:");
  performance.issues.forEach((i) => console.log(`  • ${i}`));
}

if (gradeBelow(overall, FAIL_BELOW)) {
  console.log(
    `\n❌ Overall grade ${overall} is at or below the fail threshold (${FAIL_BELOW}). Fix the issues above before merging.`
  );
  process.exit(1);
}

console.log(`\n✅ Overall grade ${overall} — passed review.`);
