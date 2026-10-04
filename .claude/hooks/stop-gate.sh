#!/bin/bash
# Runs at end of every Claude session. Fails loudly so the agent is forced to surface issues.
cd "$CLAUDE_PROJECT_DIR" || exit 2

[ "$SKIP_REVIEW" = "1" ] && exit 0

ISSUES=()

# Uncommitted changes left behind
if ! git diff --quiet || ! git diff --cached --quiet; then
  ISSUES+=("Uncommitted changes — commit or stash before ending session.")
fi

# Warn if integration or e2e test files are missing (not a hard block — enforces creation over time)
# git ls-files is O(index) not O(filesystem) — much faster than find
if ! git ls-files --cached --others --exclude-standard | grep -qE '\.(integration\.test\.(js|ts))$'; then
  echo "⚠  stop-gate: no integration tests found (*.integration.test.{js,ts}). Add at least one per API/DB path." >&2
fi
if ! git ls-files --cached --others --exclude-standard | grep -qE '\.(e2e\.test\.(js|ts))$'; then
  echo "⚠  stop-gate: no E2E tests found (*.e2e.test.{js,ts}). Add at least one per user-facing flow." >&2
fi

if [ ${#ISSUES[@]} -eq 0 ]; then
  echo "Stop gate passed." >&2
  exit 0
fi

echo "── Stop gate failed ──────────────────────────" >&2
for issue in "${ISSUES[@]}"; do
  echo "  • $issue" >&2
done
echo "──────────────────────────────────────────────" >&2
exit 2
