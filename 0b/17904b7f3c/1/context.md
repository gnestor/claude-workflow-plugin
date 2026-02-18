# Session Context

## User Prompts

### Prompt 1

Let's restructure agent-workspace as a plugin following the knowledge-work-plugins pattern: https://github.com/anthropics/knowledge-work-plugins.

- API clients should be MCP servers to handle auth, skills can provide context such as instructions, examples, schemas, and API reference. The API client parts of the skills should be replaced by official, hosted MCP servers. If not official hosted MCP server exists, propose vetted third-party servers.
- Users can install the plugin at the project lev...

