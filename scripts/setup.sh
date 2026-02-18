#!/bin/bash
# Agent Workspace Setup Script
# Installs prerequisites and prepares the workspace for first use.

set -e

echo "=== Agent Workspace Setup ==="
echo ""

# Check for Deno
if command -v deno &> /dev/null; then
  echo "[OK] Deno $(deno --version | head -1 | awk '{print $2}')"
else
  echo "[INSTALLING] Deno..."
  curl -fsSL https://deno.land/install.sh | sh
  echo "[OK] Deno installed"
fi

echo ""

# Check for Entire CLI
if command -v entire &> /dev/null; then
  echo "[OK] Entire CLI"
else
  echo "[INSTALLING] Entire CLI..."
  curl -fsSL https://entire.io/install.sh | bash
  echo "[OK] Entire CLI installed"
fi

echo ""

# Check for gh CLI (optional, for PR workflow)
if command -v gh &> /dev/null; then
  echo "[OK] GitHub CLI (gh)"
else
  echo "[OPTIONAL] GitHub CLI not found. Install for PR workflow:"
  echo "  brew install gh    (macOS)"
  echo "  https://cli.github.com  (other)"
fi

echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from template"
else
  echo "[OK] .env already exists"
fi

echo ""

# Enable Entire auto-commit
if command -v entire &> /dev/null; then
  entire enable --strategy auto-commit 2>/dev/null && echo "[OK] Entire auto-commit enabled" || echo "[SKIP] Entire already configured"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Open this folder in VS Code (or Craft Agents)"
echo "  2. Start the Claude Code extension"
echo "  3. Tell the agent: 'Run the setup workflow'"
echo "  4. The agent will help you personalize the workspace"
echo ""
