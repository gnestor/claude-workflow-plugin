# Setup Workflow

Guide the user through personalizing their agent workspace. This workflow runs on first use and can be re-run to update configuration.

## When to Use

- First time a user opens the workspace
- User says "run the setup workflow" or "set up my workspace"
- User wants to add a new integration or update their configuration

## Process

### Phase 1: Identity

Ask the user:
1. What is your name?
2. What is your business name?
3. What is your role? (owner, marketing, operations, etc.)
4. Describe your business in 1-2 sentences
5. What tone should the agent use? (casual / professional / direct)

**Actions:**
- Update `.claude/skills/company/SKILL.md` with business overview
- Update `AGENTS.md` Agent Identity section with personalized identity and tone

### Phase 2: Brand (optional)

Ask:
1. Do you have brand guidelines you'd like the agent to follow?

If yes, ask:
- Brand colors (primary, secondary, accent — hex values)
- Fonts/typography
- Brand voice description (e.g., "warm and witty" or "clean and professional")
- Visual style direction

**Actions:**
- Update `.claude/skills/brand-guidelines/SKILL.md` with brand details

### Phase 3: Integrations

Present the list of available integrations and ask which ones the user needs:

**OAuth integrations** (browser opens automatically):
- Google (Gmail, Analytics, Sheets, Drive, BigQuery, Ads, Search Console)
- Pinterest
- QuickBooks

**API key integrations** (user provides key):
- Shopify — Settings → Apps → Develop apps → Create → Install → Copy Admin API token
- Klaviyo — Settings → API Keys → Create Private API Key → Copy
- Notion — notion.so/my-integrations → New integration → Copy token
- Instagram — Meta Developer portal → Instagram Graph API → Generate token
- Meta Ads — Meta Business Suite → System Users → Generate token
- Gorgias — Settings → REST API → Copy domain, email, API token
- Air.inc — Settings → API → Generate key
- Google AI Studio — aistudio.google.com → Get API key

**Database** (connection string):
- PostgreSQL — provided by host (Supabase, Railway, Neon, etc.)

For each selected integration:
1. **OAuth**: Run `deno run --allow-all` on the skill's auth script (uses loopback flow)
2. **API key**: Walk through the credential acquisition steps, then save to `.env`
3. **Database**: Ask for connection details, save to `.env`

### Phase 4: Plugins

Install recommended plugins:
```bash
# Document generation skills
claude /plugin install document-skills@anthropic-agent-skills

# Skill creation guide
claude /plugin install skill-creator@anthropic-agent-skills
```

### Phase 5: Tools

Check and install required tools:

```bash
# Check for Deno
command -v deno || echo "Deno not found — install from https://deno.land"

# Check for Entire CLI
command -v entire || echo "Entire CLI not found — install from https://entire.io"

# Enable auto-commit if Entire is available
entire enable --strategy auto-commit 2>/dev/null
```

### Phase 6: Frontend-specific

Ask the user which frontend they're using:
- **VS Code + Claude Code**: No additional setup needed
- **Craft Agents**: Guide through workspace setup (see Craft Agents section below)
- **Claude Desktop**: No additional setup needed

### Phase 7: Confirm

Show a summary:
- Business: [name]
- Integrations configured: [list]
- Plugins installed: [list]
- Auto-commit: [enabled/disabled]

Suggest first tasks:
- "What skills are available?"
- "Show me my recent orders" (if Shopify configured)
- "How did my email campaigns perform?" (if Klaviyo configured)
- "What's on my calendar today?" (if Google configured)

---

## Craft Agents Setup

For users using Craft Agents as their frontend:

1. Create a workspace named after their business
2. Set the working directory to the agent-workspace repo
3. Craft Agents reads AGENTS.md automatically
4. Create skill symlinks:
   ```bash
   WORKSPACE_ID=$(ls ~/.craft-agent/workspaces/ | head -1)
   for skill in .claude/skills/*/; do
     ln -s "$(pwd)/$skill" ~/.craft-agent/workspaces/$WORKSPACE_ID/skills/$(basename $skill)
   done
   ```
5. Verify skills loaded: ask "What skills are available?"
