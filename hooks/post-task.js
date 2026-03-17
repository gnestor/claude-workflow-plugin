/**
 * Post-task hook: commit and push changes to the current branch.
 *
 * Runs after the Stop hook prompt completes. Checks for uncommitted changes
 * in the git repo and, if found, creates a commit and pushes to the remote.
 * Skips silently if not in a git repo, no changes exist, or no remote is set.
 */

import { execFileSync } from "node:child_process";

function run(file, args = []) {
  return execFileSync(file, args, { encoding: "utf-8", stdio: "pipe" }).trim();
}

function tryRun(file, args = []) {
  try {
    return run(file, args);
  } catch {
    return null;
  }
}

// Must be inside a git repo
const gitRoot = tryRun("git", ["rev-parse", "--show-toplevel"]);
if (!gitRoot) process.exit(0);

// Check for any changes (staged, unstaged, untracked)
const status = tryRun("git", ["status", "--porcelain"]);
if (!status) process.exit(0); // Nothing to commit

// Build a short commit message from changed files
const changedFiles = status
  .split("\n")
  .map((l) => l.trim().split(" ").pop())
  .filter(Boolean);

const summary =
  changedFiles.length === 1
    ? changedFiles[0]
    : `${changedFiles.length} files`;

const branch = tryRun("git", ["branch", "--show-current"]) || "main";
const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
const message = `Update ${summary} [${timestamp}]`;

try {
  // Stage all changes (respects .gitignore)
  run("git", ["add", "-A"]);

  // Commit
  run("git", ["commit", "-m", message]);

  // Push if a remote is configured
  const remote = tryRun("git", ["remote"]);
  if (remote) {
    const trackingBranch = tryRun("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
    if (trackingBranch) {
      run("git", ["push"]);
    } else {
      // No tracking branch yet — set upstream on first push
      run("git", ["push", "--set-upstream", "origin", branch]);
    }
  }
} catch (err) {
  // Don't fail Claude Code's stop if git operations fail — just log
  process.stderr.write(`[post-task] Git commit/push failed: ${err.message}\n`);
}
