# QuickBooks Online Query Syntax Reference

This document provides a complete reference for the QuickBooks Online query language.

## Basic Query Structure

```sql
SELECT * FROM EntityType WHERE conditions ORDERBY field [ASC|DESC] MAXRESULTS limit
```

## Supported Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `Active = true` |
| `!=` | Not equals | `Status != 'Closed'` |
| `<` | Less than | `TotalAmt < '1000'` |
| `<=` | Less than or equal | `DueDate <= '2025-01-31'` |
| `>` | Greater than | `Balance > '0'` |
| `>=` | Greater than or equal | `TxnDate >= '2025-01-01'` |

### String Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `LIKE` | Pattern match (% wildcard) | `DisplayName LIKE '%Smith%'` |
| `IN` | In list of values | `Status IN ('Open', 'Pending')` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `AND` | Both conditions true | `Active = true AND Balance > '0'` |
| `OR` | Either condition true | `Status = 'Open' OR Status = 'Pending'` |

## Data Types and Quoting

### Strings
Always use single quotes for string values:
```sql
DisplayName = 'John Smith'
Name LIKE '%Supply%'
```

### Numbers
Use single quotes for numeric comparisons:
```sql
TotalAmt > '1000'
Balance = '0'
```

### Booleans
Use `true` or `false` without quotes:
```sql
Active = true
Taxable = false
```

### Dates
Use `YYYY-MM-DD` format in single quotes:
```sql
TxnDate >= '2025-01-01'
DueDate <= '2025-01-31'
```

## Sortable Fields

### ORDER BY Syntax
```sql
ORDERBY fieldName [ASC|DESC]
```

Default is ASC (ascending). Common sortable fields:

| Entity | Common Sort Fields |
|--------|-------------------|
| Invoice | `TxnDate`, `DueDate`, `DocNumber`, `TotalAmt`, `MetaData.CreateTime` |
| Bill | `TxnDate`, `DueDate`, `DocNumber`, `TotalAmt`, `MetaData.CreateTime` |
| Customer | `DisplayName`, `Balance`, `MetaData.CreateTime` |
| Vendor | `DisplayName`, `Balance`, `MetaData.CreateTime` |
| Account | `Name`, `AccountType`, `CurrentBalance` |
| Item | `Name`, `Type`, `MetaData.CreateTime` |

## Result Limits

### MAXRESULTS
Limit the number of returned records:
```sql
SELECT * FROM Customer MAXRESULTS 50
```

Default limit varies by entity. Maximum is typically 1000.

### STARTPOSITION
For pagination (zero-based):
```sql
SELECT * FROM Invoice STARTPOSITION 100 MAXRESULTS 100
```

## Entity-Specific Fields

### Invoice
```sql
-- Common queryable fields
Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance
CustomerRef, CurrencyRef
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Invoice WHERE Balance > '0'
SELECT * FROM Invoice WHERE CustomerRef = '123'
SELECT * FROM Invoice WHERE TxnDate >= '2025-01-01'
```

### Bill
```sql
-- Common queryable fields
Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance
VendorRef, CurrencyRef
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Bill WHERE Balance > '0'
SELECT * FROM Bill WHERE VendorRef = '456'
SELECT * FROM Bill WHERE DueDate <= '2025-01-31'
```

### Customer
```sql
-- Common queryable fields
Id, DisplayName, CompanyName, GivenName, FamilyName
Active, Balance, PrimaryEmailAddr, PrimaryPhone
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Customer WHERE Active = true
SELECT * FROM Customer WHERE Balance > '0'
SELECT * FROM Customer WHERE DisplayName LIKE '%Corp%'
```

### Vendor
```sql
-- Common queryable fields
Id, DisplayName, CompanyName, GivenName, FamilyName
Active, Balance, PrimaryEmailAddr, PrimaryPhone
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Vendor WHERE Active = true
SELECT * FROM Vendor WHERE DisplayName LIKE '%Supply%'
```

### Account
```sql
-- Common queryable fields
Id, Name, FullyQualifiedName, AccountType, AccountSubType
Active, CurrentBalance, Classification
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Account Types: Bank, Accounts Receivable, Accounts Payable,
--   Income, Expense, Other Current Asset, Fixed Asset, etc.

-- Example queries
SELECT * FROM Account WHERE AccountType = 'Expense'
SELECT * FROM Account WHERE Active = true
SELECT * FROM Account WHERE CurrentBalance > '0'
```

### Item
```sql
-- Common queryable fields
Id, Name, Type, Active, UnitPrice, PurchaseCost
IncomeAccountRef, ExpenseAccountRef
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Item Types: Inventory, Service, NonInventory

-- Example queries
SELECT * FROM Item WHERE Type = 'Service'
SELECT * FROM Item WHERE Active = true
SELECT * FROM Item WHERE Name LIKE '%Product%'
```

### Payment
```sql
-- Common queryable fields
Id, TxnDate, TotalAmt, CustomerRef
PaymentMethodRef, DepositToAccountRef
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Payment WHERE TxnDate >= '2025-01-01'
SELECT * FROM Payment WHERE CustomerRef = '123'
```

### JournalEntry
```sql
-- Common queryable fields
Id, TxnDate, DocNumber, TotalAmt, Adjustment
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM JournalEntry WHERE TxnDate >= '2025-01-01'
SELECT * FROM JournalEntry WHERE Adjustment = true
```

### Employee
```sql
-- Common queryable fields
Id, DisplayName, GivenName, FamilyName, Active
PrimaryEmailAddr, PrimaryPhone
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Employee WHERE Active = true
SELECT * FROM Employee WHERE DisplayName LIKE '%John%'
```

### Estimate
```sql
-- Common queryable fields
Id, DocNumber, TxnDate, ExpirationDate, TotalAmt
CustomerRef, TxnStatus
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM Estimate WHERE TxnStatus = 'Pending'
SELECT * FROM Estimate WHERE CustomerRef = '123'
```

### Purchase
```sql
-- Common queryable fields
Id, TxnDate, DocNumber, TotalAmt, PaymentType
AccountRef, EntityRef
MetaData.CreateTime, MetaData.LastUpdatedTime

-- PaymentType: Cash, Check, CreditCard

-- Example queries
SELECT * FROM Purchase WHERE PaymentType = 'CreditCard'
SELECT * FROM Purchase WHERE TxnDate >= '2025-01-01'
```

### BillPayment
```sql
-- Common queryable fields
Id, TxnDate, TotalAmt, VendorRef
PayType, CheckPayment, CreditCardPayment
MetaData.CreateTime, MetaData.LastUpdatedTime

-- Example queries
SELECT * FROM BillPayment WHERE VendorRef = '456'
SELECT * FROM BillPayment WHERE TxnDate >= '2025-01-01'
```

## Complex Query Examples

### Combining Multiple Conditions

```sql
-- Active customers with outstanding balance
SELECT * FROM Customer
WHERE Active = true AND Balance > '0'
ORDERBY Balance DESC

-- Unpaid invoices due this month
SELECT * FROM Invoice
WHERE Balance > '0'
AND DueDate >= '2025-01-01'
AND DueDate <= '2025-01-31'
ORDERBY DueDate ASC

-- Recent large expenses
SELECT * FROM Purchase
WHERE TotalAmt > '500'
AND TxnDate >= '2025-01-01'
ORDERBY TxnDate DESC
MAXRESULTS 20
```

### Using LIKE for Text Search

```sql
-- Customers containing "Inc"
SELECT * FROM Customer WHERE DisplayName LIKE '%Inc%'

-- Vendors starting with "A"
SELECT * FROM Vendor WHERE DisplayName LIKE 'A%'

-- Items ending with "Service"
SELECT * FROM Item WHERE Name LIKE '%Service'
```

### Using IN for Multiple Values

```sql
-- Specific account types
SELECT * FROM Account
WHERE AccountType IN ('Bank', 'Accounts Receivable', 'Accounts Payable')

-- Note: IN is supported for some fields but has limitations
```

## Query Limitations

1. **No JOINs**: Cannot join tables directly; must query separately
2. **No Aggregations**: No SUM, COUNT, AVG in queries; calculate client-side
3. **No Subqueries**: Cannot nest SELECT statements
4. **Limited OR Support**: Some fields don't support OR conditions
5. **Case Sensitivity**: Field names are case-sensitive
6. **Wildcard Position**: LIKE patterns must have % at start/end, not middle

## Best Practices

1. **Always use filters** to limit data returned
2. **Use MAXRESULTS** to prevent large result sets
3. **Sort by indexed fields** for better performance
4. **Query by ID** when you know the specific record
5. **Use Active filter** to exclude deleted/inactive records
6. **Check MetaData.LastUpdatedTime** for recently modified records

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid query" | Syntax error | Check field names and operators |
| "Field not supported" | Non-queryable field | Use different field or remove filter |
| "Invalid entity" | Wrong entity name | Check spelling and case |
| "Query timeout" | Too much data | Add more specific filters |
