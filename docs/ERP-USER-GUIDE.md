# BisonTechs ERP — Complete User Guide (Start to End)

**Version:** 1.0  
**App:** BisonTechs Accounting ERP (Web)  
**Audience:** Business owners, accountants, warehouse staff, sales & purchase teams

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Pehli Dafa Setup (Day 0)](#2-pehli-dafa-setup-day-0)
3. [Master Data Setup](#3-master-data-setup)
4. [Opening Balances](#4-opening-balances)
5. [Purchase Flow (Procure-to-Pay)](#5-purchase-flow-procure-to-pay)
6. [Sales Flow (Order-to-Cash)](#6-sales-flow-order-to-cash)
7. [Point of Sale (POS) Flow](#7-point-of-sale-pos-flow)
8. [Returns, Refunds & Credit Notes](#8-returns-refunds--credit-notes)
9. [Daily Accounting Operations](#9-daily-accounting-operations)
10. [Warehouse & Inventory Operations](#10-warehouse--inventory-operations)
11. [Tax Compliance](#11-tax-compliance)
12. [Reports — Kahan Dekhein](#12-reports--kahan-dekhein)
13. [Quick Reference: Entry → Update Map](#13-quick-reference-entry--update-map)
14. [Recommended Daily / Weekly Checklist](#14-recommended-daily--weekly-checklist)
15. [Common Mistakes to Avoid](#15-common-mistakes-to-avoid)

---

## 1. App Overview

Login ke baad **Main Dashboard** (`/dashboard`) par aap ko 7 modules milte hain:

| Module | Route | Kaam |
|--------|-------|------|
| **Accounting** | `/accounting/dashboard` | Books, GL, AR/AP, reports, bank, expenses |
| **Warehouse** | `/warehouse/dashboard` | Products, stock, categories, inventory reports |
| **Sales** | `/sales/dashboard` | Orders, deliveries, invoices, payments, returns |
| **Purchases** | `/purchases/dashboard` | PO, GRN, purchase invoices, supplier payments |
| **Point of Sale** | `/pos` | Counter sales (instant sale + stock + cash) |
| **Tax Compliance** | `/tax` | Tax setup, rates, exemptions, liability reports |
| **Users** (Admin) | `/users` | Staff accounts & permissions |

### Golden Rule (Poori App Ke Liye)

Har transaction **2 layers** par effect karti hai:

1. **Operational layer** — stock, orders, invoices, payments (Sales / Purchases / Warehouse screens)
2. **Accounting layer** — Journal Entries, Chart of Accounts balances, AR/AP, Financial Reports (Accounting module)

> **Important:** Stock physical movement aur paisay ki entry alag steps par ho sakti hain. Neeche har flow mein clearly likha hai ke **kis step par kya update hota hai**.

---

## 2. Pehli Dafa Setup (Day 0)

Yeh steps **ek dafa** karni hain jab naya company account banaya ho.

### Step 2.1 — Account Banana & Login

| Step | Screen | Route | Kya Karen |
|------|--------|-------|-----------|
| 1 | Register | `/register` | Personal info → Contact → Business info → Password |
| 2 | Login | `/login` | Email + password |
| 3 | OTP Verify | `/login-otp` | 6-digit OTP enter karein |
| 4 | Main Dashboard | `/dashboard` | App home |

**Register par auto hota hai:**
- Company create
- Default **Chart of Accounts** (COA)
- **Fiscal Year** (business info ke period se)
- 30-day trial

**Kahan dikhega:**
- `/accounting/accounts` — default accounts list
- `/accounting/fiscal-years` — active fiscal year

---

### Step 2.2 — Fiscal Year Check

| Screen | Route | Action |
|--------|-------|--------|
| Fiscal Years | `/accounting/fiscal-years` | Active year verify karein; zarurat ho to naya year add karein |

**Top bar** par current fiscal year hamesha show hota hai — saari accounting entries isi year mein post hoti hain.

---

### Step 2.3 — Chart of Accounts Review

| Screen | Route | Action |
|--------|-------|--------|
| Chart of Accounts | `/accounting/accounts` | Accounts review karein; apne business ke liye extra accounts add karein |

**Key accounts (system auto banata hai):**
- Cash in Hand (1001)
- Bank Accounts
- Inventory (1300)
- Accounts Receivable (1200)
- Accounts Payable (2001 / 2010)
- Revenue, COGS, Expenses

**Kahan dikhega update:**
- Har posted transaction ke baad account **balance** yahi screen par update hoti hai
- `/accounting/general-ledger` — detail transactions
- `/accounting/trial-balance` — sab accounts ka snapshot

---

### Step 2.4 — Bank Accounts Setup

| Screen | Route | Action |
|--------|-------|--------|
| Bank Accounts | `/accounting/bank-Accounts` | Har bank account add karein (name, account number, opening balance) |

**Kahan dikhega:**
- `/accounting/dashboard` — Cash / Bank KPI
- `/accounting/balance-sheet` — Bank & Cash balances
- Payment screens (Sales Payment, Purchase Payment, Stock Movement cash purchase)

---

### Step 2.5 — Tax Setup

| Screen | Route | Action |
|--------|-------|--------|
| Tax Overview | `/tax` | Module overview |
| Country & Profile | `/tax/setup` | Country, tax registration number |
| Types, Rates & Rules | `/tax/rates` | GST/VAT/Sales tax rates |
| Exemptions | `/tax/exemptions` | Tax-exempt customers/products |

**Kahan dikhega:**
- Sales & Purchase invoices par tax calculate hoga
- `/tax/reports` — tax liability summary

---

### Step 2.6 — Users & Permissions (Admin)

| Screen | Route | Action |
|--------|-------|--------|
| Users | `/users` | Staff users add karein; module-wise access dein |

**Example roles:**
- Warehouse staff → Warehouse module only
- Sales team → Sales + limited Accounting (AR view)
- Accountant → Full Accounting access

---

### Step 2.7 — PDF / Branding (Optional)

| Screen | Route | Action |
|--------|-------|--------|
| PDF Reports | `/accounting/pdf-reports` | Logo, company name on invoices/reports |

---

## 3. Master Data Setup

Master data **transactions se pehle** set karni chahiye.

### 3.1 — Product Categories

| Screen | Route |
|--------|-------|
| Categories | `/warehouse/categories` |

**Action:** Category name, description add karein.

---

### 3.2 — Products

| Screen | Route | Notes |
|--------|-------|-------|
| Warehouse Products | `/warehouse/products` | Primary product screen |
| Sales Products | `/sales/products` | Same products, sales module se |
| Purchase Products | `/purchases/products` | Same products, purchase module se |

**Product create karte waqt fill karein:**
- Name, SKU, barcode
- **Cost Price** (inventory valuation ke liye)
- **Selling Price** (sales ke liye)
- Category, unit, reorder level
- Expiry date (agar applicable)

> **Note:** Product create par **opening stock directly mat daalein**. Opening stock ke liye [Section 4 — Opening Balances](#4-opening-balances) dekhein.

**Kahan dikhega:**
- `/warehouse/dashboard` — product count, stock value (cost basis)
- `/warehouse/inventory-valuation` — total inventory value
- `/warehouse/reports/low-stock` — low stock alerts
- Sales/Purchase order screens — product search dropdown

---

### 3.3 — Suppliers

| Screen | Route |
|--------|-------|
| Warehouse Suppliers | `/warehouse/suppliers` |
| Purchase Suppliers | `/purchases/suppliers` |

**Fill karein:** Name, phone, email, address, payment terms.

**Kahan dikhega:**
- Purchase Order, GRN, Purchase Invoice — supplier select
- `/accounting/accounts-payable` — supplier-wise outstanding
- `/purchases/dashboard` — top suppliers

---

### 3.4 — Customers

| Screen | Route |
|--------|-------|
| Warehouse Customers | `/warehouse/customers` |

**Fill karein:** Name, phone, email, credit limit, address.

**Kahan dikhega:**
- Sales Order, Delivery, Sales Invoice — customer select
- `/accounting/accounts-receivable` — customer-wise outstanding
- `/sales/dashboard` — sales KPIs

---

## 4. Opening Balances

Naya business start kar rahe hain ya purana data migrate kar rahe hain — yeh steps **transactions se pehle** karein.

### 4.1 — Opening Stock

| Screen | Route | Action |
|--------|-------|--------|
| Stock Movement | `/warehouse/stock-movement` | **Stock In** → Reason: **Opening Stock** → qty + unit cost enter |

**System kya karta hai:**
- Product `currentStock` increase
- Stock Movement record create
- Journal Entry: **Dr Inventory / Cr Opening Balance Equity**

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/warehouse/products` | Updated stock qty |
| `/warehouse/stock-movement` | Movement history |
| `/warehouse/inventory-valuation` | Inventory value |
| `/accounting/journal-entries` | Opening stock JE |
| `/accounting/balance-sheet` | Inventory asset + Equity |

---

### 4.2 — Owner Capital / Investment

| Screen | Route | Action |
|--------|-------|--------|
| Capital & Equity | `/accounting/capital-equity` | Owner contribution record karein |

**Alternative (stock ke sath):**
Stock Movement → Reason: **Owner Contribution** → stock in with value

**Kahan dikhega:**
- `/accounting/balance-sheet` — Equity section
- `/accounting/general-ledger` — Capital account

---

### 4.3 — Bank Opening Balance

| Screen | Route | Action |
|--------|-------|--------|
| Bank Accounts | `/accounting/bank-Accounts` | Account create karte waqt opening balance |

**Kahan dikhega:**
- `/accounting/balance-sheet` — Cash & Bank
- `/accounting/dashboard` — Cash balance KPI

---

### 4.4 — Existing Customer Balances (AR Opening)

Agar customers pehle se paisay dena baaki hai:
- Sales Invoice create karke **Post** karein (`/sales/invoices`)
- Ya manual Journal Entry (`/accounting/journal-entries`): Dr AR / Cr Opening Balance Equity

---

### 4.5 — Existing Supplier Balances (AP Opening)

Agar suppliers ko paisay dena baaki hai:
- Purchase Invoice post karein (`/purchases/invoices`)
- Ya Stock Movement → **Supplier Credit** (stock + auto AP bill)
- Ya manual JE: Dr Opening Balance Equity / Cr AP

---

## 5. Purchase Flow (Procure-to-Pay)

**Poora flow:** Supplier → PO → GRN (Confirm) → Purchase Invoice (Post) → Payment → AP Clear

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Purchase   │───▶│ Goods        │───▶│ Purchase        │───▶│ Purchase     │───▶│ Accounts        │
│  Order      │    │ Receiving    │    │ Invoice (Post)  │    │ Payment      │    │ Payable         │
│  (Draft)    │    │ GRN Confirm  │    │                 │    │              │    │ (Accounting)    │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘    └─────────────────┘
                         │                      │
                    STOCK IN               GL: Dr Inventory
                    (physical)             Cr Accounts Payable
```

---

### Step 5.1 — Purchase Order (PO)

| Item | Detail |
|------|--------|
| **Screen** | `/purchases/purchaseorder` |
| **Action** | Create PO → supplier select → products + qty + rate → Save |
| **Status** | Draft → Approved (approve karein jab order confirm ho) |

**Is step par kya update hota hai:**
- PO list & count — `/purchases/dashboard`
- PO status — `/purchases/purchaseorder`
- **Stock: NO change**
- **GL: NO entry**

---

### Step 5.2 — Goods Receiving (GRN)

| Item | Detail |
|------|--------|
| **Screen** | `/purchases/goodsRecieving` |
| **Action** | 1. **Receive Goods** → PO select → received qty enter → Save (**Draft** banega) |
| | 2. **Confirm Receiving** button click karein (green check icon) |

> **Zaroori:** Sirf Draft save karne se stock **nahi** badhega. **Confirm** karna zaroori hai.

**Confirm par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **Stock** | Product `currentStock` ↑ |
| **Stock Movement** | Type: Goods Receiving — `/warehouse/stock-movement` |
| **GRN Status** | Draft → Partially/Fully Received |
| **GL** | ❌ Abhi koi entry nahi (sirf physical stock) |

**Kahan verify karein:**
- `/purchases/goodsRecieving` — GRN status, confirmed date
- `/warehouse/products` — stock qty
- `/warehouse/dashboard` — stock value
- `/warehouse/reports/stock-summary` — stock report

---

### Step 5.3 — Purchase Invoice

| Item | Detail |
|------|--------|
| **Screen** | `/purchases/invoices` |
| **Action** | 1. Create invoice → supplier + PO/GRN link → amounts verify |
| | 2. **Post Invoice** click karein |

**Post par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **GL / Journal Entry** | **Dr Inventory / Cr Accounts Payable** |
| **Accounts Payable** | New AP record — outstanding amount |
| **Chart of Accounts** | Inventory & AP balances update |
| **Stock** | Agar GRN se pehle stock nahi aaya to stock bhi add (usually GRN se pehle hi aa chuka hota hai) |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/purchases/invoices` | Status: Posted |
| `/accounting/accounts-payable` | Supplier bill, outstanding amount |
| `/accounting/journal-entries` | Purchase invoice JE |
| `/accounting/general-ledger` | Inventory & AP entries |
| `/accounting/balance-sheet` | Inventory (asset) + AP (liability) |
| `/purchases/dashboard` | Spend, outstanding KPIs |

---

### Step 5.4 — Purchase Payment

| Item | Detail |
|------|--------|
| **Screen** | `/purchases/payments` |
| **Action** | Create Payment → supplier → invoice select → amount → bank/cash account → Save/Complete |

**Payment par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **GL** | **Dr Accounts Payable / Cr Bank or Cash** |
| **AP** | Paid amount ↑, Outstanding ↓ |
| **Bank Account** | Balance ↓ |
| **Purchase Invoice** | Payment status update |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/purchases/payments` | Payment record |
| `/accounting/accounts-payable` | Reduced outstanding |
| `/accounting/bank-Accounts` | Bank balance reduced |
| `/accounting/balance-sheet` | Bank ↓, AP ↓ |
| `/accounting/cash-flow` | Cash outflow |

---

### Step 5.5 — Purchase Return (Optional)

| Item | Detail |
|------|--------|
| **Screen** | `/purchases/returns` |
| **Action** | Return create → supplier + items → process/complete |

**Effect:**
- Stock ↓ (warehouse se wapas supplier ko)
- GL: **Dr AP (or Cash) / Cr Inventory**
- AP outstanding ↓

**Kahan dikhega:**
- `/warehouse/stock-movement` — Purchase Return movement
- `/accounting/accounts-payable` — reduced liability
- `/purchases/dashboard` — returns count

---

## 6. Sales Flow (Order-to-Cash)

**Poora flow:** Customer → Quotation → Sales Order → Delivery (Confirm) → Sales Invoice (Post) → Payment → AR Clear

```
┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌─────────────┐
│ Quotation  │──▶│ Sales Order │──▶│  Delivery    │──▶│ Sales Invoice │──▶│ Sales        │──▶│ Accounts    │
│ (Optional) │   │  (Reserve)  │   │  (Confirm)   │   │  (Post)       │   │ Payment      │   │ Receivable  │
└────────────┘   └─────────────┘   └──────────────┘   └───────────────┘   └──────────────┘   └─────────────┘
                       │                  │                    │
                  Reserve stock      STOCK OUT           GL: Dr AR
                  (available ↓)      (physical ↓)        Cr Revenue
                                                          + COGS entry
```

---

### Step 6.1 — Quotation (Optional)

| Item | Detail |
|------|--------|
| **Screen** | `/sales/quotations` |
| **Action** | Create quotation → customer + items + prices → Send/Print |

**Effect:** Sirf document — **no stock, no GL**

**Kahan dikhega:** `/sales/quotations` list

---

### Step 6.2 — Sales Order

| Item | Detail |
|------|--------|
| **Screen** | `/sales/orders` |
| **Action** | Create Order → customer → products + qty → Save |

**Create par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **Stock (Reservation)** | `reservedStock` ↑ — available stock ↓ |
| **Physical Stock** | ❌ Abhi physical issue nahi |
| **GL** | ❌ No entry |

**Kahan verify karein:**
- `/sales/orders` — order status (Pending, Processing, etc.)
- `/sales/dashboard` — order count, revenue pipeline
- `/warehouse/products` — reserved qty (internal)

**Order Cancel karein to:** reservation release ho jati hai.

---

### Step 6.3 — Sales Delivery

| Item | Detail |
|------|--------|
| **Screen** | `/sales/deliveries` |
| **Action** | 1. **Create Delivery** → sales order select → delivery qty |
| | 2. Delivery **Pending** state mein save hoti hai |
| | 3. **Confirm Delivery** button click karein ✅ |

> **Zaroori:** Confirm ke bina stock **nahi** niklega.

**Confirm par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **Stock** | `currentStock` ↓ (physical issue) |
| **Stock Movement** | Stock Out — `/warehouse/stock-movement` |
| **Sales Order Status** | Partially Delivered / Delivered |
| **GL** | ❌ Abhi revenue/COGS nahi (invoice par hoga) |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/sales/deliveries` | Status Delivered, Confirmed At timestamp |
| `/sales/orders` | Order status updated |
| `/warehouse/products` | Stock qty reduced |
| `/warehouse/stock-movement` | Out movement record |

---

### Step 6.4 — Sales Invoice

| Item | Detail |
|------|--------|
| **Screen** | `/sales/invoices` |
| **Action** | 1. Create invoice → customer + order/delivery link |
| | 2. **Post Invoice** click karein |

**Post par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **GL — Revenue** | **Dr Accounts Receivable / Cr Sales Revenue** (+ tax if applicable) |
| **GL — COGS** | **Dr Cost of Goods Sold / Cr Inventory** |
| **Accounts Receivable** | Customer outstanding ↑ |
| **Customer Balance** | `outstandingBalance` ↑ |
| **Stock** | ❌ (already reduced on delivery confirm) |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/sales/invoices` | Status: Posted |
| `/accounting/accounts-receivable` | Customer outstanding |
| `/accounting/journal-entries` | Revenue JE + COGS JE |
| `/accounting/profit-loss` | Revenue & COGS |
| `/accounting/balance-sheet` | AR (asset), Inventory reduced via COGS |
| `/sales/dashboard` | Revenue KPIs |

---

### Step 6.5 — Sales Payment

| Item | Detail |
|------|--------|
| **Screen** | `/sales/sales-payment` |
| **Action** | Create Payment → customer → invoice(s) select → amount → bank/cash → Complete |

**Payment par kya update hota hai:**

| Layer | Update |
|-------|--------|
| **GL** | **Dr Bank/Cash / Cr Accounts Receivable** |
| **AR** | Outstanding ↓ |
| **Invoice** | Paid amount ↑, status Paid/Partial |
| **Bank** | Balance ↑ |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/sales/sales-payment` | Payment record |
| `/accounting/accounts-receivable` | Reduced outstanding |
| `/accounting/bank-Accounts` | Bank balance increased |
| `/accounting/balance-sheet` | Bank ↑, AR ↓ |
| `/accounting/cash-flow` | Cash inflow |

---

## 7. Point of Sale (POS) Flow

Counter / retail sales ke liye — **sab kuch ek step mein** (stock + revenue + COGS + cash).

| Item | Detail |
|------|--------|
| **Screen** | `/pos` |
| **Management** | `/pos/management` (terminals, shifts, history) |

### Step 7.1 — Shift Open

1. `/pos` open karein
2. **Open Shift** → opening cash amount enter karein

### Step 7.2 — Sale Complete

1. Products scan/search karein
2. Qty set karein
3. Payment method select (Cash, Card, etc.)
4. **Complete Sale**

**Ek hi step mein kya hota hai:**

| Layer | Update |
|-------|--------|
| **Stock** | Immediate stock out |
| **GL — Revenue** | Dr Cash/Bank / Cr Revenue |
| **GL — COGS** | Dr COGS / Cr Inventory |
| **Receipt** | Print/email receipt |

**Kahan verify karein:**
| Screen | Kya dikhega |
|--------|-------------|
| `/pos/management` | Shift sales, daily report |
| `/warehouse/stock-movement` | POS stock out |
| `/accounting/journal-entries` | POS JEs |
| `/accounting/profit-loss` | POS revenue included |
| `/sales/dashboard` | POS sales metrics |

### Step 7.3 — Shift Close

1. `/pos` → **Close Shift**
2. Closing cash count enter karein
3. `/pos/management` → shift report dekhein

---

## 8. Returns, Refunds & Credit Notes

### 8.1 — Sales Return (Stock Wapas + GL)

**Flow:** Create → **Approve** → **Complete**

| Step | Screen | Route | Action |
|------|--------|-------|--------|
| 1 | Sales Returns | `/sales/returns` | Create Return → order select → items + qty |
| 2 | Same | `/sales/returns` | **Approve** button |
| 3 | Same | `/sales/returns` | **Complete** button ✅ |

**Complete par kya hota hai:**

| Layer | Update |
|-------|--------|
| **Stock** | Stock wapas warehouse mein (↑) |
| **GL** | Dr Sales Returns & Allowances / Cr AR |
| **COGS Reversal** | Dr Inventory / Cr COGS (restocked items) |
| **Customer AR** | Outstanding ↓ |

**Kahan dikhega:**
- `/warehouse/stock-movement` — Return type movement
- `/sales/returns` — Status: Completed
- `/accounting/accounts-receivable` — reduced balance
- `/accounting/journal-entries` — Return JE
- `/sales/dashboard` — returns KPI

---

### 8.2 — Sales Refund (Cash Wapas)

**Flow:** Create → **Complete**

| Step | Screen | Route |
|------|--------|-------|
| 1 | Sales Refunds | `/sales/refunds` |
| 2 | Complete refund | Same screen |

**Complete par kya hota hai:**

| Layer | Update |
|-------|--------|
| **GL** | **Dr AR / Cr Bank or Cash** (cash wapas customer ko) |
| **Stock** | ❌ (stock return alag step mein hota hai — Section 8.1) |

**Kahan dikhega:**
- `/sales/refunds` — Completed status
- `/accounting/bank-Accounts` — cash reduced
- `/accounting/journal-entries` — Refund JE

---

### 8.3 — Credit Notes (Accounting Adjustment)

| Screen | Route |
|--------|-------|
| Credit Notes | `/accounting/credit-notes` |

**Use case:** Invoice par credit dena (return, discount, price correction) bina full return flow ke.

**Create par:**
- GL: Dr Contra-Revenue / Cr AR
- Stock return (agar reason = Return/Damaged): stock ↑ + COGS reversal

**Void par:** sab entries reverse

**Kahan dikhega:**
- `/accounting/credit-notes` — list & status
- `/accounting/accounts-receivable` — reduced outstanding
- `/accounting/journal-entries` — CN JEs

---

### 8.4 — Purchase Return

| Screen | Route |
|--------|-------|
| Purchase Returns | `/purchases/returns` |

**Effect:** Stock ↓, AP ↓, GL: Dr AP / Cr Inventory

---

## 9. Daily Accounting Operations

Yeh transactions **Accounting module** se directly hoti hain.

### 9.1 — Expenses (Rent, Utilities, Salary, etc.)

| Screen | Route |
|--------|-------|
| Expenses | `/accounting/expenses` |

**Action:** Create expense → category → amount → bank/cash account → Save

**GL:** Dr Expense Account / Cr Bank or Cash

**Kahan dikhega:**
- `/accounting/expenses` — list
- `/accounting/profit-loss` — expense section
- `/accounting/bank-Accounts` — balance reduced
- `/accounting/general-ledger` — expense account

---

### 9.2 — Other Income

| Screen | Route |
|--------|-------|
| Income | `/accounting/income` |

**GL:** Dr Bank/Cash / Cr Other Income

**Kahan dikhega:** `/accounting/profit-loss` — other income section

---

### 9.3 — Manual Journal Entry

| Screen | Route |
|--------|-------|
| Journal Entries | `/accounting/journal-entries` |

**Use when:** Adjustments, corrections, non-standard transactions

**Action:** Create JE → debit & credit lines → **Post**

**Kahan dikhega:**
- `/accounting/general-ledger`
- `/accounting/trial-balance`
- `/accounting/balance-sheet`
- All financial reports

---

### 9.4 — Fixed Assets

| Screen | Route |
|--------|-------|
| Fixed Assets | `/accounting/fixed-assets` |

**Actions:**
- Add asset (purchase)
- Run depreciation

**GL:** Acquisition: Dr Fixed Asset / Cr Bank/AP; Depreciation: Dr Depreciation Expense / Cr Accumulated Depreciation

**Kahan dikhega:**
- `/accounting/balance-sheet` — Fixed Assets
- `/accounting/profit-loss` — Depreciation expense

---

### 9.5 — Loans & Borrowings

| Screen | Route |
|--------|-------|
| Loans & Borrowings | `/accounting/loans-borrowings` |

**Actions:** Loan receive, interest payment, principal repayment

**Kahan dikhega:** Balance Sheet — Liabilities section

---

### 9.6 — Capital & Equity

| Screen | Route |
|--------|-------|
| Capital & Equity | `/accounting/capital-equity` |

**Actions:** Owner investment, drawings

**Kahan dikhega:** Balance Sheet — Equity section

---

### 9.7 — Accounts Payable (Direct Bill Payment)

| Screen | Route |
|--------|-------|
| Accounts Payable | `/accounting/accounts-payable` |

**Use for:** Supplier credit stock (`Stock Movement → Supplier Credit` auto bill), manual bills, **Pay & Clear** outstanding

**Pay action GL:** Dr AP / Cr Bank

---

### 9.8 — Accounts Receivable (Overview)

| Screen | Route |
|--------|-------|
| Accounts Receivable | `/accounting/accounts-receivable` |
| Aged Receivables | `/accounting/aged-recievables` |

**Use for:** Customer outstanding overview, aging report, follow-up collections

---

## 10. Warehouse & Inventory Operations

### 10.1 — Manual Stock In

| Screen | Route |
|--------|-------|
| Stock Movement | `/warehouse/stock-movement` |

| Reason | Accounting Effect | Extra |
|--------|-------------------|-------|
| Opening Stock | Dr Inventory / Cr Equity | — |
| Owner Contribution | Dr Inventory / Cr Capital | — |
| Supplier Credit (Pay Later) | Dr Inventory / Cr AP | Auto AP bill banega |
| Cash / Bank Purchase | Dr Inventory / Cr Bank | Bank account select karein |
| Free / Sample | Dr Inventory / Cr Other Income | — |
| Physical Count (+) | Dr Inventory / Cr Other Income | — |
| Transfer In | No GL | Stock only |

---

### 10.2 — Manual Stock Out

| Screen | Route |
|--------|-------|
| Stock Movement | `/warehouse/stock-movement` |

| Reason | Accounting Effect |
|--------|-------------------|
| Damage / Expiry | Dr Write-off Expense / Cr Inventory |
| Sample / Gift | Dr Promotional Expense / Cr Inventory |
| Physical Count (-) | Dr Adjustment Loss / Cr Inventory |
| Internal / Office Use | Dr Internal Consumption / Cr Inventory |

**Kahan verify karein:**
- `/warehouse/products` — qty
- `/warehouse/stock-movement` — history
- `/warehouse/inventory-valuation` — value
- `/accounting/journal-entries` — auto JE
- `/accounting/accounts-payable` — (supplier credit case)

---

### 10.3 — Inventory Reports

| Report | Route | Purpose |
|--------|-------|---------|
| Inventory Valuation | `/warehouse/inventory-valuation` | Total stock value (cost basis) |
| Stock Summary | `/warehouse/reports/stock-summary` | Product-wise stock |
| Low Stock | `/warehouse/reports/low-stock` | Reorder alerts |
| Expiry Report | `/warehouse/reports/expiry` | Expiring products |
| All Reports | `/warehouse/reports` | Report hub |

---

## 11. Tax Compliance

| Step | Screen | Route |
|------|--------|-------|
| 1 | Setup | `/tax/setup` |
| 2 | Rates | `/tax/rates` |
| 3 | Exemptions | `/tax/exemptions` |
| 4 | Reports | `/tax/reports` |

Tax invoices (Sales/Purchase) par automatically apply hota hai jab rates configured hon.

---

## 12. Reports — Kahan Dekhein

### Operational Dashboards

| Dashboard | Route | Kya dikhata hai |
|-----------|-------|-----------------|
| Main Dashboard | `/dashboard` | Cross-module overview |
| Accounting Dashboard | `/accounting/dashboard` | Revenue, expenses, cash, AR, AP |
| Sales Dashboard | `/sales/dashboard` | Sales, orders, returns, trends |
| Purchase Dashboard | `/purchases/dashboard` | Spend, POs, suppliers, outstanding |
| Warehouse Dashboard | `/warehouse/dashboard` | Stock count, value, movements |

### Financial Reports (Accounting)

| Report | Route | Kya dikhata hai |
|--------|-------|-----------------|
| General Ledger | `/accounting/general-ledger` | Har account ki detail transactions |
| Trial Balance | `/accounting/trial-balance` | All accounts debit/credit balance |
| Profit & Loss | `/accounting/profit-loss` | Revenue, COGS, expenses, net profit |
| Balance Sheet | `/accounting/balance-sheet` | Assets, Liabilities, Equity |
| Cash Flow | `/accounting/cash-flow` | Operating, investing, financing cash |
| Aged Receivables | `/accounting/aged-recievables` | Customer overdue aging |
| Accounting Reports | `/accounting/reports` | Report hub |

### Module Reports

| Report | Route |
|--------|-------|
| Sales Reports | `/sales/reports` |
| Purchase Reports | `/purchases/reports` |
| Warehouse Reports | `/warehouse/reports` |
| Tax Reports | `/tax/reports` |
| POS Reports | `/pos/management` |

---

## 13. Quick Reference: Entry → Update Map

### Purchase Cycle

| # | Entry Screen | Action | Stock Update | GL Update | Dekhein Kahan |
|---|-------------|--------|--------------|-----------|---------------|
| 1 | `/purchases/purchaseorder` | Create PO | ❌ | ❌ | PO list, Purchase dashboard |
| 2 | `/purchases/goodsRecieving` | GRN Draft | ❌ | ❌ | GRN list (Draft) |
| 3 | `/purchases/goodsRecieving` | **Confirm GRN** | ✅ Stock IN | ❌ | Products, Stock Movement, Warehouse dashboard |
| 4 | `/purchases/invoices` | **Post Invoice** | ❌* | ✅ Dr Inv Cr AP | AP, JE, Balance Sheet, GL |
| 5 | `/purchases/payments` | Pay supplier | ❌ | ✅ Dr AP Cr Bank | AP, Bank, Cash Flow |

*Stock usually GRN se pehle aa chuka hota hai.

---

### Sales Cycle

| # | Entry Screen | Action | Stock Update | GL Update | Dekhein Kahan |
|---|-------------|--------|--------------|-----------|---------------|
| 1 | `/sales/quotations` | Create quote | ❌ | ❌ | Quotations list |
| 2 | `/sales/orders` | Create order | Reserve only | ❌ | Orders list, Sales dashboard |
| 3 | `/sales/deliveries` | **Confirm delivery** | ✅ Stock OUT | ❌ | Products, Stock Movement, Order status |
| 4 | `/sales/invoices` | **Post invoice** | ❌ | ✅ Dr AR Cr Rev + COGS | AR, JE, P&L, Balance Sheet |
| 5 | `/sales/sales-payment` | Receive payment | ❌ | ✅ Dr Bank Cr AR | AR, Bank, Cash Flow |

---

### Returns Cycle

| # | Entry Screen | Action | Stock | GL | Dekhein Kahan |
|---|-------------|--------|-------|-----|---------------|
| 1 | `/sales/returns` | Approve | ❌ | ❌ | Returns list |
| 2 | `/sales/returns` | **Complete** | ✅ Stock IN | ✅ Return + COGS rev | Stock Movement, AR, JE |
| 3 | `/sales/refunds` | **Complete** | ❌ | ✅ Dr AR Cr Cash | Bank, JE |

---

### POS Cycle

| # | Entry Screen | Action | Stock | GL | Dekhein Kahan |
|---|-------------|--------|-------|-----|---------------|
| 1 | `/pos` | Open shift | ❌ | ❌ | POS management |
| 2 | `/pos` | **Complete sale** | ✅ OUT | ✅ Rev + COGS | POS report, JE, P&L |
| 3 | `/pos` | Close shift | ❌ | ❌ | Shift report |

---

### Manual Stock

| # | Entry Screen | Reason | Stock | GL | Dekhein Kahan |
|---|-------------|--------|-------|-----|---------------|
| 1 | `/warehouse/stock-movement` | Opening Stock | ✅ IN | ✅ Dr Inv Cr Equity | Products, BS, JE |
| 2 | `/warehouse/stock-movement` | Supplier Credit | ✅ IN | ✅ Dr Inv Cr AP | Products, AP, JE |
| 3 | `/warehouse/stock-movement` | Cash Purchase | ✅ IN | ✅ Dr Inv Cr Bank | Products, Bank, JE |
| 4 | `/warehouse/stock-movement` | Damage/Expiry OUT | ✅ OUT | ✅ Dr Exp Cr Inv | Products, P&L, JE |

---

## 14. Recommended Daily / Weekly Checklist

### Rozana (Daily)

- [ ] `/pos` — shift open/close + cash reconcile
- [ ] `/sales/deliveries` — pending deliveries confirm karein
- [ ] `/sales/invoices` — delivered orders ke invoices post karein
- [ ] `/sales/sales-payment` — payments record karein
- [ ] `/purchases/goodsRecieving` — aaye hue maal ka GRN confirm karein
- [ ] `/accounting/expenses` — daily expenses enter karein
- [ ] `/warehouse/reports/low-stock` — reorder check

### Haftawar (Weekly)

- [ ] `/accounting/accounts-receivable` — overdue customers follow-up
- [ ] `/accounting/accounts-payable` — supplier payments plan
- [ ] `/accounting/bank-Accounts` — bank balance reconcile
- [ ] `/warehouse/inventory-valuation` — stock value vs balance sheet inventory
- [ ] `/accounting/trial-balance` — books balanced hain verify karein
- [ ] `/accounting/profit-loss` — weekly profit review

### Mahana (Monthly)

- [ ] `/accounting/balance-sheet` — full financial position
- [ ] `/accounting/cash-flow` — cash movement review
- [ ] `/accounting/fixed-assets` — depreciation run
- [ ] `/tax/reports` — tax liability
- [ ] `/accounting/aged-recievables` — aging analysis

---

## 15. Common Mistakes to Avoid

| ❌ Galti | ✅ Sahi Tareeqa |
|---------|----------------|
| Product create par opening stock daalna | Stock Movement → Opening Stock reason use karein |
| GRN sirf save karna, confirm nahi karna | GRN **Confirm** karein — tab stock aayega |
| Delivery create karna lekin confirm nahi karna | Delivery **Confirm** karein — tab stock niklega |
| Invoice post kiye bina payment lena | Pehle invoice **Post** → phir payment |
| Return create karna lekin Complete nahi karna | Approve → **Complete** karein — tab stock + GL update |
| Refund Complete karna lekin Return Complete nahi | Return Complete = stock; Refund Complete = cash |
| Supplier se maal liya, sirf PI post kiya, GRN nahi | Pehle GRN confirm (stock) → phir PI post (AP) |
| POS aur Sales Order dono se same stock double issue | POS = direct sale; Sales = Order → Delivery → Invoice flow — mix na karein |
| Fiscal year galat select karke entries post karna | Top bar mein sahi fiscal year select karein |

---

## Appendix A — Module Screen Index

### Accounting (`/accounting/...`)
Dashboard · Chart of Accounts · Bank Accounts · Invoices · Accounts Receivable · Expenses · Accounts Payable · Income · Journal Entries · General Ledger · Trial Balance · Fixed Assets · Loans & Borrowings · Capital & Equity · Reports · Profit & Loss · Balance Sheet · Cash Flow · Aged Receivables · Fiscal Years · Currency · PDF Reports

### Warehouse (`/warehouse/...`)
Dashboard · Products · Categories · Suppliers · Stock Movement · Customers · Inventory Valuation · Reports (Stock Summary, Low Stock, Expiry) · Product Settings

### Sales (`/sales/...`)
Dashboard · Reports · Products · Orders · Deliveries · Invoices · Sales Payments · Returns · Refunds · Quotations · Currency

### Purchases (`/purchases/...`)
Dashboard · Reports · Products · Purchase Orders · Suppliers · Goods Receiving · Purchase Invoices · Purchase Payments · Returns · Currency

### POS (`/pos/...`)
Sell Screen · Management (terminals, shifts, reports)

### Tax (`/tax/...`)
Overview · Setup · Rates · Exemptions · Reports

---

## Appendix B — Status Flow Cheat Sheet

### Purchase Order Status
`Draft` → `Approved` → `Received` (via GRN) → `Invoiced` → `Paid`

### GRN Status
`Draft` → **Confirm** → `Partially Received` / `Fully Received`

### Sales Order Status
`Draft` → `Pending` → `Processing` → `Packed` → `Shipped` → `Partially Delivered` → `Delivered`

### Delivery Status
`Pending` → **Confirm** → `Delivered` / `Partially Delivered`

### Sales Invoice Status
`Draft` → **Posted** → `Paid` / `Partial`

### Sales Return Status
`Pending` → `Approved` → **Completed**

### Refund Status
`Pending` → **Completed**

---

*Document maintained for BisonTechs ERP. For support: `/support` screen or your system administrator.*
