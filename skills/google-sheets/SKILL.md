---
name: google-sheets
description: Access, query, create, and modify Google Sheets data for financial analysis, inventory tracking, and business metrics. Supports reading, writing, formatting, and managing spreadsheets. Activate when the user asks about data in Google Sheets, particularly year-over-year profit comparisons, P&L statements, balance sheets, or other spreadsheet-based business metrics.
---

# Google Sheets Integration

## Purpose

This skill enables complete interaction with Google Sheets through the Sheets API v4. It provides full read and write access to spreadsheets for financial analysis, business metrics, reporting, data manipulation, and spreadsheet management.

**Use this skill for:**
- Reading data from Google Sheets (financial reports, metrics, inventory)
- Creating new spreadsheets and organizing data
- Updating, appending, and clearing data
- Applying formatting and formulas via batch updates
- Copying sheets between spreadsheets
- Managing developer metadata

## Authentication

Authentication is handled by the MCP server. All Sheets API access is managed through the server's OAuth credentials.

## When to Use

Activate this skill when the user:

**Reading Data:**
- Asks about year-over-year profit or financial comparisons
- Wants to query P&L statements, balance sheets, or financial data in Google Sheets
- Needs to analyze data from spreadsheets
- References specific Google Sheets by name or URL
- Asks about inventory velocity or other metrics tracked in spreadsheets

**Writing/Modifying Data:**
- Wants to create a new spreadsheet
- Needs to update existing data
- Wants to append new rows
- Needs to clear data
- Wants to apply formatting or formulas
- Needs to copy sheets between spreadsheets

## When NOT to Use

- **Shopify data**: Use shopify skill for orders, products, customers, inventory
- **Website analytics**: Use google-analytics skill for traffic, page views, sessions
- **Database queries**: Use postgresql skill for cross-source database queries
- **Email**: Use gmail skill for email access

## Available Operations

Use `~~workspace` tools for all Google Sheets operations.

### Read Operations

#### List Sheets
List all sheets in a spreadsheet.
Returns: Spreadsheet title, sheet names, sheet IDs, row/column counts

#### Get Values
Get values from a range using A1 notation (e.g., `"Sheet1!A1:D10"`, `"'P&L Statement'!A1:Z100"`).

**Render options:**
- `formatted`: Return formatted values (default) - e.g., "($1,234.56)", "15%"
- `unformatted`: Return raw numeric values - e.g., -1234.56, 0.15
- `formula`: Return formula values - e.g., "=SUM(A1:A10)"

#### Batch Get
Get values from multiple ranges efficiently.

#### Get by Filter
Get spreadsheet metadata by data filter.

### Write Operations

#### Create
Create a new spreadsheet with optional sheet names.

#### Update
Update values in a range.

**Input options:**
- `raw`: Values not parsed (literals)
- `user-entered`: Parse values as if user typed them (default) - formulas evaluated

#### Append
Append values to a range with options for overwrite or insert rows.

#### Clear
Clear values from a range.

#### Batch Update
Update multiple ranges at once.

#### Batch Clear
Clear multiple ranges at once.

### Advanced Operations

#### Batch Update Spreadsheet
Apply formatting, formulas, and structural changes (cell formatting, adding/removing sheets, merging cells, conditional formatting, etc.).

#### Copy Sheet
Copy a sheet to another spreadsheet.

#### Developer Metadata
Get, search, and manage developer metadata on spreadsheet elements.

## Natural Language to Query Process

### Step 1: Identify the Spreadsheet
Map user's request to specific spreadsheet. See `references/financial-sheets.md` for complete list of spreadsheets and their IDs.

### Step 2: Determine the Sheet and Range
1. Run list sheets to see available sheets
2. Identify the correct sheet name
3. Determine the range to query

### Step 3: Choose Render Option
- **Formatted** (default): For display purposes
- **Unformatted**: For calculations
- **Formula**: For understanding how values are calculated

### Step 4: Execute Query
Run the appropriate command with determined parameters.

### Step 5: Process Results
1. Identify structure (headers in row 1, labels in column A)
2. Find target metrics
3. Calculate comparisons (year-over-year, percentage changes)

### Step 6: Answer the Question
Format results clearly with metrics, values, and context.

## Reference Files

Detailed information available in `references/` directory:

- **financial-sheets.md** - Complete list of financial spreadsheets with IDs, URLs, sheet names, and common query patterns
- **workflow-examples.md** - Step-by-step examples for common operations (YoY analysis, creating spreadsheets, batch updates, formatting, copying templates)

## Tips & Gotchas

### Date Serial Numbers and the Excel Epoch

Google Sheets stores dates as serial numbers where **0 = December 30, 1899** (the Excel epoch). When a date formula returns 0 or no match, it will display as "12/30/1899" if formatted as a date.

**Fix:** Wrap date formulas in IF to return blank instead of 0:
```
# Bad - will show 12/30/1899 when no match:
=MAXIFS(DateRange, CriteriaRange, "*search*")

# Good - shows blank when no match:
=IF(COUNTIF(CriteriaRange,"*search*")=0, "", MAXIFS(DateRange, CriteriaRange, "*search*"))
```

### Currency Values Stored as Text

When currency values are stored with `$` symbols (e.g., "$1,234.56"), strip formatting before calculations:
```
=VALUE(SUBSTITUTE(SUBSTITUTE(A1,"$",""),",",""))
```

### Wildcard Matching in SUMIFS/COUNTIFS/MAXIFS

Use `"*"&A1&"*"` pattern for partial text matching:
```
=COUNTIF(B:B, "*"&A1&"*")
```

### Complex Formulas with SUMPRODUCT

For conditional sums with text matching:
```
=SUMPRODUCT(
  (ISNUMBER(SEARCH(A2, DescriptionRange))) *
  (StatusRange="Paid") *
  (AmountRange)
)
```

### Type Mismatches in VLOOKUP/MATCH (Text vs Number)

VLOOKUP and MATCH are **type-sensitive** in Google Sheets. A text `"1234"` won't match a number `1234`.

**For ARRAYFORMULA-compatible type-agnostic matching**, use REGEXMATCH with JOIN:
```
=ARRAYFORMULA(IF(LEN(A2:A100)=0,"",
  IF(LEN(F2:F100)=0,"No Match",
    IF(REGEXMATCH(
      ","&JOIN(",",TEXT(Payments!$B$2:$B$72,"@"))&",",
      ","&TEXT(F2:F100,"@")&","
    ),"Found","Not Found")
  )
))
```

**Key insight:** `COUNTIF`, `MATCH`, and `INDEX/MATCH` do NOT work inside `ARRAYFORMULA`. Use `VLOOKUP` (works in ARRAYFORMULA) or the `REGEXMATCH+JOIN` pattern for array-compatible lookups.

### ARRAYFORMULA with Mixed-Type Columns

Use `LEN()` instead of `=""` for empty check with mixed types:
```
# Works reliably:
=ARRAYFORMULA(IF(LEN(Sheet!A2:A100)=0,"",Sheet!A2:A100))
```

Also prefer **bounded ranges** (A2:A100) over open-ended ranges (A2:A).

### Formatting with batch-update-spreadsheet

Use `repeatCell` requests to format ranges:
```json
[{
  "repeatCell": {
    "range": {
      "sheetId": 123456789,
      "startRowIndex": 1,
      "endRowIndex": 10,
      "startColumnIndex": 0,
      "endColumnIndex": 1
    },
    "cell": {
      "userEnteredFormat": {
        "numberFormat": {"type": "DATE", "pattern": "m/d/yyyy"}
      }
    },
    "fields": "userEnteredFormat.numberFormat"
  }
}]
```

Common format types: `DATE`, `CURRENCY`, `NUMBER`, `PERCENT`, `TEXT`

## Troubleshooting

| Error | Solution |
|-------|----------|
| Missing credentials | Verify MCP server connection is active |
| Sheets API error | Verify spreadsheet ID; ensure API is enabled |
| Range not found | Verify sheet name with list sheets; use quotes: `'P&L Statement'!A1:Z100` |
| Permission denied | Check spreadsheet sharing; ensure OAuth scopes include `spreadsheets` |
| Write operation failed | Verify edit permissions; ensure data is 2D array format |
| Date shows as 12/30/1899 | Formula returning 0; wrap in IF to return blank instead |
| VLOOKUP returns no match | Type mismatch (text vs number); use `TEXT(value,"@")` to normalize |
| ARRAYFORMULA #REF! | Use `LEN()=0` instead of `=""` check; use bounded ranges |

## Security Notes

- Never expose OAuth credentials in output
- API uses full read/write scopes
- **Can create, modify, and delete spreadsheet data** - use write operations carefully
- Always confirm with user before making destructive changes
- Respects Google Sheets sharing permissions
