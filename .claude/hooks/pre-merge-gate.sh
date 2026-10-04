#!/bin/bash
# PreToolUse hook — blocks gh pr merge unless review grade is A and all CI checks pass.
cd "$CLAUDE_PROJECT_DIR" || exit 2

[ "$SKIP_REVIEW" = "1" ] && exit 0

# Parse the bash command from stdin JSON
CMD=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

# Extract PR number from command args; fall back to current branch PR
PR_NUM=$(echo "$CMD" | grep -oE '\b[0-9]+\b' | head -1)
if [ -z "$PR_NUM" ]; then
  PR_NUM=$(gh pr view --json number --jq '.number' 2>/dev/null)
fi

if [ -z "$PR_NUM" ]; then
  echo "pre-merge-gate: could not determine PR number." >&2
  exit 2
fi

echo "pre-merge-gate: checking PR #$PR_NUM..." >&2

# All CI checks must pass (no failures, no pending)
CHECKS=$(gh pr checks "$PR_NUM" 2>/dev/null)
if echo "$CHECKS" | grep -qiE "^[^[:space:]].*\s(fail|error)"; then
  echo "pre-merge-gate: CI checks are failing. Fix before merging." >&2
  exit 2
fi
if echo "$CHECKS" | grep -qiE "pending|queued|in_progress"; then
  echo "pre-merge-gate: CI checks still running. Wait for CI to complete." >&2
  exit 2
fi

# Extract overall grade from the CI review comment posted by ci.yml
GRADE=$(gh pr view "$PR_NUM" --json comments --jq '[.comments[].body] | join("\n")' 2>/dev/null \
  | grep -oE '│ Overall: +[A-F]' | tail -1 | grep -oE '[A-F]$')

if [ -z "$GRADE" ]; then
  echo "pre-merge-gate: no review grade found on PR #$PR_NUM. Ensure CI ran and posted a review comment." >&2
  exit 2
fi

if [ "$GRADE" != "A" ]; then
  echo "pre-merge-gate: review grade is $GRADE — Grade A required to merge. Address the issues in the CI review comment." >&2
  exit 2
fi

echo "pre-merge-gate: grade A confirmed — PR #$PR_NUM cleared to merge." >&2
exit 0
