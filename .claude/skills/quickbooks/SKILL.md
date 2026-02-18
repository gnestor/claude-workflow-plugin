---
name: quickbooks
description: Accounting and financial data from QuickBooks Online including financial reports (P&L, Balance Sheet, Cash Flow), invoices, bills, customers, vendors, accounts, payments, and journal entries. Activate when the user asks about accounting data, financial reports, financial transactions, accounts payable/receivable, or bookkeeping. Not for cross-source analysis.
---

# QuickBooks Online API Integration

## Purpose

This Skill enables direct interaction with the QuickBooks Online (QBO) Accounting API. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to all core accounting entities including invoices, bills, customers, vendors, accounts, payments, and more.

**Use this skill for ACCOUNTING and FINANCIAL data from QuickBooks Online.**

## When to Use

Activate this Skill when the user:
- Mentions "QuickBooks", "QBO", or "accounting data"
- Asks about financial reports: "Show me the P&L", "Run the Balance Sheet"
- Asks about invoices: "Show me unpaid invoices"
- Asks about bills: "What bills are due this week?"
- Asks about customers: "List all active customers"
- Asks about vendors: "Find vendor by name"
- Asks about accounts: "Show chart of accounts"
- Asks about payments: "Recent payments received"
- Asks about financial transactions: "Journal entries this month"
- Asks about aging reports: "Show aged receivables"
- Needs to create or update accounting records
- References accounts payable or accounts receivable

## When NOT to Use

- **Shopify data**: Use shopify skill for orders, products, inventory
- **Cross-source analysis**: Use postgresql skill when joining QBO data with other sources (e.g., "Compare QBO invoices with Shopify orders")
- **Website analytics**: Use google-analytics skill for traffic and visitor data

## Prerequisites

QuickBooks API credentials in `.env` file:
- `QUICKBOOKS_CLIENT_ID` - OAuth2 Client ID from Intuit Developer Portal
- `QUICKBOOKS_CLIENT_SECRET` - OAuth2 Client Secret
- `QUICKBOOKS_ENVIRONMENT` - Either "sandbox" or "production"
- `QUICKBOOKS_REFRESH_TOKEN` - OAuth2 refresh token (obtained via auth flow)
- `QUICKBOOKS_REALM_ID` - Company ID (obtained via auth flow)

## Setup Instructions

### 1. Create Intuit Developer Application

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Create a new app or select existing one
3. Under "Keys & credentials", note the Client ID and Client Secret
4. For production access, apply through the Intuit Developer Portal
5. Select required scopes: `com.intuit.quickbooks.accounting`

### 2. Configure Environment Variables

Add to `.env` file:
```bash
QUICKBOOKS_CLIENT_ID="your-client-id"
QUICKBOOKS_CLIENT_SECRET="your-client-secret"
QUICKBOOKS_ENVIRONMENT="production"  # or "sandbox"
```

### 3. Authenticate

Run the authentication command to obtain refresh token and realm ID:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/quickbooks/scripts/qbo-client.ts auth
```

This will:
1. Open your browser to Intuit's OAuth consent page
2. After authorization, you'll be redirected to a callback URL
3. Paste the full callback URL back into the terminal
4. Save refresh token and realm ID to `.env` automatically

**Note:** The refresh token rotates with each API call and is automatically saved to `.env`.

## Available Operations

### 1. Authenticate

Obtain OAuth refresh token and realm ID.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/quickbooks/scripts/qbo-client.ts auth
```

### 2. Get Company Info

Retrieve company information and configuration.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts company-info
```

### 3. List Accounts (Chart of Accounts)

Get all accounts in the chart of accounts.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-accounts [account-type]
```

Parameters:
- `account-type` (optional): Filter by type (Bank, Accounts Receivable, Accounts Payable, Income, Expense, etc.)

### 4. Get/Search/Create/Update/Delete Entities

The following entities are supported with full CRUD operations:

| Entity | Description |
|--------|-------------|
| Account | Chart of accounts entries |
| Bill | Bills from vendors (accounts payable) |
| BillPayment | Payments made to vendors |
| Customer | Customer records |
| Employee | Employee records |
| Estimate | Quotes/estimates for customers |
| Invoice | Customer invoices (accounts receivable) |
| Item | Products and services |
| JournalEntry | Manual journal entries |
| Payment | Payments received from customers |
| Purchase | Purchases (checks, credit card charges, etc.) |
| Vendor | Vendor/supplier records |

#### Get Entity by ID

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts get <entity-type> <id>
```

Example:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts get Invoice 123
```

#### Search/Query Entities

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query <entity-type> [where-clause] [order-by] [limit]
```

Example:
```bash
# Get all active customers
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Customer "Active = true"

# Get unpaid invoices
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Invoice "Balance > '0'"

# Get recent bills
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Bill "" "MetaData.CreateTime DESC" 10
```

#### Create Entity

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create <entity-type> '<json-data>'
```

Example:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create Customer '{"DisplayName": "New Customer", "PrimaryEmailAddr": {"Address": "customer@example.com"}}'
```

#### Update Entity

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts update <entity-type> '<json-data>'
```

Note: Update requires the entity ID and SyncToken in the JSON data.

Example:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts update Customer '{"Id": "123", "SyncToken": "0", "DisplayName": "Updated Name"}'
```

#### Delete Entity

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts delete <entity-type> <id> <sync-token>
```

Example:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts delete Invoice 123 0
```

### 5. Convenience Commands

#### List Customers

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-customers [active-only]
```

#### List Vendors

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-vendors [active-only]
```

#### List Invoices

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-invoices [status] [limit]
```

Parameters:
- `status`: "unpaid", "paid", or "all" (default: "all")
- `limit`: Maximum results (default: 100)

#### List Bills

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-bills [status] [limit]
```

Parameters:
- `status`: "unpaid", "paid", or "all" (default: "all")
- `limit`: Maximum results (default: 100)

#### List Items (Products/Services)

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-items [type]
```

Parameters:
- `type`: "Inventory", "Service", "NonInventory", or "all" (default: "all")

### 6. Financial Reports

Run financial reports with optional date ranges.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts report <report-type> [start-date] [end-date]
```

#### Supported Report Types

| Report | Description |
|--------|-------------|
| ProfitAndLoss | Income statement summary |
| ProfitAndLossDetail | Detailed income statement |
| BalanceSheet | Balance sheet summary |
| BalanceSheetDetail | Detailed balance sheet |
| CashFlow | Cash flow statement |
| TrialBalance | Trial balance report |
| GeneralLedger | General ledger transactions |
| AccountList | List of all accounts |
| CustomerBalance | Customer balances summary |
| CustomerBalanceDetail | Detailed customer balances |
| CustomerIncome | Revenue by customer |
| VendorBalance | Vendor balances summary |
| VendorBalanceDetail | Detailed vendor balances |
| AgedPayables | Accounts payable aging |
| AgedPayableDetail | Detailed AP aging |
| AgedReceivables | Accounts receivable aging |
| AgedReceivableDetail | Detailed AR aging |
| TransactionList | List of all transactions |

#### Examples

```bash
# Profit and Loss for 2024
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts report ProfitAndLoss 2024-01-01 2024-12-31

# Balance Sheet as of today
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts report BalanceSheet

# Aged Receivables
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts report AgedReceivables
```

## Natural Language to Query Translation

When a user asks a natural language question about QuickBooks data, follow this process:

### Step 1: Identify the Entity Type

Map natural language terms to QBO entity types:
- "invoices", "sales", "AR" → Invoice
- "bills", "payables", "AP" → Bill
- "customers", "clients" → Customer
- "vendors", "suppliers" → Vendor
- "accounts", "chart of accounts" → Account
- "payments received" → Payment
- "payments made", "bill payments" → BillPayment
- "products", "services", "items" → Item
- "journal entries", "adjustments" → JournalEntry
- "quotes", "estimates" → Estimate
- "purchases", "expenses" → Purchase
- "employees", "staff" → Employee

### Step 2: Determine Filter Conditions

Convert natural language filters to QBO query syntax:

**Status filters:**
- "unpaid invoices" → `Balance > '0'`
- "paid bills" → `Balance = '0'`
- "active customers" → `Active = true`
- "inactive vendors" → `Active = false`

**Date filters:**
- "this month" → `TxnDate >= 'YYYY-MM-01'`
- "last 30 days" → `TxnDate >= 'YYYY-MM-DD'`
- "due this week" → `DueDate <= 'YYYY-MM-DD'`

**Amount filters:**
- "over $1000" → `TotalAmt > '1000'`
- "less than $500" → `TotalAmt < '500'`

### Step 3: Construct the Query

Build the query using QBO's SQL-like syntax:

```
SELECT * FROM EntityType WHERE conditions ORDER BY field [ASC|DESC] MAXRESULTS limit
```

### Step 4: Execute and Interpret Results

- Use the `query` command with appropriate parameters
- Parse the response and present in a clear format
- Aggregate if needed (totals, counts, etc.)

## Query Syntax Reference

QBO uses a SQL-like query language. Key syntax elements:

### Operators
- `=` - Equals
- `!=` - Not equals
- `<`, `<=`, `>`, `>=` - Comparison
- `IN` - In list: `Status IN ('Open', 'Pending')`
- `LIKE` - Pattern match: `DisplayName LIKE '%Smith%'`

### Common Fields by Entity

**Invoice:**
- `Id`, `DocNumber`, `TxnDate`, `DueDate`
- `TotalAmt`, `Balance`
- `CustomerRef` (customer ID)

**Bill:**
- `Id`, `DocNumber`, `TxnDate`, `DueDate`
- `TotalAmt`, `Balance`
- `VendorRef` (vendor ID)

**Customer:**
- `Id`, `DisplayName`, `CompanyName`
- `PrimaryEmailAddr`, `PrimaryPhone`
- `Balance`, `Active`

**Vendor:**
- `Id`, `DisplayName`, `CompanyName`
- `PrimaryEmailAddr`, `PrimaryPhone`
- `Balance`, `Active`

**Account:**
- `Id`, `Name`, `FullyQualifiedName`
- `AccountType`, `AccountSubType`
- `CurrentBalance`, `Active`

### Example Queries

```sql
-- Active customers with balance
SELECT * FROM Customer WHERE Active = true AND Balance > '0'

-- Unpaid invoices from this month
SELECT * FROM Invoice WHERE Balance > '0' AND TxnDate >= '2025-01-01'

-- Vendors with "Supply" in name
SELECT * FROM Vendor WHERE DisplayName LIKE '%Supply%'

-- Recent journal entries
SELECT * FROM JournalEntry ORDERBY MetaData.CreateTime DESC MAXRESULTS 20
```

## Reference Files

Detailed examples and documentation are available in the `references/` directory:

- **workflow-examples.md** - Step-by-step workflow examples for common tasks
- **query-syntax.md** - Complete QBO query language reference
- **entity-schemas.md** - Field definitions for each entity type

## API Rate Limits

QuickBooks Online has the following rate limits:
- **Sandbox:** 500 requests per minute
- **Production:** 500 requests per minute per realm (company)
- **Concurrent requests:** 10 per realm

If rate limited:
- Wait 1 minute before retrying
- Reduce query frequency
- Use batch operations when available

## Security Notes

- Never expose `QUICKBOOKS_CLIENT_SECRET` or `QUICKBOOKS_REFRESH_TOKEN` in output
- Refresh tokens expire after 100 days of non-use (re-authenticate if needed)
- Always use HTTPS (API enforces this)
- Be cautious with mutations that modify financial data
- Warn before creating/updating/deleting accounting records

## Troubleshooting

**"Authentication failed"**
- Check `QUICKBOOKS_CLIENT_ID` and `QUICKBOOKS_CLIENT_SECRET` are correct
- Verify `QUICKBOOKS_REFRESH_TOKEN` is not expired
- Re-run `auth` command to get new tokens

**"Invalid realm" or "Company not found"**
- Verify `QUICKBOOKS_REALM_ID` is correct
- Check the app has access to the company
- Re-authenticate to get correct realm ID

**"Entity not found"**
- Verify the entity ID exists
- Check entity type is correct (case-sensitive)
- Use `query` command to list available entities

**"SyncToken mismatch"**
- Another user modified the record
- Fetch the latest version and use its SyncToken for updates

**"Required field missing"**
- Different entities have different required fields
- Check entity-schemas.md for required fields
- Use `get` to see example of valid entity structure

**"Rate limit exceeded"**
- Wait 1 minute before retrying
- Reduce request frequency
- Consider batching operations

