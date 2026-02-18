# Setup Guide

This guide walks you through setting up your Agent Workspace. No coding experience required.

## Prerequisites

You need:
- A computer (Mac, Windows, or Linux)
- An internet connection
- An Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))

## Step 1: Create a GitHub Account

If you don't have one, go to [github.com/signup](https://github.com/signup) and create a free account.

## Step 2: Fork This Repo

1. Go to the agent-workspace repository on GitHub
2. Click the **Fork** button in the top-right corner
3. Click **Create fork**
4. You now have your own copy of the workspace

## Step 3: Download Your Fork

Option A — Using the terminal:
```bash
git clone https://github.com/YOUR-USERNAME/agent-workspace.git
cd agent-workspace
```

Option B — Using GitHub Desktop:
1. Install [GitHub Desktop](https://desktop.github.com)
2. Click **Clone a repository** and select your fork

## Step 4: Install Your Editor

Choose one:

### VS Code + Claude Code (Recommended)
1. Install [VS Code](https://code.visualstudio.com)
2. Open VS Code
3. Install the **Claude Code** extension from the Extensions marketplace
4. Open the `agent-workspace` folder in VS Code

### Craft Agents
1. Download from [agents.craft.do](https://agents.craft.do)
2. Create a workspace
3. Set the working directory to the `agent-workspace` folder

### Claude Desktop
1. Install [Claude Desktop](https://claude.ai/download)
2. Enable Claude Code in settings
3. Open the `agent-workspace` folder

## Step 5: Run Setup

In your editor, tell the agent:

> Run the setup workflow

The agent will guide you through:
1. Entering your business information
2. Setting up your brand guidelines
3. Connecting your tools (Shopify, Google, Klaviyo, etc.)
4. Installing plugins
5. Configuring auto-commit

## Step 6: Start Using

Try these first tasks:
- "What skills are available?"
- "Show me my recent orders" (if Shopify is connected)
- "How did my email campaigns perform?" (if Klaviyo is connected)
- "What's on my calendar?" (if Google is connected)

## Optional: Terminal Setup

If you're comfortable with the terminal, you can run the setup script first:

```bash
bash scripts/setup.sh
```

This installs prerequisites (Deno, Entire CLI) and creates your `.env` file.

## Contributing Back

As you use the workspace, the agent improves skills and context. To share improvements:

1. Tell the agent: **"Submit my improvements"**
2. The agent creates a pull request on GitHub
3. Approve it in the GitHub web UI

Your improvements help everyone using this workspace.
