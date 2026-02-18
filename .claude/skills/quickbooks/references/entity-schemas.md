# QuickBooks Online Entity Schemas

This document provides field definitions and required fields for each supported entity type.

## Account

Used for chart of accounts entries.

### Required Fields for Create
- `Name` - Account name (must be unique)
- `AccountType` - Type of account

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier (read-only) |
| Name | String | Account name |
| AccountType | Enum | Bank, Accounts Receivable, Accounts Payable, Income, Expense, etc. |
| AccountSubType | Enum | Sub-classification |
| FullyQualifiedName | String | Full hierarchical name |
| Active | Boolean | Is account active |
| CurrentBalance | Decimal | Current balance (read-only) |
| Classification | Enum | Asset, Liability, Equity, Revenue, Expense |
| CurrencyRef | Reference | Currency for the account |
| Description | String | Account description |
| SyncToken | String | Version for concurrency control |

### Example
```json
{
  "Name": "Office Supplies",
  "AccountType": "Expense",
  "AccountSubType": "SuppliesMaterials"
}
```

---

## Bill

Represents a bill from a vendor (accounts payable).

### Required Fields for Create
- `VendorRef` - Reference to vendor
- `Line` - At least one line item

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| VendorRef | Reference | Vendor this bill is from |
| TxnDate | Date | Transaction date |
| DueDate | Date | Payment due date |
| TotalAmt | Decimal | Total amount (read-only) |
| Balance | Decimal | Remaining balance |
| DocNumber | String | Bill number |
| Line | Array | Line items |
| APAccountRef | Reference | Accounts payable account |
| SyncToken | String | Version for concurrency |

### Line Item Structure
```json
{
  "Amount": 100.00,
  "DetailType": "AccountBasedExpenseLineDetail",
  "AccountBasedExpenseLineDetail": {
    "AccountRef": {"value": "account-id"}
  }
}
```

---

## BillPayment

Payment made to a vendor.

### Required Fields for Create
- `VendorRef` - Reference to vendor
- `TotalAmt` - Payment amount
- `PayType` - Payment type (Check or CreditCard)

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| VendorRef | Reference | Vendor being paid |
| TotalAmt | Decimal | Payment amount |
| PayType | Enum | Check, CreditCard |
| TxnDate | Date | Payment date |
| CheckPayment | Object | Check details (if PayType = Check) |
| CreditCardPayment | Object | Card details (if PayType = CreditCard) |
| Line | Array | Bills being paid |

---

## Customer

Customer/client records.

### Required Fields for Create
- `DisplayName` - Customer display name (must be unique)

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| DisplayName | String | Display name (unique) |
| CompanyName | String | Company name |
| GivenName | String | First name |
| FamilyName | String | Last name |
| PrimaryEmailAddr | EmailAddress | Primary email |
| PrimaryPhone | TelephoneNumber | Primary phone |
| BillAddr | PhysicalAddress | Billing address |
| ShipAddr | PhysicalAddress | Shipping address |
| Balance | Decimal | Outstanding balance |
| Active | Boolean | Is customer active |
| Notes | String | Customer notes |
| SyncToken | String | Version for concurrency |

### Example
```json
{
  "DisplayName": "ABC Corporation",
  "CompanyName": "ABC Corporation",
  "PrimaryEmailAddr": {
    "Address": "contact@abc.com"
  },
  "PrimaryPhone": {
    "FreeFormNumber": "555-123-4567"
  },
  "BillAddr": {
    "Line1": "123 Main St",
    "City": "Anytown",
    "CountrySubDivisionCode": "CA",
    "PostalCode": "90210"
  }
}
```

---

## Employee

Employee records.

### Required Fields for Create
- `GivenName` - First name
- `FamilyName` - Last name

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| DisplayName | String | Display name |
| GivenName | String | First name |
| FamilyName | String | Last name |
| PrimaryEmailAddr | EmailAddress | Email |
| PrimaryPhone | TelephoneNumber | Phone |
| PrimaryAddr | PhysicalAddress | Address |
| Active | Boolean | Is employee active |
| SSN | String | Social security (last 4 only returned) |
| BirthDate | Date | Birth date |
| HiredDate | Date | Hire date |

---

## Estimate

Quotes/estimates for customers.

### Required Fields for Create
- `CustomerRef` - Reference to customer
- `Line` - At least one line item

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| CustomerRef | Reference | Customer |
| TxnDate | Date | Estimate date |
| ExpirationDate | Date | Valid until |
| TotalAmt | Decimal | Total amount |
| TxnStatus | Enum | Pending, Accepted, Closed, Rejected |
| DocNumber | String | Estimate number |
| Line | Array | Line items |
| BillEmail | EmailAddress | Email for estimate |

---

## Invoice

Customer invoices (accounts receivable).

### Required Fields for Create
- `CustomerRef` - Reference to customer
- `Line` - At least one line item

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| CustomerRef | Reference | Customer |
| TxnDate | Date | Invoice date |
| DueDate | Date | Payment due date |
| TotalAmt | Decimal | Total amount |
| Balance | Decimal | Remaining balance |
| DocNumber | String | Invoice number |
| Line | Array | Line items |
| BillEmail | EmailAddress | Send email to |
| ShipAddr | PhysicalAddress | Ship to address |
| BillAddr | PhysicalAddress | Bill to address |

### Line Item Structure (Sales)
```json
{
  "Amount": 500.00,
  "DetailType": "SalesItemLineDetail",
  "SalesItemLineDetail": {
    "ItemRef": {"value": "item-id"},
    "Qty": 1,
    "UnitPrice": 500.00
  }
}
```

### Example
```json
{
  "CustomerRef": {"value": "123"},
  "Line": [{
    "Amount": 500.00,
    "DetailType": "SalesItemLineDetail",
    "SalesItemLineDetail": {
      "ItemRef": {"value": "1"},
      "Qty": 1,
      "UnitPrice": 500.00
    }
  }],
  "DueDate": "2025-02-14"
}
```

---

## Item

Products and services.

### Required Fields for Create
- `Name` - Item name (unique)
- `Type` - Item type (Inventory, Service, NonInventory)

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| Name | String | Item name (unique) |
| Type | Enum | Inventory, Service, NonInventory |
| Active | Boolean | Is item active |
| UnitPrice | Decimal | Sales price |
| PurchaseCost | Decimal | Cost |
| Description | String | Sales description |
| PurchaseDesc | String | Purchase description |
| IncomeAccountRef | Reference | Income account |
| ExpenseAccountRef | Reference | Expense account |
| QtyOnHand | Decimal | Quantity in stock (Inventory only) |
| AssetAccountRef | Reference | Asset account (Inventory only) |
| InvStartDate | Date | Inventory start date |

### Example (Service)
```json
{
  "Name": "Consulting Service",
  "Type": "Service",
  "UnitPrice": 150.00,
  "IncomeAccountRef": {"value": "income-account-id"}
}
```

### Example (Inventory)
```json
{
  "Name": "Widget",
  "Type": "Inventory",
  "UnitPrice": 25.00,
  "PurchaseCost": 10.00,
  "QtyOnHand": 100,
  "InvStartDate": "2025-01-01",
  "IncomeAccountRef": {"value": "income-account-id"},
  "ExpenseAccountRef": {"value": "cogs-account-id"},
  "AssetAccountRef": {"value": "inventory-account-id"}
}
```

---

## JournalEntry

Manual journal entries.

### Required Fields for Create
- `Line` - At least two line items (must balance)

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| TxnDate | Date | Entry date |
| DocNumber | String | Entry number |
| TotalAmt | Decimal | Total amount |
| Adjustment | Boolean | Is adjustment entry |
| Line | Array | Debit and credit lines |
| PrivateNote | String | Internal note |

### Line Item Structure
```json
{
  "Description": "Debit entry",
  "Amount": 1000.00,
  "DetailType": "JournalEntryLineDetail",
  "JournalEntryLineDetail": {
    "PostingType": "Debit",
    "AccountRef": {"value": "account-id"}
  }
}
```

### Example (Complete Entry)
```json
{
  "TxnDate": "2025-01-14",
  "Line": [
    {
      "Description": "Office supplies expense",
      "Amount": 100.00,
      "DetailType": "JournalEntryLineDetail",
      "JournalEntryLineDetail": {
        "PostingType": "Debit",
        "AccountRef": {"value": "expense-account-id"}
      }
    },
    {
      "Description": "Cash payment",
      "Amount": 100.00,
      "DetailType": "JournalEntryLineDetail",
      "JournalEntryLineDetail": {
        "PostingType": "Credit",
        "AccountRef": {"value": "bank-account-id"}
      }
    }
  ]
}
```

---

## Payment

Payments received from customers.

### Required Fields for Create
- `CustomerRef` - Reference to customer
- `TotalAmt` - Payment amount

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| CustomerRef | Reference | Customer |
| TotalAmt | Decimal | Payment amount |
| TxnDate | Date | Payment date |
| PaymentMethodRef | Reference | Payment method |
| DepositToAccountRef | Reference | Deposit account |
| Line | Array | Invoices being paid |
| PaymentRefNum | String | Reference number |
| UnappliedAmt | Decimal | Unapplied amount |

### Example
```json
{
  "CustomerRef": {"value": "123"},
  "TotalAmt": 500.00,
  "Line": [{
    "Amount": 500.00,
    "LinkedTxn": [{
      "TxnId": "invoice-id",
      "TxnType": "Invoice"
    }]
  }]
}
```

---

## Purchase

Purchases (checks, credit card charges, cash expenses).

### Required Fields for Create
- `AccountRef` - Payment account (bank/credit card)
- `PaymentType` - Cash, Check, or CreditCard
- `Line` - At least one line item

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| AccountRef | Reference | Payment account |
| PaymentType | Enum | Cash, Check, CreditCard |
| TxnDate | Date | Transaction date |
| TotalAmt | Decimal | Total amount |
| DocNumber | String | Check/reference number |
| EntityRef | Reference | Vendor (optional) |
| Line | Array | Expense line items |

### Example
```json
{
  "AccountRef": {"value": "checking-account-id"},
  "PaymentType": "Check",
  "TxnDate": "2025-01-14",
  "DocNumber": "1234",
  "EntityRef": {"value": "vendor-id", "type": "Vendor"},
  "Line": [{
    "Amount": 250.00,
    "DetailType": "AccountBasedExpenseLineDetail",
    "AccountBasedExpenseLineDetail": {
      "AccountRef": {"value": "expense-account-id"}
    }
  }]
}
```

---

## Vendor

Vendor/supplier records.

### Required Fields for Create
- `DisplayName` - Vendor display name (must be unique)

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| Id | String | Unique identifier |
| DisplayName | String | Display name (unique) |
| CompanyName | String | Company name |
| GivenName | String | First name |
| FamilyName | String | Last name |
| PrimaryEmailAddr | EmailAddress | Primary email |
| PrimaryPhone | TelephoneNumber | Primary phone |
| BillAddr | PhysicalAddress | Address |
| Balance | Decimal | Outstanding balance |
| Active | Boolean | Is vendor active |
| AcctNum | String | Account number |
| Vendor1099 | Boolean | Is 1099 vendor |
| TaxIdentifier | String | Tax ID |

### Example
```json
{
  "DisplayName": "Office Supply Co",
  "CompanyName": "Office Supply Company",
  "PrimaryEmailAddr": {
    "Address": "orders@officesupply.com"
  },
  "PrimaryPhone": {
    "FreeFormNumber": "555-987-6543"
  },
  "Vendor1099": false
}
```

---

## Common Reference Types

### Reference Object
Used for linking to other entities:
```json
{
  "value": "entity-id",
  "name": "Entity Name"  // Optional, returned in reads
}
```

### EmailAddress
```json
{
  "Address": "email@example.com"
}
```

### TelephoneNumber
```json
{
  "FreeFormNumber": "555-123-4567"
}
```

### PhysicalAddress
```json
{
  "Line1": "123 Main St",
  "Line2": "Suite 100",
  "City": "Anytown",
  "CountrySubDivisionCode": "CA",
  "PostalCode": "90210",
  "Country": "US"
}
```

### MetaData (Read-Only)
Returned on all entities:
```json
{
  "CreateTime": "2025-01-14T10:30:00-08:00",
  "LastUpdatedTime": "2025-01-14T10:30:00-08:00"
}
```

---

## Update Requirements

All updates require:
1. `Id` - Entity identifier
2. `SyncToken` - Current version token (from last read)

The SyncToken prevents concurrent modification conflicts. Always fetch the latest entity before updating to get the current SyncToken.
