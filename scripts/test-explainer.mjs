#!/usr/bin/env node
/**
 * Reads test failure output from a file and posts a plain-English explanation as a PR comment.
 * Usage: node scripts/test-explainer.mjs <path-to-output-file>
 *
 * Required env: OPENROUTER_API_KEY, GH_TOKEN, PR_NUMBER
 * Optional env: EXPLAINER_MODEL
 */

import 'dotenv/config.js'
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error("❌ OPENROUTER_API_KEY not set"); process.exit(1); }

const logPath = process.argv[2];
if (!logPath) { console.error("Usage: test-explainer.mjs <log-file>"); process.exit(1); }

// ponytail: naive slice, upgrade to token-aware split if logs grow large
const failureLog = readFileSync(logPath, "utf8").slice(0, 8_000);
if (!failureLog.trim()) { console.log("ℹ️  Empty log — nothing to explain."); process.exit(0); }

const MODEL = process.env.EXPLAINER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";

const openrouter = new OpenRouter({ apiKey: OPENROUTER_API_KEY });
const stream = await openrouter.chat.send({
  chatRequest: {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `A CI test suite just failed. Explain what went wrong in 3-5 bullet points, plain English. Focus on root cause, not stack trace noise.

Test output:
\`\`\`
${failureLog}
\`\`\``,
      },
    ],
    stream: true,
  },
});

let explanation = "";
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) explanation += text;
}

const comment = `### CI Test Failure Analysis\n\n${explanation}\n\n<sub>Powered by OpenRouter</sub>`;
execFileSync("gh", ["pr", "comment", process.env.PR_NUMBER, "--body", comment], { stdio: "inherit" });
console.log("✅ Failure explanation posted.");
