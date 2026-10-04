#!/bin/bash
# PostToolUse hook — appends the latest commit to CHANGELOG.md after every git commit.
cd "$CLAUDE_PROJECT_DIR" || exit 2

# Only act on git commit commands (exact match, not substring of unrelated commands)
CMD=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)
echo "$CMD" | grep -qE '(^|&&\s*|;\s*)git commit\b' || exit 0

# Get latest commit: hash|subject|date
IFS='|' read -r HASH SUBJECT DATE < <(git log -1 --pretty=format:'%h|%s|%cd' --date=short 2>/dev/null)
[ -z "$HASH" ] && exit 0

# Map conventional commit prefix to changelog section label
case "$SUBJECT" in
  feat:*|feat\(*) SECTION="Added" ;;
  fix:*|fix\(*)   SECTION="Fixed" ;;
  docs:*)          SECTION="Docs" ;;
  test:*)          SECTION="Tests" ;;
  ci:*)            SECTION="CI" ;;
  *)               SECTION="Changed" ;;
esac

ENTRY="- **${SECTION}** ${SUBJECT} (\`${HASH}\`) — ${DATE}"
CHANGELOG="$CLAUDE_PROJECT_DIR/CHANGELOG.md"

# Bootstrap file if missing
if [ ! -f "$CHANGELOG" ]; then
  cat > "$CHANGELOG" <<'EOF'
# Changelog
All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## [Unreleased]
EOF
fi

# Insert entry on the line immediately after "## [Unreleased]"
python3 - "$CHANGELOG" "$ENTRY" <<'PYEOF'
import sys
path, entry = sys.argv[1], sys.argv[2]
lines = open(path).readlines()
out, inserted = [], False
for line in lines:
    out.append(line)
    if not inserted and line.strip() == "## [Unreleased]":
        out.append(entry + "\n")
        inserted = True
if not inserted:
    out.append("\n## [Unreleased]\n" + entry + "\n")
open(path, 'w').writelines(out)
PYEOF

# Amend the commit to include CHANGELOG.md — shell cmds inside hooks don't re-trigger hooks
SKIP_REVIEW=1 git add "$CHANGELOG" && SKIP_REVIEW=1 git commit --amend --no-edit 2>/dev/null
echo "changelog: amended commit $HASH with CHANGELOG.md entry" >&2
exit 0
