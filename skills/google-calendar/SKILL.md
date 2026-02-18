---
name: google-calendar
description: Google Calendar integration for accessing and managing calendar events, checking availability, and scheduling. Activate when the user mentions calendar, scheduling, availability, free/busy, or wants to view/create/update events.
---

# Google Calendar Management

## Purpose

This skill enables direct interaction with Google Calendar using the Calendar API. It provides event management, availability checking, and scheduling capabilities.

## Authentication

Authentication is handled by the MCP server. All Calendar API access is managed through the server's OAuth credentials.

## When to Use

Activate this skill when the user:
- Mentions "calendar", "schedule", or "availability"
- Wants to check what meetings they have: "what's on my calendar today?"
- Needs to see free/busy times: "when am I free this week?"
- Wants to create events: "schedule a meeting"
- Needs to modify events: "move my 2pm meeting to 3pm"

## Available Operations

Use `~~workspace` tools for all Google Calendar operations.

### List Calendars
List all calendars accessible to the user.

### Get Calendar
Get metadata for a specific calendar.

### List Events
List events in a calendar. Defaults to today if no dates provided.

**Parameters:**
- `calendar-id` - Calendar ID (email address)
- `timeMin` (optional) - Start of time range (ISO 8601)
- `timeMax` (optional) - End of time range (ISO 8601)

### Get Event
Get details for a specific event.

### Create Event
Create a new calendar event.

**Event JSON format:**
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

### Update Event
Update an existing event.

### Delete Event
Delete an event from a calendar.

### Get Free/Busy
Query free/busy times across multiple calendars.

**Parameters:**
- `timeMin` - Start of time range (ISO 8601)
- `timeMax` - End of time range (ISO 8601)
- `items` - Array of calendar IDs to check

### List Colors
Get available colors for calendars and events.

### Quick Add
Create an event from natural language text (Google interprets the text).

## Instructions

When a user requests calendar-related operations:

1. **Identify the operation type**:
   - View schedule -> use list events
   - Check availability -> use get free/busy
   - Create meeting -> use create event or quick add
   - Modify event -> use update event
   - Cancel event -> use delete event
   - List calendars -> use list calendars

2. **Determine which calendars**:
   - Use list calendars if unsure which calendars are available
   - Use both work and personal calendars for comprehensive availability checking

3. **For availability queries**:
   - Use get free/busy to check calendars
   - Provide date/time range in ISO 8601 format
   - Results show busy periods only (not event details)

4. **For creating events**:
   - Use create event with full JSON for precise control
   - Use quick add for natural language (less precise)
   - Always include start and end times with timezone

5. **Handle errors gracefully**:
   - If authentication fails, note MCP server connection issue
   - If calendar not found, list available calendars first
   - If event not found, verify event ID from list events

## Date/Time Format Reference

- **ISO 8601 with timezone**: `2026-01-28T10:00:00-08:00` (recommended)
- **ISO 8601 UTC**: `2026-01-28T18:00:00Z`
- **All-day events**: Use `date` instead of `dateTime`: `{"date": "2026-01-28"}`

## Security Notes

- Never expose OAuth credentials in output
- Calendar data may contain sensitive meeting details
- Always confirm before deleting events
- Verify calendar ID before creating events

## Troubleshooting

**"Authentication failed"**
- Verify the MCP server connection is active
- Ensure OAuth scopes include Calendar permissions

**"Calendar not found"**
- Run list calendars to see available calendars
- Check calendar ID spelling (case-sensitive)

**"Event not found"**
- Run list events to verify event exists
- Check if event is on a different calendar
