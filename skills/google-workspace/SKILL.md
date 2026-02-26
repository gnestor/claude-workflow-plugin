---
name: google-workspace
description: Google Workspace integration covering Gmail, Google Drive, Google Sheets, and Google Calendar. Activate when the user asks about email, calendar, spreadsheets, file management, or Google Drive. Handles reading/writing emails, managing calendar events, spreadsheet operations, and file storage.
category: ~~workspace
service: Google Workspace
---

# Google Workspace

## Purpose

This skill enables interaction with Google Workspace services (Gmail, Drive, Sheets, Calendar) using the `~~workspace` client script. Provides comprehensive access to email, file management, spreadsheets, and calendars.

## When to Use

Activate this skill when the user:
- Asks about emails, inbox management, or sending emails (Gmail)
- Wants to search, download, upload, or organize files (Drive)
- Needs to read, write, or create spreadsheets (Sheets)
- Asks about calendar events, scheduling, or availability (Calendar)

## When NOT to Use

- **Shopify data**: Use shopify skill
- **Database queries**: Use postgresql skill
- **Website analytics**: Use google-analytics skill

## Client Script

**Path:** `skills/google-workspace/scripts/client.js`

### Commands

#### Gmail
| Command | Description |
|---------|-------------|
| `gmail-search` | Search Gmail messages (--query) [--max] |
| `gmail-list-unread` | List unread Gmail messages [--max] |
| `gmail-get` | Get full email with decoded body (--id) |
| `gmail-send` | Send email (--to, --subject, --body) [--cc, --bcc, --reply-to, --thread-id] |
| `gmail-manage-labels` | Add/remove labels (--id) [--add, --remove] |

#### Drive
| Command | Description |
|---------|-------------|
| `drive-search` | Search Drive files (--query) [--limit] |
| `drive-list` | List files in folder (--folder-id) [--limit] |
| `drive-download` | Download file (--file-id) [--output-path, --mime-type] |
| `drive-upload` | Upload file (--file-path) [--folder-id, --name] |

#### Sheets
| Command | Description |
|---------|-------------|
| `sheets-list` | List sheets in spreadsheet (--spreadsheet-id) |
| `sheets-get-range` | Get values (--spreadsheet-id, --range) [--render formatted/unformatted/formula] |
| `sheets-update-range` | Update values (--spreadsheet-id, --range, --values JSON) |
| `sheets-append` | Append rows (--spreadsheet-id, --range, --values JSON) |
| `sheets-create` | Create spreadsheet (--title) |

#### Calendar
| Command | Description |
|---------|-------------|
| `calendar-list` | List calendar events [--calendar-id, --time-min, --time-max] |
| `calendar-create` | Create event (--calendar-id, --summary, --start, --end) [--description, --location, --attendees] |
| `calendar-update` | Update event (--calendar-id, --event-id, --body JSON) |
| `calendar-delete` | Delete event (--calendar-id, --event-id) |

## Key API Concepts

**Gmail:** Search syntax (`from:`, `to:`, `is:unread`, `has:attachment`, etc.). Messages are fetched with full body decoding.

**Drive:** Search syntax (`name contains 'X'`, `mimeType='...'`). Google Workspace files must be exported (Docs->PDF/text, Sheets->CSV/XLSX).

**Sheets:** A1 notation for ranges (e.g., `'Sheet1!A1:D10'`). Values are 2D arrays. Render options: formatted, unformatted, formula.

**Calendar:** ISO 8601 datetime format with timezone. All-day events use date instead of dateTime.

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
// Gmail
const messages = await apiRequest('google-workspace', '/gmail/v1/users/me/messages?q=is:unread', { baseUrlOverride: 'https://gmail.googleapis.com' });
// Drive
const files = await apiRequest('google-workspace', '/drive/v3/files?q=name contains "budget"', { baseUrlOverride: 'https://www.googleapis.com' });
```

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

## Drive Search Syntax Reference

Google Drive queries use structured syntax: `field operator 'value'`

**By name:** `name contains 'budget'`
**By type:** `mimeType='application/vnd.google-apps.spreadsheet'`
**By date:** `modifiedTime > '2025-01-01T00:00:00'`
**By owner:** `'me' in owners`
**Shared files:** `sharedWithMe = true`
**In folder:** `'FOLDER_ID' in parents`
**Content search:** `fullText contains 'quarterly report'`

Combine with `and`, `or`, `not`. Use parentheses for grouping.

### Export Formats for Google Workspace Files

| File Type | Format | MIME Type |
|-----------|--------|-----------|
| Google Docs | PDF | `application/pdf` |
| Google Docs | DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Google Docs | Plain Text | `text/plain` |
| Google Sheets | XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Google Sheets | CSV | `text/csv` |
| Google Sheets | PDF | `application/pdf` |
| Google Slides | PPTX | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| Google Slides | PDF | `application/pdf` |

Non-Google Workspace files (uploaded PDFs, images, Office files) download directly without export.

## Sheets Tips & Gotchas

### Date Serial Numbers

Google Sheets stores dates as serial numbers (0 = December 30, 1899). When a date formula returns 0 or no match, it displays as "12/30/1899".

**Fix:** Wrap date formulas in IF to return blank instead of 0:
```
# Bad - shows 12/30/1899 when no match:
=MAXIFS(DateRange, CriteriaRange, "*search*")

# Good - shows blank when no match:
=IF(COUNTIF(CriteriaRange,"*search*")=0, "", MAXIFS(DateRange, CriteriaRange, "*search*"))
```

### Currency Values Stored as Text

Strip formatting before calculations when values contain `$` symbols:
```
=VALUE(SUBSTITUTE(SUBSTITUTE(A1,"$",""),",",""))
```

### Type Mismatches in VLOOKUP/MATCH

VLOOKUP and MATCH are type-sensitive. Text `"1234"` won't match number `1234`. Use `TEXT(value,"@")` to normalize.

### ARRAYFORMULA Limitations

`COUNTIF`, `MATCH`, and `INDEX/MATCH` do NOT work inside `ARRAYFORMULA`. Use `VLOOKUP` (works in ARRAYFORMULA) or the `REGEXMATCH+JOIN` pattern for array-compatible lookups.

Use `LEN()=0` instead of `=""` for empty checks with mixed types. Prefer bounded ranges (A2:A100) over open-ended ranges (A2:A).

### Render Options

- **formatted**: Display values like "($1,234.56)", "15%" (default)
- **unformatted**: Raw numeric values like -1234.56, 0.15 (best for calculations)
- **formula**: Formula text like "=SUM(A1:A10)"

## Calendar Date/Time Format Reference

- **ISO 8601 with timezone** (recommended): `2026-01-28T10:00:00-08:00`
- **ISO 8601 UTC**: `2026-01-28T18:00:00Z`
- **All-day events**: Use `date` instead of `dateTime`: `{"date": "2026-01-28"}`

### Event JSON Format

```json
{
  "summary": "Event Title",
  "description": "Event description",
  "location": "Meeting room or address",
  "start": { "dateTime": "2026-01-28T10:00:00-08:00" },
  "end": { "dateTime": "2026-01-28T11:00:00-08:00" },
  "attendees": [{ "email": "person@example.com" }]
}
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
