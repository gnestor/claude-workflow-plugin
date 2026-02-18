---
name: recap
description: Summarize the current session and update skill files with learnings.
---

# Session Recap

Analyze the current conversation, create a session summary, and update skill reference files with any learnings discovered during the session.

## When to Use

- At the end of a productive session
- After completing a significant task or workflow
- When the user explicitly invokes `/ecommerce:recap`

**Skip** if the conversation was just Q&A, quick fixes, or produced no lasting learnings.

## Process

### Step 1: Handle Compacted Conversations

If the conversation has been compacted (you see a summary at the start mentioning "continued from a previous conversation"), fetch the full conversation logs to ensure nothing is missed.

**Log location:** `~/.claude/projects/` (find the directory matching this workspace path)

```bash
# List project directories to find the right one
ls -d ~/.claude/projects/*/

# List recent conversation logs by size (larger = more content)
ls -laS ~/.claude/projects/<project-dir>/*.jsonl | head -10

# Extract user prompts from a conversation log
cat ~/.claude/projects/<project-dir>/<conversation-id>.jsonl | jq -c 'select(.type == "user") | .message.content[0].text' 2>/dev/null | grep -v "^null$" | head -30
```

### Step 2: Analyze the Conversation

Review the full conversation (and logs if compacted) to identify:

1. **Initial prompt**: The user's original request
2. **Plan**: The approach that was agreed upon
3. **Execution**: What was done, step by step
4. **Result**: Final outcome, deliverables, findings
5. **Errors/failures**: Problems encountered and how they were resolved
6. **Usage patterns**: New skill or tool usage patterns discovered
7. **Business context**: New insights about the company, products, or operations

### Step 3: Create Session Summary

Save to: `workflows/yyyy-mm-dd-hh-mm-ss-workflow-title.md`

Use this structure:

```markdown
# [Descriptive Title]

**Date:** [yyyy-mm-dd]
**Duration:** [approximate]

## Initial Request

> [Exact user request, quoted]

## Plan

[The approach that was agreed upon]

## Execution Summary

1. [Step 1 -- what was done]
2. [Step 2 -- what was done]
3. [Step N -- what was done]

## Result

[Findings, deliverables, conclusions]

## Key Learnings

- [Learning 1]
- [Learning 2]

## Appendix: Skill Revisions

| File | Change |
|------|--------|
| [path] | [what was updated] |
```

**Filename guidelines:**
- Format: `yyyy-mm-dd-hh-mm-ss-descriptive-title.md`
- Use lowercase with hyphens
- Be descriptive but concise
- Example: `2026-02-18-14-30-00-email-revenue-analysis.md`

### Step 4: Update Skills with Learnings

Review the session for findings that should be integrated into skill files:

| Finding Type | Action | Location |
|-------------|--------|----------|
| Error with solution discovered | Add troubleshooting entry to SKILL.md or fix script | `skills/<skill>/` |
| New usage pattern or workflow | Document in references | `skills/<skill>/references/` |
| New company/business context | Add to company skill | `skills/company/references/` |
| New brand insight | Update brand voice | `skills/brand-voice/SKILL.md` |

**Guidelines for skill updates:**
- SKILL.md files should stay under 500 lines; split into reference files if approaching that limit
- Reference files from SKILL.md with clear descriptions of when to read them
- Do not duplicate information across multiple files
- Keep entries concise and actionable

### Step 5: Report to User

After documenting and updating, provide the user with:

1. **Path** to the session summary file
2. **List** of skill files that were updated (with brief description of each change)
3. **Brief summary** of what was captured (2-3 sentences)

## Guidelines

### What to Capture

- Decisions made and their rationale
- Workarounds for tool limitations
- Successful query patterns or data access approaches
- Business rules or preferences expressed by the user
- Corrections the user made to agent behavior

### What NOT to Capture

- Trivial conversations or small talk
- Information already documented in existing skills
- Temporary debugging steps that have no future value
- Verbose explanations -- keep everything concise
