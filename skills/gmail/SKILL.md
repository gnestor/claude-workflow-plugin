---
name: gmail
description: Gmail inbox management and email operations. Use for reading, searching, analyzing, labeling, and organizing emails. Activate when the user mentions Gmail, inbox, email management, or wants to check, organize, or create tasks from emails.
---

# Gmail Inbox Management

## Purpose

This skill enables direct interaction with Gmail for email retrieval, analysis, task creation, and inbox organization. It helps prioritize and manage inboxes effectively.

## Authentication

Authentication is handled by the MCP server. All Gmail API access is managed through the server's OAuth credentials.

## When to Use

Activate this skill when the user:
- Mentions "Gmail", "inbox", or "email management"
- Wants to check unread or important emails: "what emails need my attention?"
- Needs to organize their inbox: "help me organize my emails"
- Wants to convert emails to tasks: "create tasks from my important emails"
- Needs to analyze email priority: "which emails are most urgent?"
- Wants to apply labels or archive emails
- References Gmail-specific operations

## Available Operations

Use `~~workspace` tools for all Gmail operations.

### List Unread Emails

Retrieve unread emails with details.

**Parameters:**
- `max-results` (optional): Maximum number of emails to return (default: 50)

### List Important Emails

Retrieve emails marked as important.

### Get Email Details

Get full details of a specific email by ID.

### Search Emails

Search for emails using Gmail search syntax.

### Analyze Email Priority

Analyze emails and categorize by priority (high, medium, low).

**Returns:**
- Email subject, sender, snippet
- Calculated priority score
- Priority category
- Reasoning for priority level

### Apply Label

Apply a label to specific emails.

### Archive Email

Archive (remove from inbox) specific email.

### Mark as Read

Mark specific email as read.

### Create Task from Email

Convert an email into a task (e.g., in Notion or another task manager).

## Instructions

When a user requests Gmail-related operations:

1. **Identify the operation type**:
   - Check unread/important → use list unread or list important
   - Organize inbox → use analyze priority to categorize
   - Search specific emails → use search with appropriate query
   - Get email details → use get email
   - Create tasks from emails → use create task
   - Apply labels → use apply label
   - Archive emails → use archive
   - Mark as read → use mark read

2. **Email filtering for task creation**:
   - Focus on emails that need the user's decision, approval, or direct action
   - Operational coordination emails may not need task creation
   - Only create tasks if action is required by the user

3. **For inbox organization workflow**:
   - Run analyze priority to get prioritized list
   - Present high-priority emails to user
   - Offer to create tasks for actionable emails
   - Apply labels for categorization
   - Archive low-priority emails if user confirms

4. **Process the response**:
   - Format results in a user-friendly way
   - For email lists, present as organized tables or lists
   - For priority analysis, group by priority level

5. **Handle errors gracefully**:
   - If authentication fails, note the MCP server connection issue
   - If quota exceeded, inform user of Gmail API limits
   - If permission denied, check OAuth scopes

## Gmail Search Syntax Reference

Common search operators:

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

## Security Notes

- Never expose OAuth credentials in output
- API has daily quota limits (check Google Cloud Console)
- Use read-only scopes when possible
- Always ask before archiving or deleting emails

## Troubleshooting

**"Authentication failed"**
- Verify the MCP server connection is active
- Check that OAuth scopes include Gmail permissions

**"Quota exceeded"**
- Gmail API has daily quota limits
- Wait 24 hours or request quota increase

**"Permission denied"**
- Ensure OAuth scope includes required permissions
- Re-authenticate if needed

## Privacy & Data Handling

- This skill only accesses emails explicitly requested
- No email data is stored locally (except temporary processing)
- All API calls go directly to Google's servers
- Task creation only happens when explicitly requested
