# POS to Sales Management Integration - Implementation Prompt

## Task Overview
Integrate the POS system with the Sales Management system to create a complete ERP solution. The goal is to enable credit customers to use POS, provide unified reporting, and allow conversion between POS sales and Sales Invoices/Orders.

## Current System State

### POS System
- Location: `/Users/glplanet/Documents/accounting-web-app/app/pos/`
- Backend: `/Users/glplanet/Documents/account_backend/pos/`
- Purpose: Immediate retail sales (cash/card, walk-in customers)
- Flow: POS Sale → Stock Reduced → Journal Entry (Cash/Bank + Revenue) → Customer Stats Updated
- Characteristics: Immediate payment, no credit terms, no accounts receivable

### Sales Management System
- Order Model: `/Users/glplanet/Documents/account_backend/warehouse/models/Order.js`
- Sales Invoice Model: `/Users/glplanet/Documents/account_backend/warehouse/models/SalesInvoice.js`
- Purpose: B2B credit sales (wholesale, business customers)
- Flow: Sales Order → Order Processing → Delivery → Sales Invoice → Payment Collection
- Characteristics: Credit sales, payment terms, accounts receivable, order management

## Integration Requirements

### 1. POS → Sales Invoice Conversion (HIGH PRIORITY)

**Objective:** Enable conversion of POS sales to Sales Invoices for credit customers

**Implementation Steps:**

**Frontend Changes (`/Users/glplanet/Documents/accounting-web-app/app/pos/components/SellScreen.tsx`):**
- Add "Create Invoice" button in the receipt modal after sale completion
- Button should only show if a customer is selected
- When clicked, open a modal to select payment terms (Net 15, Net 30, Net 60, Due on Receipt)
- Add due date calculation based on payment terms
- Show confirmation dialog before conversion

**Backend Changes:**
- Create new API endpoint in `/Users/glplanet/Documents/account_backend/pos/routes/` for converting POS sale to invoice
- Implement conversion logic in `/Users/glplanet/Documents/account_backend/pos/models/POSSale.js`:
  - Fetch the completed POS sale
  - Reverse the POS journal entry (Debit Revenue, Credit Cash/Bank)
  - Create Sales Invoice using `SalesInvoiceModel.createManual()`
  - Link invoice to original POS sale (add `posSaleId` field to SalesInvoice if needed)
  - Update POS sale status to "Invoiced"
  - Return the created invoice

**Database Changes:**
- Add `posSaleId` field to `SalesInvoice` table to track conversion
- Add `invoiceId` field to `POSSale` table to track conversion

**Business Logic:**
- Stock is already reduced by POS, so no additional stock deduction
- Customer outstanding balance should be increased by invoice amount
- Payment status should be "Unpaid" (since payment was reversed)
- Invoice should be in "Draft" status initially, then auto-post

---

### 2. Customer Credit Management in POS (HIGH PRIORITY)

**Objective:** Show customer credit information and prevent over-credit sales

**Implementation Steps:**

**Frontend Changes (`/Users/glplanet/Documents/accounting-web-app/app/pos/components/SellScreen.tsx`):**
- When customer is selected, fetch customer credit information
- Display customer credit limit and outstanding balance in customer section
- Add credit utilization percentage (outstanding / credit limit * 100)
- Show warning if credit utilization > 80%
- Show error if adding items would exceed credit limit
- Add "Credit Limit" field to customer creation modal
- Add "Credit Terms" field to customer creation modal

**Backend Changes:**
- Add `creditLimit` and `creditTerms` fields to Customer model (if not present)
- Create API endpoint to fetch customer credit info
- Update customer creation to include credit limit and terms
- Add validation in POS sale completion to check credit limit

**Business Logic:**
- Credit check should happen before sale completion
- If sale amount + outstanding balance > credit limit:
  - Show warning with option to override (requires admin approval)
  - Or block sale entirely (configurable)
- Credit utilization should be calculated in real-time

---

### 3. Unified Reporting Dashboard (HIGH PRIORITY)

**Objective:** Create combined revenue dashboard showing POS and Sales Invoice data

**Implementation Steps:**

**Frontend Changes:**
- Create new dashboard page: `/Users/glplanet/Documents/accounting-web-app/app/dashboard/sales-dashboard/page.tsx`
- Show combined revenue metrics:
  - Total Revenue (POS + Invoice)
  - POS Revenue
  - Invoice Revenue
  - Revenue by channel (POS vs Invoice)
  - Revenue by customer
  - Revenue by product
  - Revenue trends over time
- Add date range filter
- Add channel filter (POS, Invoice, Both)
- Show charts/graphs for visualization

**Backend Changes:**
- Create API endpoint to fetch combined sales data
- Aggregate data from both `POSSale` and `SalesInvoice` tables
- Calculate combined metrics
- Support filtering by date, channel, customer, product

**Database Queries:**
- Query `POSSale` table for POS revenue
- Query `SalesInvoice` table for invoice revenue
- Join with `Customer` table for customer-based reports
- Join with `Product` table for product-based reports
- Group by date for trend analysis

---

### 4. POS → Sales Order Conversion (MEDIUM PRIORITY)

**Objective:** Enable conversion of POS sales to Sales Orders for backordering

**Implementation Steps:**

**Frontend Changes (`/Users/glplanet/Documents/accounting-web-app/app/pos/components/SellScreen.tsx`):**
- Add "Create Sales Order" button in receipt modal
- Button should show when items are out of stock
- When clicked, open modal to confirm order details
- Allow editing of expected delivery date
- Show confirmation before conversion

**Backend Changes:**
- Create API endpoint for converting POS sale to Sales Order
- Implement conversion logic:
  - Fetch completed POS sale
  - Reverse POS journal entry
  - Create Sales Order using `OrderModel.create()`
  - Link order to original POS sale
  - Update POS sale status to "Ordered"
  - Return created order

**Database Changes:**
- Add `posSaleId` field to `Order` table
- Add `orderId` field to `POSSale` table

**Business Logic:**
- Stock already reduced by POS, so no additional deduction
- Order should be in "Pending" status
- Customer should be notified of order creation
- Order should follow normal order processing flow

---

### 5. Unified Return Management (MEDIUM PRIORITY)

**Objective:** Create single return system for both POS and Invoice returns

**Implementation Steps:**

**Database Changes:**
- Create unified `Return` table with fields:
  - `id`, `returnNumber`, `type` (POS/Invoice)
  - `sourceId` (posSaleId or invoiceId)
  - `customerId`, `customerName`
  - `returnDate`, `reason`
  - `items` (JSON or separate table)
  - `refundAmount`, `refundMethod`
  - `status` (Pending, Approved, Rejected, Completed)
  - `journalEntryId`
  - `createdBy`, `companyId`

**Backend Changes:**
- Create `ReturnModel` in `/Users/glplanet/Documents/account_backend/warehouse/models/Return.js`
- Implement return processing logic:
  - Validate return eligibility
  - Restore stock
  - Create journal entry (reverse original)
  - Process refund
  - Update source (POS sale or Invoice) status
- Create API endpoints for return CRUD operations

**Frontend Changes:**
- Create unified return management page
- Add return creation from POS receipt
- Add return creation from Invoice page
- Show return history for both POS and Invoice
- Unified return reporting

---

## Implementation Order

### Phase 1 (Week 1-2): Critical Integrations
1. Customer Credit Management in POS
   - Add credit fields to customer
   - Display credit info in POS
   - Implement credit checks

2. POS → Sales Invoice Conversion
   - Add conversion button in POS
   - Implement conversion logic
   - Test with credit customers

3. Unified Reporting Dashboard
   - Create dashboard page
   - Implement combined queries
   - Add charts and filters

### Phase 2 (Week 3-4): Efficiency Improvements
4. POS → Sales Order Conversion
   - Add conversion button
   - Implement conversion logic
   - Test backordering

5. Unified Return Management
   - Create unified return system
   - Migrate existing returns
   - Update POS and Invoice flows

## Testing Requirements

### For Each Integration:
1. Unit tests for backend logic
2. Integration tests for API endpoints
3. Frontend component tests
4. End-to-end workflow tests
5. Edge case testing (errors, conflicts, etc.)

### Test Scenarios:
- POS sale with credit customer → Convert to invoice
- Credit limit exceeded → Warning/Block
- Combined revenue reporting accuracy
- POS sale → Convert to order → Process order
- Return from POS sale
- Return from Invoice
- Concurrent operations (race conditions)

## Database Schema Changes Needed

### Customer Table:
```sql
ALTER TABLE Customer ADD COLUMN creditLimit DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Customer ADD COLUMN creditTerms VARCHAR(50) DEFAULT 'Net 30';
```

### SalesInvoice Table:
```sql
ALTER TABLE SalesInvoice ADD COLUMN posSaleId VARCHAR(255);
ALTER TABLE SalesInvoice ADD INDEX idx_posSaleId (posSaleId);
```

### POSSale Table:
```sql
ALTER TABLE POSSale ADD COLUMN invoiceId VARCHAR(255);
ALTER TABLE POSSale ADD COLUMN orderId VARCHAR(255);
ALTER TABLE POSSale ADD INDEX idx_invoiceId (invoiceId);
ALTER TABLE POSSale ADD INDEX idx_orderId (orderId);
```

### New Return Table:
```sql
CREATE TABLE Return (
  id VARCHAR(255) PRIMARY KEY,
  returnNumber VARCHAR(255) UNIQUE,
  type ENUM('POS', 'Invoice') NOT NULL,
  sourceId VARCHAR(255) NOT NULL,
  customerId VARCHAR(255),
  customerName VARCHAR(255),
  returnDate DATETIME NOT NULL,
  reason TEXT,
  items JSON,
  refundAmount DECIMAL(10,2),
  refundMethod VARCHAR(50),
  status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
  journalEntryId VARCHAR(255),
  createdBy VARCHAR(255),
  companyId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(id),
  FOREIGN KEY (journalEntryId) REFERENCES JournalEntry(id),
  INDEX idx_type (type),
  INDEX idx_sourceId (sourceId),
  INDEX idx_customerId (customerId),
  INDEX idx_companyId (companyId)
);
```

## API Endpoints to Create

### POS → Invoice Conversion:
```
POST /api/pos/sales/:id/convert-to-invoice
Body: { paymentTerms, dueDate }
Response: { invoice, message }
```

### Customer Credit Info:
```
GET /api/customers/:id/credit-info
Response: { creditLimit, outstandingBalance, utilization, creditTerms }
```

### Combined Sales Data:
```
GET /api/sales/combined-revenue
Query: ?startDate=&endDate=&channel=
Response: { totalRevenue, posRevenue, invoiceRevenue, byCustomer, byProduct, trends }
```

### POS → Order Conversion:
```
POST /api/pos/sales/:id/convert-to-order
Body: { expectedDeliveryDate }
Response: { order, message }
```

### Unified Returns:
```
POST /api/returns
Body: { type, sourceId, items, reason, refundMethod }
Response: { return, message }

GET /api/returns
Query: ?type=&customerId=&status=
Response: { returns }

GET /api/returns/:id
Response: { return }
```

## Configuration Options

Add to system configuration:
```javascript
{
  "pos": {
    "creditManagement": {
      "enabled": true,
      "blockOnExceed": false, // true = block, false = warn
      "allowOverride": true, // allow admin to override block
      "warningThreshold": 80 // percentage
    },
    "invoiceConversion": {
      "enabled": true,
      "autoPost": true // auto-post invoice after conversion
    },
    "orderConversion": {
      "enabled": true,
      "requireApproval": false
    }
  }
}
```

## Success Criteria

### Phase 1 Success:
- Credit customers can use POS
- Credit limits are enforced
- POS sales can be converted to invoices
- Combined revenue dashboard shows accurate data
- No data loss or corruption during conversions

### Phase 2 Success:
- POS sales can be converted to orders
- Unified return system works for both POS and Invoice
- All existing functionality still works
- Performance is not significantly impacted

## Notes

- Maintain backward compatibility
- Use database transactions for all conversion operations
- Add proper error handling and logging
- Implement proper validation
- Add user feedback (loading states, success/error messages)
- Test thoroughly before production deployment
- Consider data migration for existing data if needed
- Document all new API endpoints
- Update user documentation
