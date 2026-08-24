# POS System User Guide

## Overview
This guide explains how to use the Point of Sale (POS) system for processing sales and managing operations.



## For Cashiers (Daily Operations)

### Getting Started

#### 1. Login to the System
- Open the application and log in with your credentials
- Navigate to the POS section from the main menu
- The system will check if you have an active shift open

#### 2. Opening Your Shift
If you don't have an active shift, you'll see the Shift Gate screen:

**Step 1: Select Your Terminal**
- Choose the terminal/counter you're working at (e.g., "Main Counter", "Front Desk")
- If no terminals are available, ask your admin to create one
- Click on your terminal to select it

**Step 2: Enter Opening Cash**
- Enter the amount of cash you're starting your shift with
- This is the cash in your drawer at the beginning of your shift
- Add any notes if needed (optional)
- Click "Open Shift & Start Selling"

Your shift is now open and you can start processing sales.

---

### Processing a Sale

#### 1. Add Products to Cart
- Type the product name or SKU in the search box
- Select the product from the search results
- The product will be added to your cart
- You can add multiple products by searching and selecting them

#### 2. Adjust Quantities
- Click on any item in the cart to change its quantity
- A number pad will appear - enter the new quantity
- The line total will update automatically

#### 3. Apply Discounts
- Click the discount icon next to any item to apply a discount
- Enter the discount percentage (e.g., 10 for 10% off)
- You can also apply an overall discount to the entire cart using the discount field

#### 4. Select a Customer
- Type the customer name or phone number in the customer search field
- If the customer exists, select them from the dropdown
- If the customer doesn't exist:
  - Click "Add New Customer" button
  - Fill in customer details (name, phone, email, address)
  - Click "Create Customer"
  - The new customer will be automatically selected

#### 5. Process Payment
- Click the "Checkout" button when ready
- The checkout modal will open showing the total amount
- Select the payment method (Cash, Card, Mobile, Bank Transfer)
- Enter the payment amount
- You can add multiple payment methods if needed
- The system will calculate change due automatically

#### 6. Complete the Sale
- Click "Complete Sale" when payment is sufficient
- The receipt will appear on screen
- The sale is now complete and the cart is cleared

---

### After Sale Completion

#### Receipt Options
After completing a sale, you can:

**Download PDF Receipt**
- Click the download button
- A PDF receipt will be generated and downloaded
- The receipt includes all sale details, items, and totals

**Email Receipt**
- Click the email button
- Enter the customer's email address
- Click "Send"
- The receipt will be emailed to the customer

**Print Receipt**
- Click the print button
- The receipt will be printed on your connected printer

---

### Holding a Sale
If a customer needs to pause and come back later:
- Click the "Hold" button
- The sale will be saved as "held"
- The cart will be cleared
- You can retrieve held sales from the POS Management section (admin access)

---

### Ending Your Shift
When you're done for the day:
- Click "Close Shift" in the sidebar
- The system will show your shift summary:
  - Opening cash amount
  - Total sales made
  - Expected cash in drawer
- Count the actual cash in your drawer
- Enter the actual cash amount
- Click "Close Shift"
- Your shift is now closed

---

## For Admins (Management)

### Accessing POS Management
- Log in as an admin user
- Navigate to POS Management from the main menu
- You'll see several tabs for managing different aspects of the POS

---

### Managing Terminals

#### View Terminals
- Go to the "Terminals" tab
- See all POS terminals in your system
- View terminal status (Active/Inactive)

#### Create New Terminal
- Click "New Terminal" button
- Enter terminal name (e.g., "Main Counter", "Front Desk")
- Enter terminal code (e.g., "TERM-01", "TERM-02")
- Click "Create"
- The terminal is now available for cashiers to use

#### Activate/Deactivate Terminals
- Click on a terminal to view details
- Toggle the active status
- Inactive terminals won't appear for cashiers

---

### Managing Shifts

#### View All Shifts
- Go to the "Shifts" tab
- See all shifts opened by cashiers
- View shift details:
  - Cashier name
  - Terminal used
  - Opening and closing cash
  - Total sales
  - Variance (difference between expected and actual cash)

#### Monitor Shift Performance
- Review shift summaries to identify discrepancies
- Check if cashiers are balancing their drawers correctly
- Track overall shift performance

---

### Managing Sales

#### View All Sales
- Go to the "Sales" tab
- See all completed sales
- Filter by status, date, or other criteria
- View individual sale details

#### Export Sales Data
- Click the "Export" button
- Select date range (From Date and To Date)
- Click "Fetch Records" to see how many sales match
- Export options:
  - **Export PDF**: Generates a PDF report with sales table
  - **Export Excel**: Downloads Excel file with comprehensive sales data

#### View Sale Details
- Click on any sale to view full details
- See customer information, items, payments, and totals

---

### Managing Returns
- Go to the "Returns" tab
- Process customer returns and refunds
- View return history
- Link returns to original sales

---

### Managing Audit Logs

#### View All Activities
- Go to the "Audit Log" tab
- See all POS system activities
- Track what actions were performed
- See which user performed each action
- View timestamps for all activities

#### Export Audit Logs
- Click the "Export" button
- Select date range
- Click "Fetch Records" to see activity count
- Export options:
  - **Export PDF**: Generates PDF with activity table
  - **Export Excel**: Downloads Excel with comprehensive audit data

---

### Managing Held Sales
- From the Sales tab, view held sales
- Retrieve held sales to complete them
- Delete held sales if no longer needed

---

## Common Scenarios

### Scenario 1: New Customer Walks In
1. Start a new sale
2. Search for customer - no results found
3. Click "Add New Customer"
4. Enter customer details (name, phone, email)
5. Click "Create Customer"
6. Customer is automatically selected
7. Add products and complete sale

### Scenario 2: Customer Wants to Pay with Multiple Methods
1. Complete the cart and customer selection
2. Click "Checkout"
3. Add first payment method (e.g., Cash $50)
4. Click "Add Payment" to add another method
5. Add second payment method (e.g., Card $30)
6. System shows remaining balance or change due
7. Complete sale

### Scenario 3: Customer Needs to Pause Shopping
1. Click "Hold" button
2. Sale is saved
3. Customer can come back later
4. Admin retrieves held sale from POS Management
5. Sale is restored to cart for completion

### Scenario 4: End of Day Cash Count
1. Click "Close Shift"
2. Review shift summary
3. Count actual cash in drawer
4. Enter actual amount
5. System calculates variance
6. If variance is significant, investigate
7. Close shift

---

## Tips for Cashiers

- Always select a customer before completing a sale
- Double-check quantities before checkout
- Verify payment amounts match totals
- Use the hold feature for customers who need to step away
- Balance your cash drawer at end of shift
- Report any discrepancies to your manager

---

## Tips for Admins

- Create terminals for each physical counter/location
- Monitor shift variances regularly
- Export sales data periodically for reporting
- Review audit logs to track system usage
- Train cashiers on proper shift procedures
- Keep customer database up to date

---

## Troubleshooting

### Can't Open Shift
- Make sure a terminal is selected
- Check that you have permission to open shifts
- Contact admin if terminals are not available

### Customer Not Found
- Use the "Add New Customer" feature
- Enter at least the customer name (required)
- Other details are optional

### Payment Not Going Through
- Check that payment amount is sufficient
- Try adding multiple payment methods
- Verify payment method is selected correctly

### Shift Won't Close
- Make sure you've entered the actual cash amount
- Check that all sales are completed (not held)
- Contact admin if issue persists

### Export Not Working
- Make sure date range is selected
- Click "Fetch Records" first to see count
- Check that records exist for selected dates

---

## POS System Integration with Other Modules

### Overview
The POS system is fully integrated with your accounting system. When a sale is completed in POS, it automatically updates multiple modules to keep your financial records accurate and up-to-date.

---

### What Happens When a Sale is Completed

#### 1. Inventory Module (Stock Management)
**What it does:**
- Automatically reduces product stock for each item sold
- Updates product's current stock and available stock
- Records the stock movement in the system

**Why it matters:**
- Keeps inventory levels accurate in real-time
- Prevents overselling products
- Helps with stock replenishment planning

**Example:**
- You sell 5 units of "Product A"
- System reduces Product A's stock from 100 to 95
- Creates a stock movement record showing "stock_out" of 5 units

---

#### 2. Stock Movement Module
**What it does:**
- Creates a record for every stock change
- Tracks previous stock, new stock, and quantity changed
- Records reason for movement (e.g., "POS Sale")
- Links to the sale invoice number for reference

**Why it matters:**
- Provides complete audit trail of stock changes
- Helps track where inventory went
- Useful for inventory reconciliation

**Example:**
- Stock movement record created:
  - Product: Product A
  - Type: stock_out
  - Quantity: 5
  - Previous Stock: 100
  - New Stock: 95
  - Reason: POS Sale
  - Reference: POS-20240801-12345

---

#### 3. Chart of Accounts (General Ledger)
**What it does:**
- Automatically creates journal entries for accounting
- Uses standard GL accounts:
  - **Cash Account** (Code: 1100) - for cash payments
  - **Bank Account** (Code: 1110) - for card/bank payments
  - **Sales Revenue Account** (Code: 4000) - for sales income
  - **COGS Account** (Code: 5000) - for cost of goods sold
  - **Inventory Account** (Code: 1300) - for inventory value

**Why it matters:**
- Automatically updates your financial books
- No need for manual accounting entries
- Ensures accurate financial reporting

**Journal Entry Example:**
For a $100 sale paid with cash:
- **Debit:** Cash Account $100
- **Credit:** Sales Revenue Account $100
- **Debit:** COGS Account $60 (cost of goods)
- **Credit:** Inventory Account $60 (inventory reduction)

---

#### 4. Journal Entry Module
**What it does:**
- Creates a journal entry with unique reference number
- Links to the POS sale invoice
- Records all debit and credit lines
- Marks entry as "Posted" automatically

**Why it matters:**
- Complete audit trail in accounting system
- Can view POS sales in Journal Entries report
- Supports financial statement generation

**Example:**
- Journal Entry: JE-POS-1722478400000-1234
- Description: "POS Sale POS-20240801-12345 — John Doe"
- Reference: POS-20240801-12345
- Status: Posted
- Lines: 4 accounting entries (Cash, Revenue, COGS, Inventory)

---

#### 5. Customer Module
**What it does:**
- Updates customer statistics automatically
- Increments total orders count
- Adds sale amount to total spent
- Updates last order date

**Why it matters:**
- Tracks customer purchase history
- Helps identify loyal customers
- Useful for marketing and customer service

**Example:**
- Customer "John Doe" makes a $100 purchase
- System updates:
  - Total Orders: 1 → 2
  - Total Spent: $500 → $600
  - Last Order Date: Updated to today

---

#### 6. POS Audit Log Module
**What it does:**
- Records every POS action
- Tracks who performed the action
- Records action details and timestamps
- Links to company and user

**Why it matters:**
- Complete audit trail of POS activities
- Helps track staff performance
- Useful for security and compliance

**Example:**
- Audit Log Entry:
  - Action: Sale
  - Details: "POS Sale POS-20240801-12345 — Total: $100"
  - User: Cashier Name
  - Timestamp: Current time

---

### What Happens When a Return is Processed

#### 1. Inventory Restoration
- Increases product stock for returned items
- Creates stock movement record (type: "stock_in")
- Updates product's current stock and available stock

#### 2. Reversal of Journal Entry
- Creates reversing journal entry
- Debits Sales Revenue (to reverse income)
- Credits Cash/Bank (to reverse payment)
- Debits Inventory (to restore asset)
- Credits COGS (to reverse expense)

#### 3. Return Record Creation
- Creates POS return record
- Links to original sale
- Records refund method and amount
- Updates original sale status if fully returned

---

### What Happens When a Sale is Held

**Important:** Held sales do NOT affect inventory or accounting
- No stock is reduced
- No journal entry is created
- Sale is saved with status "Held"
- Can be retrieved and completed later
- Only when sale is completed do integrations run

---

### Module Connections Summary

```
POS Sale Completion
    ↓
├─→ Inventory Module (Stock reduced)
│   └─→ Stock Movement Module (Record created)
│
├─→ Chart of Accounts Module (GL accounts used)
│   └─→ Journal Entry Module (Entry created)
│
├─→ Customer Module (Stats updated)
│
└─→ POS Audit Log Module (Action logged)
```

---

### Benefits of Integration

**For Accounting:**
- Automatic financial recording
- No manual data entry needed
- Real-time financial accuracy
- Complete audit trail

**For Inventory:**
- Real-time stock tracking
- Prevents overselling
- Automatic stock movement records

**For Customer Management:**
- Automatic purchase history
- Customer loyalty tracking
- Better customer insights

**For Reporting:**
- All data in one system
- Comprehensive reports possible
- Easy reconciliation

---

### Viewing Integrated Data

**Where to see POS sales in other modules:**

1. **Inventory Module**
   - View stock levels (updated by POS)
   - View stock movements (includes POS sales)

2. **Journal Entries**
   - View POS journal entries
   - Filter by reference (POS invoice number)
   - See full accounting impact

3. **Chart of Accounts**
   - View Cash/Bank account balances (includes POS payments)
   - View Sales Revenue totals (includes POS sales)
   - View COGS totals (includes POS cost)

4. **Customer Module**
   - View customer purchase history
   - See total orders and amount spent
   - Track last order date

5. **Reports**
   - Sales reports include POS sales
   - Inventory reports include POS stock movements
   - Financial statements include POS journal entries

---

### Data Flow Example

**Scenario: Customer buys 2 items for $100 cash**

1. **POS Module**
   - Sale completed: POS-20240801-12345
   - Customer: John Doe
   - Items: 2 units Product A @ $50 each
   - Payment: $100 Cash

2. **Inventory Module**
   - Product A stock: 100 → 98
   - Stock movement created

3. **Journal Entry Module**
   - JE created: JE-POS-1722478400000-1234
   - Debit Cash $100
   - Credit Sales Revenue $100
   - Debit COGS $60
   - Credit Inventory $60

4. **Customer Module**
   - John Doe stats updated
   - Total orders +1
   - Total spent +$100

5. **Audit Log**
   - Action logged: "Sale"
   - Details: "POS Sale POS-20240801-12345 — Total: $100"

All this happens automatically in one transaction when the sale is completed!

---

## POS vs Sales Invoice Module - Understanding the Difference

### Overview
Your system has TWO separate sales modules that serve different purposes in an ERP context:

1. **POS (Point of Sale)** - For immediate retail sales
2. **Sales Invoice** - For credit-based B2B sales

---

### POS Module (Point of Sale)

**Purpose:**
- Retail counter sales
- Immediate payment at time of sale
- Cash, card, mobile payments
- Walk-in customers

**Characteristics:**
- **Instant Payment**: Customer pays immediately
- **Instant Stock Reduction**: Stock reduced at sale time
- **Instant Journal Entry**: Accounting entry created immediately
- **No Credit Terms**: No due dates, no payment terms
- **Simple Flow**: Sale → Payment → Receipt → Done

**Use Cases:**
- Retail store counter sales
- Restaurant orders
- Walk-in customers
- Cash transactions
- Immediate payment scenarios

**Integration Flow:**
```
POS Sale → Stock Reduced → Journal Entry (Cash/Bank + Revenue) → Customer Stats Updated
```

---

### Sales Invoice Module

**Purpose:**
- B2B credit sales
- Customers pay later (credit terms)
- Accounts receivable management
- Order-based invoicing

**Characteristics:**
- **Credit Sales**: Customer pays later (Net 30, Net 60, etc.)
- **Payment Terms**: Due dates, payment schedules
- **Accounts Receivable**: Tracks outstanding balances
- **Two-Step Process**: Invoice created → Payment received later
- **Order Integration**: Can be created from sales orders
- **Draft to Posted**: Invoices start as draft, then posted to accounting

**Use Cases:**
- Wholesale sales to businesses
- Credit sales to regular customers
- Large orders with payment terms
- B2B transactions
- Monthly billing
- Contract-based sales

**Integration Flow:**
```
Sales Order → Sales Invoice → Post Invoice → Journal Entry (AR + Revenue) → Accounts Receivable → Payment Received → AR Updated
```

---

### Key Differences

| Feature | POS Sales | Sales Invoices |
|---------|-----------|----------------|
| **Payment** | Immediate | Later (credit) |
| **Stock Reduction** | Immediate | At invoice posting |
| **Journal Entry** | Immediate | At invoice posting |
| **Accounts Receivable** | No | Yes |
| **Payment Terms** | None | Net 30, Net 60, etc. |
| **Due Dates** | None | Yes |
| **Customer Type** | Walk-in/retail | Business/credit customers |
| **Invoice Status** | Completed immediately | Draft → Posted → Paid |
| **Returns** | Direct refund | Credit memo |
| **Use Case** | Retail/B2C | Wholesale/B2B |

---

### Sales Invoice Module Flow

#### 1. Create Invoice (Two Ways)

**From Sales Order:**
- Sales Order created → Delivery made → Invoice generated from order
- Links to original order and delivery

**Manual Creation:**
- Direct invoice creation without order
- For standalone credit sales

#### 2. Invoice Status: Draft
- Invoice created but not posted to accounting
- Can be edited
- No journal entry created
- No stock reduction
- No accounts receivable record

#### 3. Post Invoice
- Journal entry created:
  - **Debit**: Accounts Receivable (Code: 1200)
  - **Credit**: Sales Revenue (Code: 4000)
- Accounts Receivable record created
- Customer outstanding balance increased
- Stock reduced (if not already reduced by order/delivery)
- Invoice status changes to "Posted"

#### 4. Receive Payment
- Customer pays invoice (partial or full)
- Payment recorded against invoice
- Accounts Receivable updated
- Journal entry created:
  - **Debit**: Cash/Bank Account
  - **Credit**: Accounts Receivable
- Invoice payment status updated (Unpaid → Partial → Paid)

#### 5. Invoice Completion
- When fully paid: Status = "Paid"
- Accounts Receivable cleared
- Customer outstanding balance reduced

---

### What's Wrong/Needs Improvement

#### Current Issues:

1. **No Integration Between POS and Sales Invoice**
   - POS sales don't create Sales Invoices
   - If you want to invoice a POS sale for credit, you have to recreate it manually
   - **Recommendation**: Add option to convert POS sale to Sales Invoice for credit customers

2. **Duplicate Customer Creation Logic**
   - Both POS and Sales Invoice have customer creation
   - POS uses: `CUST-00001` format
   - Sales Invoice uses: `CUS-{timestamp}-{random}` format
   - **Recommendation**: Standardize customer number generation across both modules

3. **No Stock Deduction in Sales Invoice**
   - Sales Invoice doesn't reduce stock automatically
   - Assumes stock already reduced by Order/Delivery
   - **Recommendation**: Add option to reduce stock at invoice posting if not already done

4. **Different Revenue Accounts**
   - POS uses: Sales Revenue (4000)
   - Sales Invoice uses: Sales Revenue (4000)
   - **Recommendation**: Consider separating POS Revenue from Invoice Revenue for better reporting

5. **No Link Between POS and Order**
   - POS sales are standalone
   - Can't convert POS sale to Sales Order
   - **Recommendation**: Add option to create Sales Order from POS sale for backordering

---

### Recommended Integrations

#### 1. POS → Sales Invoice Conversion
**Scenario:** Customer wants to pay later for POS sale
- Add "Create Invoice" option in POS receipt
- Converts POS sale to Sales Invoice
- Reverses POS journal entry
- Creates Sales Invoice with credit terms
- Links to original POS sale

#### 2. Shared Customer Database
- Both modules already share customer database ✓
- Standardize customer number generation
- Share customer credit limits

#### 3. Unified Product Database
- Both modules already share product database ✓
- Ensure consistent pricing
- Sync stock levels

#### 4. Unified Revenue Reporting
- Combine POS sales and Sales Invoice revenue
- Separate reporting by sales channel (POS vs Invoice)
- Dashboard showing total revenue from both

#### 5. Payment Reconciliation
- Link POS payments to bank deposits
- Link Invoice payments to bank deposits
- Unified bank reconciliation

---

### When to Use Which Module

#### Use POS When:
- Customer is at counter/store
- Payment is immediate (cash/card)
- Walk-in customers
- Retail sales
- Restaurant orders
- Small transactions

#### Use Sales Invoice When:
- Customer is a business
- Payment terms are needed (Net 30, Net 60)
- Large orders
- Wholesale sales
- Monthly billing
- Credit sales
- B2B transactions
- Order-based sales

---

### ERP Perspective

**In an ERP system, having both modules is correct because:**

1. **Different Business Processes**
   - Retail: Immediate payment (POS)
   - Wholesale: Credit sales (Invoice)

2. **Different Accounting Treatment**
   - POS: Cash/Bank debit, Revenue credit
   - Invoice: Accounts Receivable debit, Revenue credit

3. **Different Customer Types**
   - POS: Walk-in customers
   - Invoice: Credit customers with payment terms

4. **Different Reporting Needs**
   - POS: Cash flow, daily sales
   - Invoice: Aging reports, outstanding balances

5. **Different Operational Needs**
   - POS: Fast checkout, receipt generation
   - Invoice: Credit management, payment tracking

**Your current setup is correct for a full ERP system. The modules serve different purposes and should remain separate but integrated.**

---

### Summary

- **POS** = Immediate retail sales (cash/card, instant completion)
- **Sales Invoice** = Credit B2B sales (payment terms, accounts receivable)
- Both are needed in an ERP system
- Currently they operate independently
- Recommended: Add integration options (POS → Invoice conversion)
- Standardize customer number generation
- Consider separate revenue accounts for better reporting
