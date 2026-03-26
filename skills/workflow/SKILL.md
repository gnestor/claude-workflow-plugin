---
name: workflow
description: "Create, run, and manage repeatable workflows. Activate when: user says 'create a workflow', 'run workflow', 'list workflows', 'automate this', 'save this as a workflow', 'schedule this', wants to save a multi-step process for reuse, references an existing workflow by name or trigger phrase, or asks to list, edit, or delete workflows."
---

# Workflow Manager

Create, run, and manage repeatable automations. Workflows are PLAN.md files created through Claude Code's Plan Mode, saved in `workflows/`, and improved automatically after each execution.

## Creating a Workflow

### Step 0: Propose the workflow

Before entering Plan Mode, confirm with the user:

- **Name:** kebab-case, descriptive (e.g., `weekly-revenue-report`, `email-campaign-draft`)
- **Location:** `workflows/{name}/` in the workspace
- **Purpose:** What this workflow achieves and when to trigger it
- Use AskUserQuestion to confirm and collect requirements

### Step 1: Design in Plan Mode

Enter Plan Mode (`/plan`) and draft the workflow plan:

- Write clear, actionable steps that reference tools and skills by name
- Use `{{parameter_name}}` for values that change between runs (e.g., `{{date_range}}`, `{{recipient}}`)
- Include verification for each step (how to confirm it succeeded)
- Keep steps concrete — each step should be independently executable

### Step 2: Save the workflow

After the plan is approved and you exit Plan Mode:

1. Create `workflows/{name}/`
2. Save the plan as `PLAN.md` with YAML frontmatter (see below)
3. Add the workflow to `workflows/index.md`

### Frontmatter

```yaml
---
name: workflow-name
description: "What this workflow does (1-2 sentences)"
triggers:
  - "natural language phrase that should match this workflow"
  - "another trigger phrase"
skills:
  - skill-name
parameters:
  - name: param_name
    description: "What this parameter controls"
    default: null
created: YYYY-MM-DD
last_run: null
last_run_status: null
run_count: 0
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | kebab-case identifier |
| `description` | Yes | What this workflow does (1-2 sentences) |
| `triggers` | Yes | Natural language phrases that should match this workflow |
| `skills` | No | Skills this workflow depends on |
| `parameters` | No | Runtime parameters with name, description, and optional default |
| `created` | Auto | Date created |
| `last_run` | Auto | Timestamp of last execution |
| `last_run_status` | Auto | success, partial, or failed |
| `run_count` | Auto | Number of times executed |

## Running a Workflow

1. **Read the PLAN.md** — the steps are the single source of truth (they include learnings from prior runs)
2. **Resolve parameters** — use values from the user's request, fall back to defaults in frontmatter, ask if no default exists
3. **Execute steps** — follow the plan sequentially
4. **Save output** — to `{workflow_dir}/outputs/YYYY-MM-DD-HH-MM-SS.md` or to the destination specified by the user (Notion, Google Drive, email, etc.)

## Post-Execution Updates

After a workflow runs, before the session ends:

- Compare execution to the PLAN.md steps
- **Update steps inline** if execution deviated or uncovered better approaches — PLAN.md always reflects the current best instructions
- Update frontmatter: `last_run`, `last_run_status`, increment `run_count`
- Update `workflows/index.md` if description or triggers changed

There are no separate "execution notes" sections. The steps evolve.

## Discovering Workflows

When a user makes a request that might match an existing workflow:

1. **Read the index**: Read `workflows/index.md` and compare the user's request against each workflow's triggers and description.
2. **Match on triggers**: A fuzzy match is fine — if in doubt, ask the user.
3. If a match is found, offer to run the existing workflow before starting from scratch.
4. If no match, proceed normally — the task may lead to creating a new workflow if it's repeatable.

**On startup**, if the user's first message sounds like a recurring business task (e.g., "process emails", "run triage", "pull analytics", "weekly report"), proactively check for matching workflows before responding.

## Listing Workflows

When the user asks "what can you do?", "list workflows", or "what workflows exist":

1. Read `workflows/index.md`
2. Present a clean list: name, description, and trigger phrases for each
3. If the index doesn't exist, scan `workflows/*/PLAN.md` and `workflows/*/WORKFLOW.md` as a fallback

## Editing a Workflow

Read the existing PLAN.md, present it, iterate with the user, save updates. Update `workflows/index.md` if name, description, or triggers changed.

## Deleting a Workflow

Confirm with the user, remove the directory, remove the row from `workflows/index.md`.

## Stock Workflows

Two workflows ship as starting points:

- **[process-source](../../workflows/process-source/PLAN.md)** — Interactive source processing. Gathers context, proposes actions to the user, executes the chosen action, and emits structured output for the Inbox app.
- **[triage-sources](../../workflows/triage-sources/PLAN.md)** — Automated batch triage. Discovers matching workflows for each source, falls back to default assessment, creates tasks and drafts.

## Turning a Session into a Workflow

After completing multi-step work in a session, the agent (or user) may recognize that the work is repeatable. To convert a completed session into a workflow:

1. Review the session's steps — what was done, in what order, using which skills/tools
2. Generalize: replace specific values with `{{parameters}}` (e.g., a specific date → `{{month}}`)
3. Enter Plan Mode and draft the PLAN.md based on the session's actual steps
4. Save and register in `workflows/index.md`

The process-source workflow does this automatically in its final step — after executing an action, it evaluates whether the session's work was repeatable and proposes creating a workflow if so.

## When to Use

- User wants to save a repeatable process
- User references an existing workflow
- User says "automate", "workflow", "schedule", "run every", "save this process"
- User asks to list, edit, or delete workflows
- A completed session followed a multi-step pattern that will recur (propose workflow creation)

## When NOT to Use

- One-off tasks that won't be repeated (just do them directly)
- Simple actions: single draft, single task creation, skip
- Simple data queries (use domain skills directly)
- Creating or editing skills (use skill-creator)
