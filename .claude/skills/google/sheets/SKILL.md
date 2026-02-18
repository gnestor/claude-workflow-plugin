---
name: google-sheets
description: Access, query, create, and modify Google Sheets data for financial analysis, inventory tracking, and business metrics. Supports reading, writing, formatting, and managing spreadsheets. Activate when the user asks about data in Google Sheets, particularly year-over-year profit comparisons, P&L statements, balance sheets, or other spreadsheet-based business metrics. For Shopify data use shopify skill, for website analytics use google-analytics skill.
---

# Google Sheets API Integration

## Purpose

This Skill enables complete interaction with Google Sheets through the Sheets API v4. It provides full read and write access to spreadsheets for financial analysis, business metrics, reporting, data manipulation, and spreadsheet management.

**Use this skill for:**
- Reading data from Google Sheets (financial reports, metrics, inventory)
- Creating new spreadsheets and organizing data
- Updating, appending, and clearing data
- Applying formatting and formulas via batch updates
- Copying sheets between spreadsheets
- Managing developer metadata

## When to Use

Activate this Skill when the user:

**Reading Data:**
- Asks about year-over-year profit or financial comparisons: "What's our year-over-year profit?"
- Wants to query P&L statements, balance sheets, or financial data in Google Sheets
- Needs to analyze data from spreadsheets: "Show me marketing KPIs by week"
- References specific Google Sheets by name or URL
- Asks about inventory velocity or other metrics tracked in spreadsheets
- Needs to compare financial periods (month-over-month, quarter-over-quarter)
- Wants to extract or analyze tabular data from Sheets

**Writing/Modifying Data:**
- Wants to create a new spreadsheet: "Create a new sheet for tracking expenses"
- Needs to update existing data: "Update the Q4 revenue numbers"
- Wants to append new rows: "Add this week's sales data to the tracker"
- Needs to clear data: "Clear last month's temporary data"
- Wants to apply formatting or formulas: "Format the revenue column as currency"
- Needs to copy sheets between spreadsheets: "Copy the template to a new spreadsheet"

## When NOT to Use

- **Shopify data**: Use shopify skill for orders, products, customers, inventory from Shopify
- **Website analytics**: Use google-analytics skill for traffic, page views, sessions, conversions
- **Database queries**: Use postgresql skill for cross-source database queries
- **Email**: Use gmail skill for email access

## Prerequisites

Google OAuth credentials in `.env` file:
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (obtained via authentication)

These credentials are shared across all Google API skills (Gmail, Google Analytics, Google Sheets, Google Drive).

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` - Full read/write access to spreadsheets
- `https://www.googleapis.com/auth/drive` - Access to Drive for spreadsheet management

### Authentication Options

**Option 1: Unified Authentication (Recommended)**

Authenticate once with all Google API scopes:

```bash
./lib/google-auth.ts
```

This grants access to Gmail, Google Analytics, Google Sheets, and Google Drive all at once.

**Option 2: Individual Skill Authentication**

Authenticate with just Sheets and Drive scopes:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-sheets/scripts/sheets-client.ts auth
```

**Note:** If you use multiple Google skills, Option 1 is recommended to avoid re-authenticating for each skill.

## Available Operations

The skill provides the following commands through the `sheets-client.ts` script. All commands use the format:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-sheets/scripts/sheets-client.ts <command> [args]
```

---

### Authentication

#### `auth` - Authenticate with Google OAuth

Obtain OAuth refresh token for Sheets API access.

**Recommended: Use unified authentication**
```bash
./lib/google-auth.ts
```

**Alternative: Authenticate for Sheets only**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-sheets/scripts/sheets-client.ts auth
```

**Process:**
1. Prints authorization URL
2. Opens browser for Google OAuth consent
3. Prompts to paste authorization code
4. Saves refresh token to `.env` automatically

**Note:** Only needed once per Google account. Token is shared with all Google API skills (Gmail, Google Analytics, Google Drive).

---

### Read Operations

#### `list-sheets` - List all sheets in a spreadsheet

```bash
sheets-client.ts list-sheets <spreadsheet-id-or-url>
```

**Returns:** Spreadsheet title, sheet names, sheet IDs, row/column counts

**Use when:** Discovering available sheets or confirming sheet names before querying.

---

#### `get` - Get values from a range

```bash
sheets-client.ts get <spreadsheet-id-or-url> '<range>' [--formatted|--unformatted|--formula]
```

**Parameters:**
- `spreadsheet-id-or-url`: Spreadsheet ID or full Google Sheets URL
- `range`: A1 notation (e.g., `"Sheet1!A1:D10"`, `"'P&L Statement'!A1:Z100"`)
- `--formatted`: Return formatted values (default) - e.g., "($1,234.56)", "15%"
- `--unformatted`: Return unformatted values - e.g., -1234.56, 0.15
- `--formula`: Return formula values - e.g., "=SUM(A1:A10)"

**Returns:** Range metadata and 2D array of values

**Examples:**
```bash
# Get formatted data
sheets-client.ts get 1o_jWQs... "'P&L Statement'!A1:Z100"

# Get numeric values for calculations
sheets-client.ts get 1o_jWQs... "'P&L Statement'!A1:Z100" --unformatted
```

---

#### `batch-get` - Get values from multiple ranges

```bash
sheets-client.ts batch-get <spreadsheet-id-or-url> '<range1>' '<range2>' ... [--formatted|--unformatted|--formula]
```

**Returns:** Array of range results with metadata and values for each range

**Use when:** Querying multiple sheets or non-contiguous ranges efficiently.

---

#### `get-by-filter` - Get spreadsheet metadata by data filter

```bash
sheets-client.ts get-by-filter <spreadsheet-id-or-url> '<filters-json>' [--include-grid-data]
```

**Parameters:**
- `filters-json`: JSON array of data filter objects
- `--include-grid-data`: Include cell data in response

**Use when:** Filtering spreadsheet metadata based on specific criteria.

---

#### `batch-get-by-filter` - Get values by data filter

```bash
sheets-client.ts batch-get-by-filter <spreadsheet-id-or-url> '<filters-json>' [--formatted|--unformatted|--formula]
```

**Parameters:**
- `filters-json`: JSON array of data filter objects (e.g., filters by named ranges, developer metadata)

**Use when:** Querying data based on filters rather than explicit ranges.

---

### Write Operations

#### `create` - Create a new spreadsheet

```bash
sheets-client.ts create <title> [sheet1] [sheet2] ...
```

**Parameters:**
- `title`: Spreadsheet title
- `sheet1`, `sheet2`, ...: Optional sheet names to create

**Returns:** Complete spreadsheet object including ID and URL

**Example:**
```bash
sheets-client.ts create "Q1 2024 Revenue Tracker" "Sales" "Expenses" "Summary"
```

---

#### `update` - Update values in a range

```bash
sheets-client.ts update <spreadsheet-id-or-url> '<range>' '<values-json>' [--raw|--user-entered]
```

**Parameters:**
- `range`: A1 notation range
- `values-json`: JSON array of arrays (e.g., `'[["A1","B1"],["A2","B2"]]'`)
- `--raw`: Values not parsed (literals)
- `--user-entered`: Parse values as if user typed them (default) - formulas evaluated

**Returns:** Update result with cells updated count

**Example:**
```bash
sheets-client.ts update 1o_jWQs... "Sheet1!A1:B2" '[["Name","Age"],["John","30"]]'
```

---

#### `append` - Append values to a range

```bash
sheets-client.ts append <spreadsheet-id-or-url> '<range>' '<values-json>' [--raw|--user-entered] [--overwrite|--insert-rows]
```

**Parameters:**
- `range`: A1 notation range (starting point for append)
- `values-json`: JSON array of arrays
- `--raw`: Values not parsed
- `--user-entered`: Parse values (default)
- `--overwrite`: Overwrite existing data (default)
- `--insert-rows`: Insert new rows for data

**Returns:** Append result with update details

**Example:**
```bash
sheets-client.ts append 1o_jWQs... "Sheet1!A1:B1" '[["New","Row"]]' --insert-rows
```

---

#### `clear` - Clear values from a range

```bash
sheets-client.ts clear <spreadsheet-id-or-url> '<range>'
```

**Parameters:**
- `range`: A1 notation range to clear

**Returns:** Clear result confirmation

**Example:**
```bash
sheets-client.ts clear 1o_jWQs... "Sheet1!A1:B10"
```

---

#### `batch-update` - Update multiple ranges

```bash
sheets-client.ts batch-update <spreadsheet-id-or-url> '<data-json>' [--raw|--user-entered]
```

**Parameters:**
- `data-json`: JSON array of `{range, values}` objects

**Returns:** Batch update result with total cells updated

**Example:**
```bash
sheets-client.ts batch-update 1o_jWQs... '[{"range":"Sheet1!A1:B1","values":[["X","Y"]]},{"range":"Sheet2!A1:B1","values":[["P","Q"]]}]'
```

---

#### `batch-clear` - Clear multiple ranges

```bash
sheets-client.ts batch-clear <spreadsheet-id-or-url> '<range1>' '<range2>' ...
```

**Returns:** Batch clear result with cleared ranges

**Example:**
```bash
sheets-client.ts batch-clear 1o_jWQs... "Sheet1!A1:B10" "Sheet2!C1:D5"
```

---

### Advanced Operations

#### `batch-update-spreadsheet` - Apply formatting, formulas, and structural changes

```bash
sheets-client.ts batch-update-spreadsheet <spreadsheet-id-or-url> '<requests-json>'
```

**Parameters:**
- `requests-json`: JSON array of batch update request objects (formatting, adding sheets, formulas, etc.)

**Use for:**
- Cell formatting (colors, fonts, borders)
- Adding/removing sheets
- Setting formulas
- Merging cells
- Setting conditional formatting
- And more (see [Sheets API batchUpdate reference](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate))

**Example:**
```bash
sheets-client.ts batch-update-spreadsheet 1o_jWQs... '[{"addSheet":{"properties":{"title":"New Sheet"}}}]'
```

---

#### `batch-update-by-filter` - Update values by data filter

```bash
sheets-client.ts batch-update-by-filter <spreadsheet-id-or-url> '<data-json>' [--raw|--user-entered]
```

**Parameters:**
- `data-json`: JSON array of `{dataFilter, values}` objects

**Use when:** Updating based on filters rather than explicit ranges.

---

#### `batch-clear-by-filter` - Clear values by data filter

```bash
sheets-client.ts batch-clear-by-filter <spreadsheet-id-or-url> '<filters-json>'
```

**Parameters:**
- `filters-json`: JSON array of data filter objects

**Use when:** Clearing based on filters rather than explicit ranges.

---

#### `copy-sheet` - Copy a sheet to another spreadsheet

```bash
sheets-client.ts copy-sheet <source-spreadsheet-id> <sheet-id> <destination-spreadsheet-id>
```

**Parameters:**
- `source-spreadsheet-id`: Source spreadsheet ID or URL
- `sheet-id`: Numeric sheet ID (from `list-sheets`)
- `destination-spreadsheet-id`: Destination spreadsheet ID or URL

**Returns:** Details of copied sheet in destination

**Example:**
```bash
sheets-client.ts copy-sheet 1o_jWQs... 123456 1abc...
```

---

### Developer Metadata Operations

#### `get-metadata` - Get developer metadata by ID

```bash
sheets-client.ts get-metadata <spreadsheet-id-or-url> <metadata-id>
```

**Use when:** Retrieving custom metadata attached to spreadsheet elements.

---

#### `search-metadata` - Search for developer metadata

```bash
sheets-client.ts search-metadata <spreadsheet-id-or-url> '<filters-json>'
```

**Parameters:**
- `filters-json`: JSON array of metadata filter objects

**Use when:** Finding metadata by key, value, or location.

## Natural Language to Query Process

When a user asks a natural language question about spreadsheet data, follow this process:

### Step 1: Identify the Spreadsheet

Map user's request to specific spreadsheet:
- "year-over-year profit", "P&L", "profit and loss" → P&L Statement (`1o_jWQs1KjRN1aEqFDH0B1hIsq5Lye_Nu030kuvizVOs`)
- "balance sheet", "assets", "liabilities" → Balance Sheet (same spreadsheet ID, different sheet)
- "marketing KPIs", "weekly performance" → Marketing KPIs spreadsheet (`1gfnK2zgeKx7DS-9bkm2No89UodU9oRWWjaQrie7WTlc`)
- "inventory velocity", "product turnover" → Inventory spreadsheet (`1BLorqoadJW1iTn38qFtoGn_4so9P-6Kw6tta-zg7gFA`)

See `references/financial-sheets.md` for complete list of spreadsheets and their IDs.

### Step 2: Determine the Sheet and Range

1. Run `list-sheets` to see available sheets in the spreadsheet
2. Identify the correct sheet name
3. Determine the range to query:
   - For full sheet: `'Sheet Name'!A1:Z1000` (adjust based on sheet size)
   - For specific area: Use narrower range if known

### Step 3: Choose Render Option

- **Formatted** (default): For display purposes, preserves currency formatting, percentages
- **Unformatted**: For calculations, returns raw numeric values
- **Formula**: For understanding how values are calculated

For financial calculations (e.g., year-over-year profit), use `--unformatted`.

### Step 4: Execute Query

Run the `get` or `batch-get` command with the determined parameters.

### Step 5: Process Results

Parse the returned data:

1. **Identify structure**:
   - First row typically contains headers (time periods, column labels)
   - First column typically contains row labels (metric names)
   - Data starts at row 2, column B

2. **Find target metrics**:
   - Search for specific row labels (e.g., "Net Income", "Profit/Loss", "Revenue")
   - Extract values from those rows

3. **Calculate comparisons**:
   - For year-over-year: Compare same period in different years
   - Calculate absolute change: `current - previous`
   - Calculate percentage change: `((current - previous) / previous) * 100`

### Step 6: Answer the Question

Format the results clearly:
- State the metrics being compared
- Show absolute values and percentage changes
- Provide context (time periods, trends)
- Highlight significant findings

## Reference Files

Detailed information available in `references/` directory:

- **workflow-examples.md** - Step-by-step examples for common operations (YoY analysis, creating spreadsheets, batch updates, formatting, copying templates)
- **financial-sheets.md** - Complete list of financial spreadsheets with IDs, URLs, sheet names, and common query patterns

Consult these files when identifying spreadsheets or building queries.

## Security Notes

- Never expose OAuth credentials in output
- Refresh token stored in `.env` (never commit to version control)
- API uses full read/write scopes (`spreadsheets`, `drive`)
- **Can create, modify, and delete spreadsheet data** - use write operations carefully
- Always confirm with user before making destructive changes (clearing, deleting data)
- Respects Google Sheets sharing permissions
- Test write operations on non-production spreadsheets first

## Tips & Gotchas

### Shell Escaping with Sheet Names Containing Spaces

The `update` command can fail when sheet names contain spaces due to shell escaping issues with the `!` character. **Use `batch-update` instead** with a JSON file approach:

```bash
# This may fail due to shell escaping:
sheets-client.ts update <id> "My Sheet!A1:B1" '[["value"]]'

# Use batch-update with heredoc instead:
cat <<'EOF' > /tmp/data.json
[{"range": "My Sheet!A1:B1", "values": [["value"]]}]
EOF
sheets-client.ts batch-update <id> "$(cat /tmp/data.json)"
```

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

When currency values are stored with `$` symbols (e.g., "$1,234.56"), you need to strip formatting before calculations:

```
# Convert "$1,234.56" to numeric 1234.56:
=VALUE(SUBSTITUTE(SUBSTITUTE(A1,"$",""),",",""))

# Use in SUMPRODUCT:
=SUMPRODUCT((condition)*(VALUE(SUBSTITUTE(SUBSTITUTE(AmountRange,"$",""),",",""))))
```

### Wildcard Matching in SUMIFS/COUNTIFS/MAXIFS

Use `"*"&A1&"*"` pattern for partial text matching:

```
# Count rows where column B contains the value in A1:
=COUNTIF(B:B, "*"&A1&"*")

# Sum where description contains PO number:
=SUMIFS(AmountCol, DescriptionCol, "*"&PONumber&"*")
```

### Complex Formulas with SUMPRODUCT

For conditional sums with text matching, SUMPRODUCT is more flexible than SUMIFS:

```
# Sum amounts where description contains search term AND status = "Paid":
=SUMPRODUCT(
  (ISNUMBER(SEARCH(A2, DescriptionRange))) *
  (StatusRange="Paid") *
  (AmountRange)
)
```

### Type Mismatches in VLOOKUP/MATCH (Text vs Number)

VLOOKUP and MATCH are **type-sensitive** in Google Sheets. A text `"1234"` won't match a number `1234`. This is common with IDs/check numbers stored as text in one sheet and numbers in another.

**For ARRAYFORMULA-compatible type-agnostic matching**, use REGEXMATCH with JOIN:

```
# Check if a value from column F exists in Payments!B column (regardless of text/number type):
=ARRAYFORMULA(IF(LEN(A2:A100)=0,"",
  IF(LEN(F2:F100)=0,"No Match",
    IF(REGEXMATCH(
      ","&JOIN(",",TEXT(Payments!$B$2:$B$72,"@"))&",",
      ","&TEXT(F2:F100,"@")&","
    ),"Found","Not Found")
  )
))
```

**For individual row formulas**, use `TEXT(...,"@")` to force both sides to text:

```
# Type-agnostic MATCH (use with Ctrl+Shift+Enter or in Google Sheets auto-array):
=INDEX(Payments!$A$2:$A$72, MATCH(1, --EXACT(TEXT(Payments!$B$2:$B$72,"@"), TEXT(F2,"@")), 0))
```

**Key insight:** `COUNTIF`, `MATCH`, and `INDEX/MATCH` do NOT work inside `ARRAYFORMULA`. Use `VLOOKUP` (works in ARRAYFORMULA) or the `REGEXMATCH+JOIN` pattern above for array-compatible lookups.

### ARRAYFORMULA with Mixed-Type Columns

When using `ARRAYFORMULA` to mirror a column that has mixed types (text IDs like "S35786" and numeric IDs like "4905"), the `IF(col="","",col)` pattern can cause `#REF!` errors.

**Fix:** Use `LEN()` instead of `=""` for the empty check:

```
# May error with mixed types:
=ARRAYFORMULA(IF(Sheet!A2:A="","",Sheet!A2:A))

# Works reliably:
=ARRAYFORMULA(IF(LEN(Sheet!A2:A100)=0,"",Sheet!A2:A100))
```

Also prefer **bounded ranges** (A2:A100) over open-ended ranges (A2:A) when possible.

### Formatting with batch-update-spreadsheet

Use `repeatCell` requests to format ranges. Get the `sheetId` from `list-sheets`:

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
| Missing OAuth credentials | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` to `.env`; run `auth` |
| Failed to get access token | Re-run `auth` command; verify `.env` credentials |
| Sheets API error | Enable Sheets API in Google Cloud Console; verify spreadsheet ID |
| Range not found | Verify sheet name with `list-sheets`; use quotes: `'P&L Statement'!A1:Z100` |
| Permission denied | Check spreadsheet sharing; ensure OAuth scopes include `spreadsheets` |
| Invalid JSON | Use single quotes around JSON; validate syntax before passing |
| Write operation failed | Verify edit permissions; ensure data is 2D array format |
| Date shows as 12/30/1899 | Formula returning 0; wrap in IF to return blank instead |
| Unable to parse range | Shell escaping issue; use `batch-update` with JSON file instead of `update` |
| VLOOKUP returns no match for matching values | Type mismatch (text vs number); use `TEXT(value,"@")` to normalize |
| ARRAYFORMULA #REF! with mixed-type column | Use `LEN()=0` instead of `=""` check; use bounded ranges |
