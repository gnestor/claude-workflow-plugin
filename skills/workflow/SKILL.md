---
name: workflow
description: "Create, run, and manage repeatable workflows. Activate when: user says 'create a workflow', 'run workflow', 'list workflows', 'automate this', 'save this as a workflow', 'schedule this', wants to save a multi-step process for reuse, references an existing workflow by name or trigger phrase, or asks to list, edit, or delete workflows."
---

# Workflow Manager

Create, run, and manage repeatable automations. Workflows are user-specific plans that orchestrate skills and tools for specific outcomes. They're created through conversation using Claude Code's built-in plan mode, saved as PLAN.md files, and improved automatically after each execution.

## Creating a Workflow

Enter Claude Code's Plan Mode (`/plan`) to design the workflow collaboratively. The workflow skill adds these conventions:

### Step 0: Propose the workflow

Before entering plan mode, confirm with the user:

- **Name:** kebab-case, descriptive (e.g., `weekly-revenue-report`, `email-campaign-draft`)
- **Location:** `workflows/{name}/` in the workspace
- **Purpose:** What this workflow achieves and when to trigger it
- Use AskUserQuestion to confirm and collect requirements

### Step 1: Design in Plan Mode

Enter plan mode and draft the workflow plan:

- Write clear, actionable steps that reference tools and skills by name
- Use `{{parameter_name}}` for values that change between runs (e.g., `{{date_range}}`, `{{recipient}}`)
- Include a Context section explaining the objective and any constraints
- Include a Verification section describing how to confirm each step succeeded
- Keep steps concrete — each step should be independently executable

### Step 2: Save the workflow

After the plan is approved and you exit plan mode:

1. Create `workflows/{name}/` and `workflows/{name}/outputs/`
2. Save the plan as `PLAN.md` with YAML frontmatter (see Frontmatter fields below)
3. Register the workflow in `.claude/docs/WORKFLOWS.md`

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

1. **Check the registry first**: Read `.claude/docs/WORKFLOWS.md` (if it exists) and compare the user's request against each workflow's `triggers` and `description`.
2. **Scan the workflows directory**: If no registry exists or the request doesn't match, check for a `workflows/` directory in the current working directory. List all subdirectories and read the first 10 lines of any `WORKFLOW.md` or `PLAN.md` found.
3. **Match on triggers**: Compare the user's phrasing against `triggers` frontmatter. A fuzzy match is fine — if in doubt, ask the user.
4. If a match is found, offer to run the existing workflow before starting from scratch.
5. If no match, proceed normally — the task may lead to creating a new workflow if it's repeatable.

**On startup**, if the user's first message sounds like a recurring business task (e.g., "process emails", "run triage", "pull analytics", "weekly report"), proactively check for matching workflows before responding.

## Listing Workflows

When the user asks "what can you do?", "list workflows", or "what workflows exist":

1. Read `.claude/docs/WORKFLOWS.md` if present
2. Also scan `workflows/*/WORKFLOW.md` and `workflows/*/PLAN.md` in the current directory
3. Present a clean list: name, description, and trigger phrases for each
4. If neither exists, explain that no workflows have been set up yet and offer to create one

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
