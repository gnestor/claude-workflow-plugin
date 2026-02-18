---
name: gmail
description: This skill should be used to access and manage Gmail inbox functionality including listing emails, analyzing priority, creating tasks from emails, applying labels, and organizing inbox. Activate when the user mentions Gmail, inbox organization, email management, or wants to convert emails to tasks. Can integrate with Notion to create tasks from important emails.
---

# Gmail Inbox Management

## Purpose

This Skill enables direct interaction with Gmail using the Gmail API. It provides email retrieval, analysis, task creation, and inbox organization capabilities to help prioritize and manage inboxes effectively.

## When to Use

Activate this Skill when the user:
- Mentions "Gmail", "inbox", or "email management"
- Wants to check unread or important emails: "what emails need my attention?"
- Needs to organize their inbox: "help me organize my emails"
- Wants to convert emails to tasks: "create tasks from my important emails"
- Needs to analyze email priority: "which emails are most urgent?"
- Wants to apply labels or archive emails
- References Gmail-specific operations

## Prerequisites

- Google Cloud Project with Gmail API enabled
- OAuth 2.0 credentials
- Environment variables set in `.env` file:
  - `GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID
  - `GOOGLE_CLIENT_SECRET` - OAuth 2.0 Client Secret
  - `GOOGLE_REDIRECT_URI` - OAuth redirect URI (default: http://localhost:3000/oauth2callback)
  - `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (obtained via authentication)
- Optional: `NOTION_API_TOKEN` for task creation integration

These credentials are shared across all Google API skills (Gmail, Google Analytics, Google Sheets, Google Drive).

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/oauth2callback`
5. Download credentials as JSON
6. Extract `client_id`, `client_secret`, and set in `.env`

### 3. Obtain Refresh Token

**Option 1: Unified Authentication (Recommended)**

Authenticate once with all Google API scopes:

```bash
./lib/google-auth.ts
```

This grants access to Gmail, Google Analytics, Google Sheets, and Google Drive all at once.

**Option 2: Gmail-Only Authentication**

Authenticate with just Gmail scopes:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/gmail/scripts/gmail-client.ts auth
```

This will:
- Open a browser for Google OAuth consent
- Save the refresh token to `.env` automatically
- Only needs to be run once

**Note:** If you use multiple Google skills, Option 1 is recommended to avoid re-authenticating for each skill.

## Available Operations

### 1. Authenticate

Obtain OAuth refresh token for API access.

**Recommended: Use unified authentication**
```bash
./lib/google-auth.ts
```

**Alternative: Authenticate for Gmail only**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/gmail/scripts/gmail-client.ts auth
```

### 2. List Unread Emails

Retrieve unread emails with details.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts list-unread [max-results]
```

**Parameters:**
- `max-results` (optional): Maximum number of emails to return (default: 50)

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts list-unread 10
```

### 3. List Important Emails

Retrieve emails marked as important.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts list-important [max-results]
```

### 4. Get Email Details

Get full details of a specific email by ID.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts get-email <message-id>
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts get-email 18c5a2b3f4d5e6f7
```

### 5. Search Emails

Search for emails using Gmail search syntax.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts search "<query>" [max-results]
```

**Examples:**
```bash
# Search for emails from a specific sender
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts search "from:john@example.com" 20

# Search for unread emails with subject
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts search "is:unread subject:invoice"

# Search for emails in date range
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts search "after:2025/01/01 before:2025/02/01"
```

### 6. Analyze Email Priority

Analyze emails and categorize by priority (high, medium, low).

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts analyze-priority [max-results]
```

**Returns:**
- Email subject, sender, snippet
- Calculated priority score
- Priority category
- Reasoning for priority level

### 7. Apply Label

Apply a label to specific emails.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts apply-label <message-id> <label-name>
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts apply-label 18c5a2b3f4d5e6f7 "Action Required"
```

### 8. Archive Email

Archive (remove from inbox) specific email.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts archive <message-id>
```

### 9. Mark as Read

Mark specific email as read.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gmail/scripts/gmail-client.ts mark-read <message-id>
```

### 10. Create Notion Task from Email

Convert an email into a Notion task in the Tasks database.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/gmail/scripts/gmail-client.ts create-task <message-id> [database-id]
```

**Parameters:**
- `message-id`: Gmail message ID
- `database-id` (optional): Notion database ID (defaults to the Tasks database: `fd81d5460ca54452817115bce4957403`)

**Example:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/gmail/scripts/gmail-client.ts create-task 18c5a2b3f4d5e6f7
```

## Instructions

When a user requests Gmail-related operations:

1. **Identify the operation type**:
   - Check unread/important → use `list-unread` or `list-important`
   - Organize inbox → use `analyze-priority` to categorize
   - Search specific emails → use `search` with appropriate query
   - Get email details → use `get-email`
   - Create tasks from emails → use `create-task` with Notion integration
   - Apply labels → use `apply-label`
   - Archive emails → use `archive`
   - Mark as read → use `mark-read`

2. **Email filtering for task creation**:
   - **Erin Plaster emails** (Product Development Manager): Only create tasks if:
     - Email is directly addressed to Grant (To: field)
     - Grant's name is explicitly mentioned in the email body or subject
     - Otherwise, these are operational coordination emails that Erin handles
   - **Product development/production emails**: Only create tasks if action required by Grant
   - Focus on emails that need Grant's decision, approval, or direct action

3. **For inbox organization workflow**:
   - Run `analyze-priority` to get prioritized list
   - Present high-priority emails to user
   - Offer to create Notion tasks for actionable emails
   - Apply labels for categorization
   - Archive low-priority emails if user confirms

4. **For task creation**:
   - Use `create-task` command with email ID
   - Task will be created in Notion Tasks database with:
     - Title from email subject
     - Content with sender, date, and email body
     - Link to original email
     - Priority based on analysis
     - Status set to "To Do"

5. **Execute the command**:
   - Run the appropriate Deno script command
   - Pass parameters as required

6. **Process the response**:
   - Parse JSON output from the script
   - Format results in a user-friendly way
   - For email lists, present as organized tables or lists
   - For priority analysis, group by priority level

7. **Handle errors gracefully**:
   - If authentication fails, run `auth` command to re-authenticate
   - If quota exceeded, inform user of Gmail API limits
   - If permission denied, check OAuth scopes

## Gmail Search Syntax Reference

Common search operators for the `search` command:

- `from:sender@email.com` - Emails from specific sender
- `to:recipient@email.com` - Emails to specific recipient
- `subject:keyword` - Emails with keyword in subject
- `is:unread` - Unread emails
- `is:important` - Important emails
- `is:starred` - Starred emails
- `has:attachment` - Emails with attachments
- `after:YYYY/MM/DD` - Emails after date
- `before:YYYY/MM/DD` - Emails before date
- `newer_than:2d` - Emails newer than 2 days (d=days, m=months, y=years)
- `older_than:1m` - Emails older than 1 month
- `label:labelname` - Emails with specific label
- `-label:inbox` - Emails not in inbox (archived)

Combine operators with spaces for AND, or use `OR` for alternatives.

## Priority Analysis Algorithm

The `analyze-priority` command uses the following criteria:

**High Priority:**
- From known important senders (bosses, clients, family)
- Contains urgent keywords (urgent, asap, deadline, important)
- Has been replied to by user (ongoing conversation)
- Marked as important by Gmail
- Contains invoice, payment, or financial keywords

**Medium Priority:**
- From frequent contacts
- Contains questions or requests
- Work-related but not urgent
- Newsletters from subscribed sources

**Low Priority:**
- Automated emails (no-reply addresses)
- Marketing/promotional content
- Social media notifications
- Old emails (>7 days unread)

## Integration with Notion

When creating tasks from emails, the skill automatically:

1. Creates a new page in the Notion Tasks database
2. Sets the title to the email subject
3. Adds email content as page body with:
   - Sender information
   - Email date
   - Email body (converted from HTML to Markdown)
   - Link to original Gmail thread
4. Sets initial status to "To Do"
5. Assigns priority based on email analysis
6. Tags with "Email" tag

## Tool Access

This Skill is restricted to:
- **Read**: For reading configuration and example files
- **Write**: For creating temporary files and Notion integration
- **Bash**: For executing Deno scripts that call the Gmail API

## Security Notes

- Never expose OAuth credentials in output
- Refresh tokens are stored in `.env` and should not be committed
- API has daily quota limits (check Google Cloud Console)
- Use read-only scopes when possible
- Always ask before archiving or deleting emails

## Troubleshooting

**"Authentication failed"**
- Run `auth` command to re-authenticate
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Verify OAuth credentials are valid in Google Cloud Console

**"Quota exceeded"**
- Gmail API has daily quota limits
- Check quota usage in Google Cloud Console
- Wait 24 hours or request quota increase

**"Permission denied"**
- Ensure OAuth scope includes required permissions
- Re-run `auth` command to grant additional scopes
- Check that Gmail API is enabled in Google Cloud Project

**"Invalid grant"**
- Refresh token may have expired
- Re-run `auth` command to get new refresh token
- Check that redirect URI matches in OAuth credentials

## Privacy & Data Handling

- This skill only accesses emails explicitly requested
- No email data is stored locally (except temporary processing)
- All API calls go directly to Google's servers
- Notion task creation only happens when explicitly requested
- Email content in Notion tasks can be deleted anytime

