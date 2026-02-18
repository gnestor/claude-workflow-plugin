---
name: calendar
description: Google Calendar integration for accessing and managing calendar events, checking availability, and scheduling. Activate when the user mentions calendar, scheduling, availability, free/busy, or wants to view/create/update events. Supports multiple calendars including grant@your-company.com and grantnestor@gmail.com.
---

# Google Calendar Management

## Purpose

This Skill enables direct interaction with Google Calendar using the Calendar API. It provides event management, availability checking, and scheduling capabilities.

## When to Use

Activate this Skill when the user:
- Mentions "calendar", "schedule", or "availability"
- Wants to check what meetings they have: "what's on my calendar today?"
- Needs to see free/busy times: "when am I free this week?"
- Wants to create events: "schedule a meeting"
- Needs to modify events: "move my 2pm meeting to 3pm"
- References specific calendars (grant@your-company.com, grantnestor@gmail.com)

## Prerequisites

- Google Cloud Project with Calendar API enabled
- OAuth 2.0 credentials
- Environment variables set in `.env` file:
  - `GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID
  - `GOOGLE_CLIENT_SECRET` - OAuth 2.0 Client Secret
  - `GOOGLE_REDIRECT_URI` - OAuth redirect URI (default: http://localhost:3000/oauth2callback)
  - `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (obtained via authentication)

These credentials are shared across all Google API skills.

## Setup Instructions

### 1. Enable Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Google Calendar API"
4. Click "Enable"

### 2. Authenticate

If you already have a refresh token from another Google skill, you may need to re-authenticate to add the calendar scope:

```bash
./lib/google-auth.ts
```

This grants access to all Google skills including Calendar.

## Available Operations

### 1. List Calendars

List all calendars accessible to the user.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts list-calendars
```

### 2. Get Calendar

Get metadata for a specific calendar.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts get-calendar <calendar-id>
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts get-calendar grant@your-company.com
```

### 3. List Events

List events in a calendar. Defaults to today if no dates provided.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts list-events <calendar-id> [timeMin] [timeMax]
```

**Examples:**
```bash
# Today's events
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts list-events grant@your-company.com

# Events in date range
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts list-events grant@your-company.com "2026-01-28T00:00:00Z" "2026-01-28T23:59:59Z"
```

### 4. Get Event

Get details for a specific event.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts get-event <calendar-id> <event-id>
```

### 5. Create Event

Create a new calendar event.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts create-event <calendar-id> '<json>'
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts create-event grant@your-company.com '{"summary":"Team Meeting","start":{"dateTime":"2026-01-28T10:00:00-08:00"},"end":{"dateTime":"2026-01-28T11:00:00-08:00"}}'
```

### 6. Update Event

Update an existing event.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts update-event <calendar-id> <event-id> '<json>'
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts update-event grant@your-company.com abc123 '{"summary":"Updated Meeting Title"}'
```

### 7. Delete Event

Delete an event from a calendar.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts delete-event <calendar-id> <event-id>
```

### 8. Get Free/Busy

Query free/busy times across multiple calendars.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts get-freebusy '<json>'
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts get-freebusy '{"timeMin":"2026-01-28T00:00:00Z","timeMax":"2026-01-28T23:59:59Z","items":[{"id":"grant@your-company.com"},{"id":"grantnestor@gmail.com"}]}'
```

### 9. List Colors

Get available colors for calendars and events.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google/calendar/scripts/calendar-client.ts list-colors
```

### 10. Quick Add

Create an event from natural language text (Google interprets the text).

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts quick-add <calendar-id> <text>
```

**Example:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/calendar/scripts/calendar-client.ts quick-add grant@your-company.com "Meeting with Jake tomorrow at 2pm"
```

## Instructions

When a user requests calendar-related operations:

1. **Identify the operation type**:
   - View schedule → use `list-events`
   - Check availability → use `get-freebusy`
   - Create meeting → use `create-event` or `quick-add`
   - Modify event → use `update-event`
   - Cancel event → use `delete-event`
   - List calendars → use `list-calendars`

2. **Determine which calendars**:
   - `grant@your-company.com` - Work calendar
   - `grantnestor@gmail.com` - Personal calendar
   - Use both for comprehensive availability checking

3. **For availability queries**:
   - Use `get-freebusy` to check both calendars
   - Provide date/time range in ISO 8601 format
   - Results show busy periods only (not event details)

4. **For creating events**:
   - Use `create-event` with full JSON for precise control
   - Use `quick-add` for natural language (less precise)
   - Always include start and end times with timezone

5. **Event JSON format**:
   ```json
   {
     "summary": "Event Title",
     "description": "Event description",
     "location": "Meeting room or address",
     "start": {
       "dateTime": "2026-01-28T10:00:00-08:00"
     },
     "end": {
       "dateTime": "2026-01-28T11:00:00-08:00"
     },
     "attendees": [
       {"email": "person@example.com"}
     ]
   }
   ```

6. **Handle errors gracefully**:
   - If authentication fails, re-run unified auth
   - If calendar not found, list available calendars first
   - If event not found, verify event ID from list-events

## Your Brand Calendars

| Calendar | ID | Description |
|----------|-----|-------------|
| Work | `grant@your-company.com` | Primary work calendar |
| Personal | `grantnestor@gmail.com` | Personal calendar |

## Date/Time Format Reference

- **ISO 8601 with timezone**: `2026-01-28T10:00:00-08:00` (recommended)
- **ISO 8601 UTC**: `2026-01-28T18:00:00Z`
- **All-day events**: Use `date` instead of `dateTime`: `{"date": "2026-01-28"}`

## Tool Access

This Skill is restricted to:
- **Read**: For reading configuration
- **Bash**: For executing Deno scripts that call the Calendar API

## Security Notes

- Never expose OAuth credentials in output
- Calendar data may contain sensitive meeting details
- Always confirm before deleting events
- Verify calendar ID before creating events

## Troubleshooting

**"Authentication failed"**
- Re-run `./lib/google-auth.ts` to authenticate with calendar scope
- Verify environment variables are set

**"Calendar not found"**
- Run `list-calendars` to see available calendars
- Check calendar ID spelling (case-sensitive)

**"Event not found"**
- Run `list-events` to verify event exists
- Check if event is on a different calendar
