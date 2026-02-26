---
name: quickbooks
description: Accounting and financial data from QuickBooks Online including financial reports (P&L, Balance Sheet, Cash Flow), invoices, bills, customers, vendors, accounts, payments, and journal entries. Activate when the user asks about accounting data, financial reports, financial transactions, accounts payable/receivable, or bookkeeping. Not for cross-source analysis.
category: ~~accounting
service: quickbooks
---

# QuickBooks

## Purpose

This skill enables direct interaction with the QuickBooks Online (QBO) Accounting API via a client script. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to all core accounting entities including invoices, bills, customers, vendors, accounts, payments, and more.

**Use this skill for ACCOUNTING and FINANCIAL data from QuickBooks Online.**

Authentication is handled automatically by `lib/auth.js`.

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

## Client Script

**Path:** `skills/quickbooks/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication is working |
| `query (SQL query string) [--query]` | Execute a QBO SQL-like query |
| `list-invoices [--limit, --start-date, --end-date]` | List invoices with optional filters |
| `get-invoice --id` | Get a specific invoice by ID |
| `list-expenses [--limit, --start-date, --end-date]` | List expenses with optional filters |
| `list-accounts [--type]` | List chart of accounts, optionally filtered by type |
| `get-report --report [--start-date, --end-date, --accounting-method]` | Run a financial report |

## Key API Concepts

QBO REST API v3. Uses a SQL-like query language for entity queries. Rate limit is 500 requests per minute per realm. Updates require a SyncToken (fetch latest version before modifying).

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

## Query Syntax Reference

QBO uses a SQL-like query language:

```
SELECT * FROM EntityType WHERE conditions ORDER BY field [ASC|DESC] MAXRESULTS limit
```

### Operators
- `=` - Equals
- `!=` - Not equals
- `<`, `<=`, `>`, `>=` - Comparison
- `IN` - In list: `Status IN ('Open', 'Pending')`
- `LIKE` - Pattern match: `DisplayName LIKE '%Smith%'`

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

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('quickbooks', '/v3/company/{realmId}/query?query=SELECT * FROM Invoice');
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
