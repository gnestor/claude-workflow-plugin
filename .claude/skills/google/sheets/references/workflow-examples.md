# Google Sheets Workflow Examples

Step-by-step examples for common Google Sheets operations.

## Year-over-Year Profit Analysis

**User request**: "What's our year-over-year profit?"

**Process**:
1. Get P&L data: `get 1o_jWQs1KjRN1aEqFDH0B1hIsq5Lye_Nu030kuvizVOs "'P&L Statement'!A1:Z100" --unformatted`
2. Parse the data to identify:
   - Header row with time periods (columns)
   - Net Income/Profit row (typically labeled "Net Income" or "Profit/Loss")
3. Extract profit values for:
   - Current period (e.g., "2024")
   - Same period last year (e.g., "2023")
4. Calculate:
   - Absolute change: `profit_2024 - profit_2023`
   - Percentage change: `((profit_2024 - profit_2023) / profit_2023) * 100`
5. Present results with context

## Multi-Sheet Analysis

**User request**: "Compare revenue and expenses across quarters"

**Process**:
1. Use `batch-get` to fetch multiple ranges or sheets
2. Process each range separately
3. Combine results for comparison
4. Calculate trends and insights

## Creating a New Tracking Spreadsheet

**User request**: "Create a new spreadsheet to track weekly sales"

**Process**:
1. Create spreadsheet: `create "Weekly Sales Tracker 2024" "Sales" "Summary"`
2. Note the returned spreadsheet ID
3. Add headers: `update <new-id> "Sales!A1:D1" '[["Week","Product","Quantity","Revenue"]]'`
4. Optionally add formulas in Summary sheet: `update <new-id> "Summary!A1:B1" '[["Total Revenue","=SUM(Sales!D:D)"]]'`

## Appending New Data

**User request**: "Add this week's sales data to the tracker"

**Process**:
1. Get current data to determine last row: `get <id> "Sales!A:A"`
2. Append new data: `append <id> "Sales!A2:D2" '[["Week 12","Widget","150","4500"]]' --insert-rows`
3. Verify: `get <id> "Sales!A:D" --formatted`

## Batch Updating Multiple Metrics

**User request**: "Update Q4 numbers across all financial sheets"

**Process**:
1. Prepare data structure with multiple ranges
2. Use `batch-update` to update all ranges at once:
   ```bash
   batch-update <id> '[
     {"range":"Revenue!D2:D5","values":[[100000],[110000],[105000],[115000]]},
     {"range":"Expenses!D2:D5","values":[[80000],[85000],[82000],[90000]]}
   ]'
   ```

## Applying Cell Formatting

**User request**: "Format the revenue column as currency with green background"

**Process**:
1. Use `batch-update-spreadsheet` with formatting requests:
   ```bash
   batch-update-spreadsheet <id> '[{
     "repeatCell": {
       "range": {"sheetId": 0, "startColumnIndex": 3, "endColumnIndex": 4},
       "cell": {
         "userEnteredFormat": {
           "numberFormat": {"type": "CURRENCY"},
           "backgroundColor": {"red": 0.8, "green": 1.0, "blue": 0.8}
         }
       },
       "fields": "userEnteredFormat(numberFormat,backgroundColor)"
     }
   }]'
   ```

## Copying Template Sheet

**User request**: "Copy the monthly report template to a new spreadsheet"

**Process**:
1. List sheets to get template sheet ID: `list-sheets <source-id>`
2. Create destination spreadsheet: `create "January 2024 Report"`
3. Copy template: `copy-sheet <source-id> <sheet-id> <destination-id>`
