#!/bin/bash
# Save key context from the current transcript before compaction.
# This preserves information that might be lost when the context window is compressed.

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
CWD=$(echo "$INPUT" | jq -r '.cwd')
DOCS_DIR="$CWD/.claude/docs"
HISTORY_DIR="$DOCS_DIR/history"

# Create directories if needed
mkdir -p "$HISTORY_DIR"

# Extract recent context from transcript
if [ -f "$TRANSCRIPT_PATH" ]; then
  TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
  SUMMARY_FILE="$HISTORY_DIR/${TIMESTAMP}-precompact-context.md"

  {
    echo "# Pre-Compaction Context"
    echo ""
    echo "**Saved:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "**Transcript:** $TRANSCRIPT_PATH"
    echo ""
    echo "## Recent User Prompts"
    echo ""
    jq -r 'select(.type == "user") | .message.content[]? | select(.type == "text") | .text' "$TRANSCRIPT_PATH" 2>/dev/null | tail -10 | while IFS= read -r line; do
      echo "> $line"
      echo ""
    done
  } > "$SUMMARY_FILE"
fi

exit 0
