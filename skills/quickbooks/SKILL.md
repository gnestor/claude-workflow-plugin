---
name: quickbooks
description: Accounting and financial data from QuickBooks Online including financial reports (P&L, Balance Sheet, Cash Flow), invoices, bills, customers, vendors, accounts, payments, and journal entries. Activate when the user asks about accounting data, financial reports, financial transactions, accounts payable/receivable, or bookkeeping. Not for cross-source analysis.
---

# QuickBooks Online API Integration

## Purpose

This skill enables direct interaction with the QuickBooks Online (QBO) Accounting API using `~~accounting` tools. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to all core accounting entities including invoices, bills, customers, vendors, accounts, payments, and more.

**Use this skill for ACCOUNTING and FINANCIAL data from QuickBooks Online.**

Authentication is handled by the MCP server configuration.

## When to Use

Activate this skill when the user:
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

## Available Tools

The `~~accounting` MCP server provides tools for:
- **Company info** - Retrieve company information and configuration
- **Accounts** - List chart of accounts, filter by account type
- **Entity CRUD** - Get, search, create, update, delete for all entity types
- **Financial reports** - P&L, Balance Sheet, Cash Flow, Trial Balance, General Ledger, Aging reports, and more
- **Convenience queries** - List customers, vendors, invoices, bills, items with status filtering

### Supported Entity Types

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

### Supported Report Types

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

## Natural Language to Query Translation

When a user asks a natural language question about QuickBooks data, follow this process:

### Step 1: Identify the Entity Type

Map natural language terms to QBO entity types:
- "invoices", "sales", "AR" -> Invoice
- "bills", "payables", "AP" -> Bill
- "customers", "clients" -> Customer
- "vendors", "suppliers" -> Vendor
- "accounts", "chart of accounts" -> Account
- "payments received" -> Payment
- "payments made", "bill payments" -> BillPayment
- "products", "services", "items" -> Item
- "journal entries", "adjustments" -> JournalEntry
- "quotes", "estimates" -> Estimate
- "purchases", "expenses" -> Purchase
- "employees", "staff" -> Employee

### Step 2: Determine Filter Conditions

Convert natural language filters to QBO query syntax:

**Status filters:**
- "unpaid invoices" -> `Balance > '0'`
- "paid bills" -> `Balance = '0'`
- "active customers" -> `Active = true`
- "inactive vendors" -> `Active = false`

**Date filters:**
- "this month" -> `TxnDate >= 'YYYY-MM-01'`
- "last 30 days" -> `TxnDate >= 'YYYY-MM-DD'`
- "due this week" -> `DueDate <= 'YYYY-MM-DD'`

**Amount filters:**
- "over $1000" -> `TotalAmt > '1000'`
- "less than $500" -> `TotalAmt < '500'`

### Step 3: Construct the Query

Build the query using QBO's SQL-like syntax:

```
SELECT * FROM EntityType WHERE conditions ORDER BY field [ASC|DESC] MAXRESULTS limit
```

### Step 4: Execute and Interpret Results

- Use `~~accounting` query tools with appropriate parameters
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

- Never expose client secrets or refresh tokens in output
- Refresh tokens expire after 100 days of non-use
- Always use HTTPS (API enforces this)
- Be cautious with mutations that modify financial data
- Warn before creating/updating/deleting accounting records

## Troubleshooting

**"Authentication failed"**
- Verify MCP server configuration
- Re-authenticate if tokens have expired

**"Invalid realm" or "Company not found"**
- Verify realm ID is correct in MCP configuration
- Check the app has access to the company

**"Entity not found"**
- Verify the entity ID exists
- Check entity type is correct (case-sensitive)
- Use query tools to list available entities

**"SyncToken mismatch"**
- Another user modified the record
- Fetch the latest version and use its SyncToken for updates

**"Required field missing"**
- Different entities have different required fields
- Use get tools to see example of valid entity structure

**"Rate limit exceeded"**
- Wait 1 minute before retrying
- Reduce request frequency
- Consider batching operations
