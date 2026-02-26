/**
 * Standardized JSON output for CLI tools.
 * All tools output JSON to stdout on success, JSON to stderr on failure.
 */

export function success(data) {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

export function error(err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
}

export function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return String(err);
}
