#!/bin/bash
cd "$CLAUDE_PROJECT_DIR" || exit 2
    
[ "$SKIP_REVIEW" = "1" ] && exit 0

npm run lint >&2 || { echo "Lint failed. Fix it before committing." >&2; exit 2; }
npm run test >&2 || { echo "Tests failed. Fix them before committing." >&2; exit 2; }
node scripts/code-review.mjs >&2 || { echo "Review gate failed. Address the issues above." >&2; exit 2; }

exit 0