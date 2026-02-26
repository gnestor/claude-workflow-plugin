---
name: workflow
description: "Create, run, and manage repeatable workflows. Activate when: user says 'create a workflow', 'run workflow', 'list workflows', 'automate this', 'save this as a workflow', 'schedule this', wants to save a multi-step process for reuse, references an existing workflow by name or trigger phrase, or asks to list, edit, or delete workflows."
---

# Workflow Manager

Create, run, and manage repeatable automations. Workflows are user-specific plans that orchestrate skills and tools for specific outcomes. They're created through conversation using Claude Code's built-in plan mode, saved as PLAN.md files, and improved automatically after each execution.

## Creating a Workflow

Use Claude Code's plan mode naturally. The workflow skill adds these conventions:

### Step 0: Propose the workflow directory

Before planning the workflow steps, propose a name and location:

- **Default location:** `workflows/{name}/` relative to the plugin root
- **Name:** kebab-case, descriptive (e.g., `weekly-revenue-report`, `email-campaign-draft`)
- Use AskUserQuestion to confirm the name, location, and collect any requirements

### Planning

Plan mode handles the rest. When drafting the plan:

- Reference `~~category` placeholders for tool access (not specific tool names)
- Use `{{parameter_name}}` for values that change between runs
- Include an Objective section explaining what the workflow achieves and why
- Keep steps concrete and actionable

### After plan approval

1. Create the workflow directory and `outputs/` subdirectory
2. Save the approved plan as `PLAN.md` using the schema from `references/plan-template.md`
3. Add YAML frontmatter with name, description, triggers, parameters, and connector dependencies
4. Register the workflow in `.claude/docs/WORKFLOWS.md`

### Frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | kebab-case identifier |
| `description` | Yes | What this workflow does (1-2 sentences) |
| `triggers` | Yes | Natural language phrases that should match this workflow |
| `schedule` | No | Natural language schedule (future — not yet implemented) |
| `destination` | No | Where output goes. Default: `outputs/` |
| `skills` | No | Skills this workflow depends on |
| `connectors` | No | `~~category` tool categories this workflow uses |
| `parameters` | No | Runtime parameters with name, description, and optional default |
| `created` | Auto | Date created |
| `last_run` | Auto | Timestamp of last execution |
| `last_run_status` | Auto | success, partial, or failed |
| `run_count` | Auto | Number of times executed |

## Running a Workflow

1. **Read the PLAN.md** — the steps are the single source of truth (they include learnings from prior runs)
2. **Resolve parameters** — use values from the user's request, fall back to defaults in frontmatter, ask if no default exists
3. **Execute steps** — follow the plan, delegating to subagents per CLAUDE.md guidelines
4. **Save output** — to `{workflow_dir}/outputs/YYYY-MM-DD-HH-MM-SS.md` by default, or to the destination specified in frontmatter or by the user (Notion, Google Drive, email, etc.)

The Stop hook handles post-execution updates to PLAN.md (see below).

## Discovering Workflows

When a user makes a request that might match an existing workflow:

1. Read `.claude/docs/WORKFLOWS.md` (if it exists)
2. Compare the user's request against each workflow's `triggers` and `description`
3. If a match is found, offer to run the existing workflow
4. If no match, proceed normally — may lead to creating a new workflow if the task is repeatable

## Listing Workflows

Read `.claude/docs/WORKFLOWS.md` and present it. If the registry doesn't exist but `workflows/` directories do, scan for PLAN.md files to build it.

## Editing a Workflow

Read the existing PLAN.md, present it, iterate with the user, save updates. Update the registry if name, description, or schedule changed.

## Deleting a Workflow

Confirm with the user, remove the directory, update `.claude/docs/WORKFLOWS.md`.

## Post-Execution Updates (Stop Hook)

After a workflow runs, the Stop hook:

- Compares execution to the PLAN.md steps
- **Updates steps inline** if execution deviated or uncovered better approaches — PLAN.md always reflects the current best instructions
- Updates frontmatter: `last_run`, `last_run_status`, increments `run_count`
- Updates `.claude/docs/WORKFLOWS.md` registry

There are no separate "execution notes" or "learned adjustments" sections. The steps evolve.

## When to Use

- User wants to save a repeatable process
- User references an existing workflow
- User says "automate", "workflow", "schedule", "run every", "save this process"
- User asks to list, edit, or delete workflows

## When NOT to Use

- One-off tasks that won't be repeated (just do them directly)
- Simple data queries (use domain skills directly)
- Creating or editing skills (use the contribute skill or skill-creator)
