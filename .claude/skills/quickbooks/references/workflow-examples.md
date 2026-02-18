# QuickBooks Online Workflow Examples

This document provides step-by-step examples for common QuickBooks operations and comprehensive bookkeeping guides.

---

# PART 1: BOOKKEEPING GUIDE

## Overview: Your Brand Bookkeeping Scope

Based on the actual financial data, Your Brand's bookkeeping involves:

### Revenue Sources
- **Shopify DTC Sales** (~$2.7M gross, ~$2M net after discounts/returns)
- **Wholesale Sales** (~$325K gross)
- **Shipping Revenue** (~$165K)
- **TikTok Sales** (~$1K, minimal)

### Cost of Goods Sold
- **Product COGS** (~$565K)
- **Fulfillment** (~$327K) - 3PL Distribution Management
  - Freight, storage, pick/pack, packaging, returns
- **Shipping** (~$35K)

### Operating Expenses (Major Categories)
- **Marketing & Advertising** (~$587K) - Meta Ads, Google, influencers
- **Independent Contractors** (~$281K) - Team payments via Gusto
- **Merchant Fees** (~$87K) - Shopify Payments, PayPal
- **Software & Web Hosting** (~$50K) - SaaS subscriptions
- **Rent** (~$38K) - Office lease
- **Professional Services** (~$6K) - Accountant, legal

### Balance Sheet Key Items
- **Bank Accounts**: Highbeam (primary), Chase, Montecito
- **Inventory**: ~$772K on hand + ~$10K in transit
- **Clearing Accounts**: Shopify Clearing (~$40K pending payouts)
- **Credit Cards**: Capital One, Chase
- **A/P**: Distribution Management (3PL), The Sourcing Company (manufacturing)
- **Liabilities**: Shareholder loan, Gift cards, Sales tax, Tesla loan

### Key Integrations
- **Shopify Connector**: Official QBO integration - syncs payouts, orders, customers, inventory
- **Gusto**: Payroll for contractors
- **Highbeam**: Banking with automatic categorization

---

## Weekly Close Workflow

### Why Weekly Instead of Monthly?

Moving from monthly to weekly closing provides:
- Catch errors before they compound
- Better cash flow visibility for ad spend decisions
- Faster reconciliation with fewer transactions to review
- Real-time financial awareness for business decisions

### Weekly Close Checklist

**Target: Complete within 1-2 hours every Monday**

#### Phase 1: Data Sync & Import (15 minutes)

```bash
# 1. Verify Shopify Connector has synced payouts
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query JournalEntry "TxnDate >= '$(date -v-7d +%Y-%m-%d)'" "MetaData.CreateTime DESC" 50

# 2. Check bank feeds are connected and pulling transactions
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts Bank

# 3. Verify credit card feeds are current
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts CreditCard
```

**Manual Steps:**
- [ ] Log into QuickBooks Online → Banking → Review pending transactions
- [ ] Accept/categorize new bank feed transactions
- [ ] Accept/categorize new credit card transactions
- [ ] Check Highbeam dashboard for any failed syncs

#### Phase 2: Transaction Review (20 minutes)

```bash
# 4. Review recent purchases for proper categorization
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Purchase "TxnDate >= '$(date -v-7d +%Y-%m-%d)'" "TxnDate DESC" 100

# 5. Check for uncategorized transactions
# Look for anything hitting "Ask My Accountant" or "Uncategorized"
```

**Review Focus Areas:**
- [ ] Marketing spend correctly categorized (Meta, Google, influencers)
- [ ] Software/SaaS subscriptions properly coded
- [ ] Contractor payments match Gusto reports
- [ ] Shipping costs split correctly between COS and expense

#### Phase 3: Clearing Account Review (15 minutes)

```bash
# 6. Check Shopify Clearing balance
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name LIKE '%Shopify%Clearing%'"

# 7. Check PayPal Clearing balance
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name LIKE '%PayPal%Clearing%'"
```

**Clearing Account Tasks:**
- [ ] Shopify Clearing should trend toward zero (payouts match deposits)
- [ ] PayPal Clearing should be near zero
- [ ] Investigate balances > $5,000 that aren't recent pending payouts

#### Phase 4: Quick Reconciliation Check (10 minutes)

```bash
# 8. Get bank account balances from QBO
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report BalanceSheet | jq '.report.Rows.Row[0].Rows.Row[0].Rows.Row[0].Rows.Row'
```

**Reconciliation Tasks:**
- [ ] Compare Highbeam QBO balance vs actual Highbeam dashboard
- [ ] Note any discrepancies > $100 for monthly deep-dive
- [ ] Credit card balances should reflect current statement + activity

#### Phase 5: AP & AR Review (10 minutes)

```bash
# 9. Check unpaid bills
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-bills unpaid 50

# 10. Check accounts receivable (should usually be $0 for DTC)
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report AgedReceivables
```

**AP/AR Tasks:**
- [ ] Review Distribution Management invoices (3PL bills)
- [ ] Review The Sourcing Company invoices (manufacturing)
- [ ] Note bills > 60 days overdue for payment prioritization
- [ ] Wholesale AR: Follow up on overdue invoices

#### Phase 6: Weekly Snapshot (10 minutes)

```bash
# 11. Generate week's P&L snapshot
START_DATE=$(date -v-7d +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report ProfitAndLoss $START_DATE $END_DATE

# 12. Get cash position
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts Bank
```

**Weekly Metrics to Track:**
- Total revenue
- Ad spend vs revenue ratio
- Cash on hand
- AP aging changes

---

## Monthly Close Workflow

**Target: Complete within 2-3 hours on 5th of following month**

### Month-End Close Checklist

#### Phase 1: Complete Weekly Tasks

All weekly tasks should be done first:
- [ ] All bank feeds accepted and categorized
- [ ] All credit card transactions reviewed
- [ ] Clearing accounts reconciled

#### Phase 2: Bank Statement Reconciliation (30 minutes)

```bash
# 1. Get bank account details
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts Bank
```

**For Each Bank Account:**
- [ ] **Highbeam Checking**: Reconcile to statement
- [ ] **Chase Checking 5398**: Reconcile to statement
- [ ] **Montecito Checking 7422**: Reconcile to statement
- [ ] **Venmo**: Reconcile (if active)
- [ ] **PayPal**: Reconcile all currency accounts

**Reconciliation Process:**
1. QBO → Gear → Reconcile
2. Select account and statement ending date
3. Enter ending balance from statement
4. Check off matching transactions
5. Investigate and resolve discrepancies
6. Finish reconciliation

#### Phase 3: Credit Card Reconciliation (20 minutes)

```bash
# 2. Get credit card balances
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts CreditCard
```

**For Each Credit Card:**
- [ ] **Capital One 7850**: Reconcile to statement
- [ ] **Chase 6688**: Reconcile to statement
- [ ] **Chase 2886**: Reconcile (if active)

#### Phase 4: Merchant/Platform Reconciliation (30 minutes)

**Shopify Reconciliation:**
```bash
# 3. Get Shopify-related clearing account balances
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name LIKE '%Shopify%'"
```

- [ ] Compare Shopify Connector sync to Shopify admin payouts
- [ ] Verify Shopify Pending Balances matches Shopify dashboard
- [ ] Investigate Shopify Clearing discrepancies > $500
- [ ] Reconcile any Shopify Capital loan transactions

**Distribution Management (3PL) Reconciliation:**
- [ ] Download DM billing summary for month
- [ ] Compare to bills entered in QBO
- [ ] Verify fulfillment costs align with order volume
- [ ] Check for any disputed charges

#### Phase 5: Inventory Reconciliation (20 minutes)

```bash
# 4. Get inventory balance
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name = 'Inventory'"

# 5. Get inventory in transit
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name = 'Inventory in Transit'"
```

**Inventory Tasks:**
- [ ] Compare QBO inventory to physical count/3PL report
- [ ] Review COGS recorded for the month
- [ ] Check Inventory in Transit for pending shipments
- [ ] Adjust for shrinkage/damages if needed

#### Phase 6: Sales Tax Review (15 minutes)

```bash
# 6. Get sales tax liability
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name = 'Sales Tax Payable'"
```

**Sales Tax Tasks:**
- [ ] Review TaxJar/Shopify sales tax reports
- [ ] Verify QBO sales tax liability matches
- [ ] Note filing deadlines for upcoming month
- [ ] Record any sales tax payments made

#### Phase 7: Accruals & Adjustments (20 minutes)

**Standard Month-End Journal Entries:**
- [ ] Accrue any services received but not yet billed
- [ ] Record prepaid expense amortization
- [ ] Record depreciation (if not auto-calculated)
- [ ] Adjust gift card liability as needed

```bash
# 7. Check accrued expenses balance
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name = 'Accrued Expenses'"

# 8. Check prepaid insurance
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name = 'Prepaid Insurance'"
```

#### Phase 8: Financial Report Review (15 minutes)

```bash
# 9. Generate P&L for the month
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report ProfitAndLoss YYYY-MM-01 YYYY-MM-31

# 10. Generate Balance Sheet
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report BalanceSheet

# 11. Generate Cash Flow Statement
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report CashFlow YYYY-MM-01 YYYY-MM-31
```

**Report Review:**
- [ ] P&L: Review for unusual items or misclassifications
- [ ] Compare to prior month and same month last year
- [ ] Balance Sheet: Verify assets = liabilities + equity
- [ ] Cash Flow: Ensure operating/investing/financing activities accurate

#### Phase 9: Close the Period (5 minutes)

**Set Closing Date:**
1. QBO → Gear → Account and Settings
2. Advanced → Accounting → Close the books
3. Set closing date to end of month
4. Set a password (optional but recommended)

---

## Bookkeeping Tasks Reference

### Daily Tasks (5 minutes)
- Monitor bank feeds for fraud/unusual activity
- Flag any transactions over $5,000 for review

### Weekly Tasks (see Weekly Close above)

### Monthly Tasks (see Monthly Close above)

### Quarterly Tasks
- [ ] Review and update chart of accounts
- [ ] Reconcile inventory to physical count
- [ ] Review vendor 1099 eligibility
- [ ] Analyze spending trends by category
- [ ] Review and optimize recurring transactions

### Annual Tasks
- [ ] Prepare for tax filing (1099s, year-end adjustments)
- [ ] Review and update depreciation schedules
- [ ] Archive prior year documents
- [ ] Review and clean up inactive accounts
- [ ] Conduct annual inventory valuation

---

## Common Bookkeeping Scenarios

### Scenario: Recording a New Bill from Manufacturer

```bash
# Create bill for The Sourcing Company
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create Bill '{
    "VendorRef": {"value": "68"},
    "TxnDate": "2025-01-15",
    "DueDate": "2025-02-15",
    "DocNumber": "S54089",
    "Line": [{
      "Amount": 5000,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {"value": "133", "name": "Inventory in Transit"}
      }
    }]
  }'
```

### Scenario: Recording a Bill Payment

```bash
# Pay a bill to Distribution Management
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create BillPayment '{
    "VendorRef": {"value": "151"},
    "TotalAmt": 5000,
    "PayType": "Check",
    "CheckPayment": {
      "BankAccountRef": {"value": "110", "name": "Highbeam Checking"}
    },
    "Line": [{
      "Amount": 5000,
      "LinkedTxn": [{"TxnId": "33725", "TxnType": "Bill"}]
    }]
  }'
```

### Scenario: Creating a Journal Entry for Inventory Adjustment

```bash
# Adjust inventory for damaged goods
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create JournalEntry '{
    "TxnDate": "2025-01-31",
    "DocNumber": "INV-ADJ-001",
    "PrivateNote": "Inventory adjustment for damaged goods",
    "Line": [
      {
        "DetailType": "JournalEntryLineDetail",
        "Amount": 500,
        "JournalEntryLineDetail": {
          "PostingType": "Debit",
          "AccountRef": {"value": "23", "name": "Cost of Goods Sold"}
        }
      },
      {
        "DetailType": "JournalEntryLineDetail",
        "Amount": 500,
        "JournalEntryLineDetail": {
          "PostingType": "Credit",
          "AccountRef": {"value": "16", "name": "Inventory"}
        }
      }
    ]
  }'
```

### Scenario: Recording Contractor Payment

Contractor payments flow through Gusto and automatically sync, but for manual recording:

```bash
# Record contractor payment
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create Purchase '{
    "PaymentType": "Check",
    "AccountRef": {"value": "110", "name": "Highbeam Checking"},
    "TxnDate": "2025-01-15",
    "Line": [{
      "Amount": 2500,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {"value": "33", "name": "Independent Contractor Expense"}
      }
    }],
    "EntityRef": {"value": "contractor-id", "type": "Vendor"}
  }'
```

---

## Account ID Quick Reference

### Bank Accounts
| Account | ID |
|---------|-----|
| Highbeam Checking | 110 |
| Chase Checking 5398 | 13 |
| Montecito Checking 7422 | 14 |
| Venmo | 15 |
| PayPal | 9 |

### Expense Accounts
| Account | ID |
|---------|-----|
| Marketing & Advertising | 40 |
| Independent Contractor | 33 |
| Merchant Fees | 41 |
| Software & Web Hosting | 53 |
| Rent or Lease | 51 |
| Cost of Goods Sold | 23 |
| Fulfillment | 102 |

### Asset Accounts
| Account | ID |
|---------|-----|
| Inventory | 16 |
| Inventory in Transit | 133 |
| Shopify Clearing | 66 |
| Shopify Pending Balances | 70 |

### Liability Accounts
| Account | ID |
|---------|-----|
| Accounts Payable | 134 |
| Sales Tax Payable | 58 |
| Gift Card Liabilities | 69 |

### Key Vendors
| Vendor | ID |
|--------|-----|
| Distribution Management (3PL) | 151 |
| The Sourcing Company (Mfg) | 68 |

---

## Automated Monthly Close Workflow

This workflow enables end-to-end book closing with minimal manual intervention.

### Trigger: `/close-books [YYYY-MM]`

When invoked, this workflow performs:

### Phase 1: Statement Collection (Browser Automation)

Use Puppeteer to download statements from financial institutions:

**Required Statements & Sources:**

| Statement | Portal | Drive Folder |
|-----------|--------|--------------|
| Highbeam Checking | app.highbeam.co | `Highbeam/` |
| Chase Checking 5398 | chase.com | `Chase Checking/` |
| Capital One CC 7850 | capitalone.com | `Capital One Spark Credit Card/` |
| Chase CC 6688 | chase.com | `Chase Ink Credit Card/` |
| Montecito Checking | montecito.bank | `Montecito Checking/` |
| Shopify Payouts | admin.shopify.com | `Shopify/` |
| Faire Payouts | faire.com | `Faire/` |
| Gusto Payroll | gusto.com | `Gusto/` |
| Tesla Loan | tesla.com | `Tesla/` |
| TikTok Shop | seller.tiktok.com | `TikTok/` |

**Process:**
1. Use puppeteer skill to connect to Chrome (Work profile)
2. Navigate to each portal
3. Download statement for closing month
4. Upload to Google Drive: `/Accounting/Statements/{folder}/{YYYY-MM}.pdf`

### Phase 2: Transaction Categorization

**2a. Apply Vendor Matrix Rules**

Query uncategorized transactions and auto-categorize:

```bash
# Get recent purchases without category
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Purchase "TxnDate >= 'YYYY-MM-01' AND TxnDate <= 'YYYY-MM-31'" "" 500
```

Apply vendor matrix mappings from `assets/accounting/vendor-matrix.json`:

| Vendor Pattern | Account |
|----------------|---------|
| `Pinterest` | Marketing & Advertising Expense |
| `Adobe` | Software & Web Hosting Expense |
| `Amazon` | Office Supply Expense |
| `Chipotle`, `restaurant`, `cafe` | Business Meals Expense (review) |
| `Distribution Management` | Fulfillment |

**2b. Generate Review Inquiry**

For transactions that can't be auto-categorized, generate an inquiry for the user:

```markdown
## Monthly Close Inquiry - January 2026

### Transactions Needing Review

| Date | Payee | Amount | Suggested Category | Reason |
|------|-------|--------|-------------------|--------|
| 2026-01-15 | Unknown Vendor | $247.50 | ? | No vendor match |
| 2026-01-18 | Hotel Barcelona | $892.00 | Travel OR Personal | International location |

**Please reply with:**
1. For each transaction, confirm or provide correct category
2. Mark "P" for personal expenses to be reclassified
```

### Phase 3: Reconciliation Spreadsheet Updates

**3a. Markdowns Calculation**

Query PostgreSQL for retail vs. discounted prices:

```sql
SELECT
  DATE_TRUNC('month', (data->>'created_at')::timestamp) as month,
  SUM((data->'line_items'->0->>'compare_at_price')::numeric -
      (data->'line_items'->0->>'price')::numeric) as total_markdown
FROM shopify_orders
WHERE (data->>'created_at')::date >= 'YYYY-01-01'
GROUP BY month
ORDER BY month
```

Update Google Sheet: `1qOgLqXFbPr9INFjv6ARzltZg-pdVUoUeUn6WWIDERcI` (Markdowns tab)

**3b. Wholesale Discounts**

Query wholesale segment orders:

```sql
SELECT
  DATE_TRUNC('month', (data->>'created_at')::timestamp) as month,
  SUM((data->>'total_price')::numeric) as wholesale_sales
FROM shopify_orders
WHERE data->>'tags' ILIKE '%wholesale%'
  AND (data->>'created_at')::date >= 'YYYY-01-01'
GROUP BY month
ORDER BY month
```

Update Google Sheet: `1qOgLqXFbPr9INFjv6ARzltZg-pdVUoUeUn6WWIDERcI` (Wholesale tab)

**3c. Inventory Value**

```bash
# Get current inventory levels
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts \
  inventory-levels

# Calculate value using product costs
```

Update Google Sheet: `13cqQPlFbrEpWL-ZVUWFc4b38O-sQQbyR5pANBhbNUnQ`

**3d. Accounts Receivable (Free People) - Spreadsheet → QBO**

Source: Google Sheet `1zVZAnY2YkXfl7HtFT6XR21Ewyca6YXMO3gWeXandPrs` (Free People Orders)

Process:
1. Read new orders from spreadsheet
2. Query QBO for existing invoices by customer/PO number
3. Create invoices in QBO for any new orders:

```bash
# Create invoice for Free People order
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create Invoice '{
    "CustomerRef": {"value": "FREE_PEOPLE_CUSTOMER_ID"},
    "DocNumber": "FP-PO12345",
    "TxnDate": "2026-01-15",
    "Line": [{
      "Amount": 5000,
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": {"value": "WHOLESALE_ITEM_ID"},
        "Qty": 100,
        "UnitPrice": 50
      }
    }]
  }'
```

4. Mark invoices as paid when payment received

**3e. Accounts Payable (DM, SOCO) - Spreadsheets → QBO**

Sources:
- Distribution Management: `17cRYup1GvraY_L9V3aclPdDB0fkbb0zh1ri-TF1z_-w`
- The Sourcing Company: `1zOkYvJcFXMKdF4gWajlFiD91u5669DLCHrU2C61CiHo`

Process:
1. Read new invoices from spreadsheets
2. Query QBO for existing bills by vendor/invoice number
3. Create bills in QBO for any new invoices:

```bash
# Create bill for Distribution Management
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create Bill '{
    "VendorRef": {"value": "151"},
    "DocNumber": "SB406281",
    "TxnDate": "2025-12-27",
    "DueDate": "2026-01-27",
    "Line": [{
      "Amount": 2304.87,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {"value": "104", "name": "Accrued Expenses"}
      }
    }],
    "PrivateNote": "https://docs.google.com/spreadsheets/d/17cRYup1GvraY_L9V3aclPdDB0fkbb0zh1ri-TF1z_-w"
  }'

# Create bill for The Sourcing Company
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  create Bill '{
    "VendorRef": {"value": "68"},
    "DocNumber": "S54087",
    "TxnDate": "2025-12-17",
    "DueDate": "2026-01-17",
    "Line": [{
      "Amount": 2983.50,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {"value": "133", "name": "Inventory in Transit"}
      }
    }]
  }'
```

4. Record bill payments when paid

### Phase 4: Bank & Credit Card Reconciliation

**4a. Compare QBO to Statements**

For each account:
1. Get QBO ending balance
2. Parse PDF statement ending balance (if available)
3. Calculate difference
4. Flag discrepancies > $100

```bash
# Get bank balances
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  list-accounts Bank
```

**4b. Clearing Account Verification**

```bash
# Check Shopify clearing
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  query Account "Name LIKE '%Shopify%Clearing%'"
```

Shopify Clearing + Shopify Pending should approximately equal:
- Shopify Payouts pending in current period
- Any timing differences from payout settlements

### Phase 5: Financial Report Generation

```bash
# Generate all core reports
START="YYYY-MM-01"
END="YYYY-MM-31"

deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report ProfitAndLoss $START $END

deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report BalanceSheet

deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts \
  report CashFlow $START $END
```

Save to `assets/accounting/`:
- `profit-and-loss-YYYY-MM.md`
- `balance-sheet-YYYY-MM.md`
- `cash-flow-YYYY-MM.md`

### Phase 6: Close Period in QuickBooks

**Generate Close Report:**

```markdown
## Month-End Close Report - January 2026

### Financial Summary
| Metric | Amount |
|--------|--------|
| Revenue | $XXX,XXX |
| COGS | $XX,XXX |
| Gross Profit | $XX,XXX |
| Operating Expenses | $XX,XXX |
| Net Income | $X,XXX |

### Reconciliation Status
| Account | QBO Balance | Statement | Difference | Status |
|---------|-------------|-----------|------------|--------|
| Highbeam Checking | $137,986.71 | $137,986.71 | $0.00 | ✓ |
| Chase CC 6688 | $23,282.20 | $23,282.20 | $0.00 | ✓ |
| Capital One CC | $27,186.77 | $27,186.77 | $0.00 | ✓ |

### Clearing Accounts
| Account | Balance | Expected | Status |
|---------|---------|----------|--------|
| Shopify Clearing | $13,555.27 | ~$13,500 | ✓ |
| PayPal Clearing | ($433.30) | ~$0 | ⚠️ Review |

### Outstanding Items
- [ ] 3 transactions need category confirmation
- [ ] PayPal clearing balance to investigate

### Ready to Close?
If all items are resolved, set closing date to YYYY-MM-31 in QuickBooks:
1. Gear → Account and Settings → Advanced
2. Accounting → Close the books → Set date
```

---

## Vendor Matrix Reference

The vendor matrix auto-categorizes transactions. Located at:
- Google Drive: `1xIr6IxOUJs3DwqJFY58Z9fL3e1clGc8d` (Vendor Matrix sheet)
- Local cache: `assets/accounting/vendor-matrix.json`

Key mappings extracted:

| Vendor Pattern | Account Name | Account ID |
|----------------|--------------|------------|
| 1Password | Software & Web Hosting Expense | 53 |
| Adobe | Software & Web Hosting Expense | 53 |
| Amazon | Office Supply Expense | 43 |
| AT&T | Phone & Internet Expense | 48 |
| Blue Shield | Insurance Expense - Health | 36 |
| Distribution Management | Fulfillment | 102 |
| Facebook | Marketing & Advertising Expense | 40 |
| Google | Software & Web Hosting Expense | 53 |
| Gusto | Software & Web Hosting Expense | 53 |
| Jim Williams | Rent or Lease Expense | 51 |
| Klaviyo | Software & Web Hosting Expense | 53 |
| Meta | Marketing & Advertising Expense | 40 |
| Pinterest | Marketing & Advertising Expense | 40 |
| Shopify | Shopify Fees | 105 |
| Tesla | Gas & Auto Expense | 32 |
| The Sourcing Company | Inventory in Transit | 133 |

---

## Statement Upload Destinations

Google Drive folder structure for `/Accounting/Statements/`:

| Folder Name | Folder ID | Contents |
|-------------|-----------|----------|
| Highbeam | `1rF9EFJR4zG1-eaMzjeu4rAhOnOw80BSs` | Bank statements |
| Chase Checking | `1MZ9S3wD90Gq6QGADbtZKodfOLYTsUXgx` | Bank statements |
| Capital One Spark Credit Card | `1Exrm2jZDGPq7w8Rj0qZ7jHNSvZGdixyo` | CC statements |
| Chase Ink Credit Card | `1bQKy9UiMEv8inAx7e_wtpP-zFGJFG_Xc` | CC statements |
| Montecito Checking | `1y01ufc4T8dT1xp3sG_h7p8Er1MjjvvV2` | Bank statements |
| Shopify | `1vJYV3OjLWTQQ5tl6Kpo-N1zi2SuNvICV` | Payout reports |
| Faire | `1DXaHyjP_Rvi-pF_a6eCkoPxxt_1OAQfR` | Payout reports |
| Gusto | `11v94meTAEYo4viWJhYuBQhWTsRWYtjNh` | Payroll reports |
| Tesla | `1OPsIGhrlTqEevDyvrYOb5zF7Hb3Dguqa` | Loan statements |
| TikTok | `1riQ6WRM_6qt8yGBB48J-YT289huKjEai` | Shop payouts |
| AR | `1xAJobtqhnFoeuEhXI66oEbX6BbKBq3rL` | Receivables docs |
| AP | `11VAVqHHoFlWW538RaPiaMOlo0mNqE_1y` | Payables docs |
| Venmo | `14ByoLCQ0GNSz5lDheq2WNtkZzzicdLxE` | Statements |

---

# PART 2: API WORKFLOW EXAMPLES

## Example 1: Check Unpaid Invoices

**User Question:** "Show me all unpaid invoices"

### Step 1: Identify the Request
- Entity: Invoice
- Filter: Unpaid (Balance > 0)
- Fields needed: Customer, Amount, Due Date

### Step 2: Execute Query

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-invoices unpaid
```

Or with custom query:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Invoice "Balance > '0'" "DueDate ASC" 100
```

### Step 3: Interpret Results

Parse the response and present as a table:

| Invoice # | Customer | Amount | Due Date | Days Overdue |
|-----------|----------|--------|----------|--------------|
| INV-1001 | ABC Corp | $5,000 | 2025-01-10 | 4 |
| INV-1002 | XYZ Inc | $2,500 | 2025-01-15 | 0 |

### Step 4: Calculate Summary

- Total Outstanding: $7,500
- Overdue Amount: $5,000
- Invoices Count: 2

---

## Example 2: Find Bills Due This Week

**User Question:** "What bills are due this week?"

### Step 1: Determine Date Range

Calculate dates:
- Today: 2025-01-14
- End of week: 2025-01-19

### Step 2: Execute Query

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Bill "Balance > '0' AND DueDate <= '2025-01-19'" "DueDate ASC" 50
```

### Step 3: Present Results

| Bill # | Vendor | Amount | Due Date |
|--------|--------|--------|----------|
| BILL-201 | Office Supplies Co | $450 | 2025-01-15 |
| BILL-202 | Utilities Inc | $1,200 | 2025-01-18 |

---

## Example 3: Create a New Customer

**User Question:** "Add a new customer named 'Acme Corporation' with email acme@example.com"

### Step 1: Prepare Customer Data

```json
{
  "DisplayName": "Acme Corporation",
  "CompanyName": "Acme Corporation",
  "PrimaryEmailAddr": {
    "Address": "acme@example.com"
  }
}
```

### Step 2: Execute Create Command

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create Customer '{"DisplayName": "Acme Corporation", "CompanyName": "Acme Corporation", "PrimaryEmailAddr": {"Address": "acme@example.com"}}'
```

### Step 3: Confirm Creation

The response will include the new customer's ID:

```json
{
  "success": true,
  "entity": {
    "Id": "123",
    "DisplayName": "Acme Corporation",
    ...
  }
}
```

---

## Example 4: Create an Invoice

**User Question:** "Create an invoice for customer ID 123 for $500 service fee"

### Step 1: Get Customer Details (optional)

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts get Customer 123
```

### Step 2: Find or Create a Service Item

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Item "Name = 'Service Fee'"
```

If not found, create one:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create Item '{"Name": "Service Fee", "Type": "Service", "IncomeAccountRef": {"value": "1"}}'
```

### Step 3: Create the Invoice

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create Invoice '{
  "CustomerRef": {"value": "123"},
  "Line": [{
    "Amount": 500,
    "DetailType": "SalesItemLineDetail",
    "SalesItemLineDetail": {
      "ItemRef": {"value": "1"},
      "Qty": 1,
      "UnitPrice": 500
    }
  }]
}'
```

---

## Example 5: Record a Payment

**User Question:** "Record a $1000 payment from customer 123 for invoice 456"

### Step 1: Create Payment

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts create Payment '{
  "CustomerRef": {"value": "123"},
  "TotalAmt": 1000,
  "Line": [{
    "Amount": 1000,
    "LinkedTxn": [{
      "TxnId": "456",
      "TxnType": "Invoice"
    }]
  }]
}'
```

---

## Example 6: View Chart of Accounts

**User Question:** "Show me all expense accounts"

### Step 1: Query Accounts by Type

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-accounts Expense
```

### Step 2: Present Results

| Account Name | Account # | Balance |
|--------------|-----------|---------|
| Office Supplies | 6100 | $1,234.56 |
| Rent Expense | 6200 | $24,000.00 |
| Utilities | 6300 | $3,456.78 |

---

## Example 7: Update Customer Information

**User Question:** "Update the email for customer 123 to newemail@example.com"

### Step 1: Get Current Customer Data

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts get Customer 123
```

Note the SyncToken from the response.

### Step 2: Update with New Email

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts update Customer '{
  "Id": "123",
  "SyncToken": "0",
  "PrimaryEmailAddr": {"Address": "newemail@example.com"}
}'
```

---

## Example 8: Find Vendors by Name

**User Question:** "Find all vendors with 'Supply' in their name"

### Step 1: Execute Search Query

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Vendor "DisplayName LIKE '%Supply%'"
```

---

## Example 9: Get Account Balances Summary

**User Question:** "What are my bank account balances?"

### Step 1: Query Bank Accounts

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts list-accounts Bank
```

### Step 2: Extract and Sum Balances

Parse CurrentBalance from each account and present summary.

---

## Example 10: Monthly Revenue Report

**User Question:** "How much did we invoice this month?"

### Step 1: Query Invoices for Date Range

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/quickbooks/scripts/qbo-client.ts query Invoice "TxnDate >= '2025-01-01' AND TxnDate <= '2025-01-31'" "" 1000
```

### Step 2: Calculate Total

Sum up the TotalAmt field from all returned invoices.

---

## Common Query Patterns

### Filter by Date Range

```bash
# This month's transactions
query Invoice "TxnDate >= '2025-01-01' AND TxnDate <= '2025-01-31'"

# Last 30 days
query Bill "TxnDate >= '2024-12-15'"
```

### Filter by Amount

```bash
# Large invoices
query Invoice "TotalAmt > '5000'"

# Small expenses
query Purchase "TotalAmt < '100'"
```

### Filter by Status

```bash
# Active customers only
query Customer "Active = true"

# Unpaid bills
query Bill "Balance > '0'"
```

### Combine Filters

```bash
# Active customers with balance
query Customer "Active = true AND Balance > '0'"

# Unpaid invoices due this month
query Invoice "Balance > '0' AND DueDate >= '2025-01-01' AND DueDate <= '2025-01-31'"
```

### Sort Results

```bash
# Most recent first
query Invoice "" "MetaData.CreateTime DESC"

# By amount descending
query Invoice "" "TotalAmt DESC"

# By name
query Customer "" "DisplayName ASC"
```

---

## Example 11: Analyze Expenses by Vendor

**User Question:** "How much have we spent on Google Ads?"

### Important: Use P&L Detail, Not Purchase Queries

Searching Purchase transactions by notes/memos is unreliable. Instead, use the P&L Detail report to get accurate expense data by vendor.

### Step 1: Run P&L Detail Report

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/quickbooks/scripts/qbo-client.ts \
  report ProfitAndLossDetail 2023-01-01 2026-12-31 > pnl_detail.json
```

### Step 2: Extract the Expense Section

```bash
# Get all expense accounts
jq '.report.Rows.Row[3]' pnl_detail.json > expenses_section.json

# List all expense account names
jq '.Rows.Row | map(.Header.ColData[0].value) | unique' expenses_section.json
```

### Step 3: Filter by Account (e.g., Marketing)

```bash
# Extract Marketing & Advertising transactions
jq '[.Rows.Row[] | select(.Header.ColData[0].value == "Marketing & Advertising Expense")]' \
  expenses_section.json > marketing_section.json

# Get total
jq '.[0].Summary.ColData[6].value' marketing_section.json
```

### Step 4: Group by Vendor

```bash
# Extract transactions and group by vendor
jq '.[0].Rows.Row | map(select(.type == "Data")) |
  map({name: .ColData[3].value, amount: (.ColData[6].value | tonumber)}) |
  group_by(.name) |
  map({vendor: .[0].name, total: (map(.amount) | add)}) |
  sort_by(-.total)' marketing_section.json
```

### Key Expense Account IDs

| Account | ID | Description |
|---------|-----|-------------|
| Marketing & Advertising Expense | 40 | All ad spend |
| Software & Web Hosting Expense | 53 | SaaS subscriptions |
| Professional Service Expense | 50 | Contractors, consultants |

### Why This Matters

- **Don't** search Purchase.PrivateNote for vendor names - it's unreliable
- **Do** use P&L Detail report to get transactions by expense account
- The vendor name is in ColData[3] of each transaction row
