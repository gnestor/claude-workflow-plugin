---
name: recap
description: >
  Document the current conversation and update knowledge base files.
  USE THIS SKILL AUTOMATICALLY when a plan is executed to completion,
  all todos are marked complete, or meaningful work is finished.
  Can also be invoked manually with /recap command.
---

# Conversation Recap

Summarize the session and improve skills based on feedback from the session.

## When to Use

**Auto-invoke this skill when:**
- A plan has been executed to completion (all planned steps done)
- All todos in the todo list are marked complete
- A significant implementation, analysis, or research task is finished

**Skip** if the conversation was just Q&A, quick fixes, or no lasting learnings.

## Process

### Step 0: Handle Compacted Conversations

If the conversation has been compacted (you see a summary at the start mentioning "continued from a previous conversation"), fetch the full conversation logs.

**Log location:** `~/.claude/projects/` (find the directory matching this workspace path)

```bash
# List project directories to find the right one
ls -d ~/.claude/projects/*/

# List recent conversation logs by size (larger = more content)
ls -laS ~/.claude/projects/<project-dir>/*.jsonl | head -10

# Extract user prompts from a conversation log
cat ~/.claude/projects/<project-dir>/<conversation-id>.jsonl | jq -c 'select(.type == "user") | .message.content[0].text' 2>/dev/null | grep -v "^null$" | head -30
```

**Log entry types:** `user` (prompts), `assistant` (responses), `summary` (compaction), `progress` (tools), `system`

### Step 1: Analyze the Conversation

Review the conversation (and logs if compacted) to identify:
1. **Initial prompt**: The user's original request
2. **Plan**: The approved approach/plan
3. **Execution**: What was done, step by step
4. **Result**: Final outcome, deliverables, findings
5. **Errors/failures**: Problems encountered and how they were solved
6. **Usage patterns**: New skill usage patterns discovered
7. **Company context**: New insights about the business

### Step 2: Create Session Summary

Save to: `workflows/yyyy-mm-dd-hh-mm-ss-workflow-title.md`

Use the template from [references/templates.md](references/templates.md#session-summary-template).

**Filename guidelines:**
- Format: `yyyy-mm-dd-hh-mm-ss-descriptive-title.md`
- Use lowercase with hyphens
- Be descriptive but concise
- Examples: `2026-01-25-14-30-00-email-revenue-analysis.md`

### Step 3: Improve Skills

Review the session for learnings that should be integrated into skills:

| Finding Type | Action | Location |
|--------------|--------|----------|
| Error/failure with solution | Add fix to skill's script or SKILL.md | `.claude/skills/<skill>/` |
| New usage pattern | Document in references | `.claude/skills/<skill>/references/` |
| New company context | Add to relevant department file | `.claude/skills/company/references/` |

**Department files:** overview, team, goals, products, marketing, finance, operations, customer-service

**Important:** Ensure all skill revisions comply with skill-creator guidelines:
- SKILL.md must stay under 500 lines
- Split content into reference files when approaching this limit
- Reference files from SKILL.md with clear descriptions of when to read them

### Step 4: Summarize Changes

After documenting and updating, provide the user with:
1. Path to the session summary file
2. List of skill files that were updated
3. Brief summary of what was captured

## Guidelines

### What to Include in Session Summary

- **Title with date**: Descriptive title with date underneath
- **Initial prompt**: Exact user request (quoted)
- **Plan**: The approved approach
- **Execution summary**: Step-by-step what was done
- **Result**: Findings, deliverables, conclusions
- **Appendix**: List of all skill revisions made

### What to Add to Skills

**For errors/failures:**
- Add solution to SKILL.md troubleshooting section, or
- Fix the script directly in `scripts/`

**For usage patterns:**
- Add to `references/workflow-examples.md` with example prompts and steps

**For company context:**
- Add to the relevant department file in `.claude/skills/company/references/`

## Don't

- Create documentation for trivial conversations
- Duplicate information across multiple files
- Add verbose explanations - keep it concise
- Exceed 500 lines in any SKILL.md file
- Create files in `.claude/plans/` (plans are temporary)
