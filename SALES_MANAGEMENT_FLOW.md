# Sales Management Flow Documentation

## Overview
This document explains the complete sales management flow in your ERP system, from order creation to payment collection and returns.

---

## Complete Sales Management Flow

### Flow Overview

```
Customer Inquiry → Sales Order → Order Processing → Delivery → Sales Invoice → Payment Collection → Returns (if needed)
```

---

## 1. Sales Order Creation

### Purpose
Sales Orders are the first step in the sales management process. They represent a commitment from a customer to purchase goods.

### When to Create Sales Order
- Customer places an order (online, phone, email)
- B2B customer requests goods
- Large orders that require processing
- Orders that need delivery
- Credit sales (payment later)

### Sales Order Creation Flow

**Step 1: Customer Information**
- Select existing customer or create new one
- Enter customer details:
  - Name, email, phone
  - Billing address
  - Shipping address
  - Customer type (Individual, Business, Wholesale)
  - Tax ID (for business customers)

**Step 2: Order Details**
- Add products to order
- For each product:
  - Product name and SKU
  - Quantity
  - Unit price
  - Discount (if any)
  - Tax rate
  - Total price
- Set order details:
  - Order date
  - Expected delivery date
  - Shipping method (Standard, Express, Overnight)
  - Shipping carrier
  - Payment method
  - Payment terms (Net 30, Net 60, etc.)
  - Sales person
  - Priority (Low, Medium, High)
  - Source (Web, Phone, Email, Walk-in)

**Step 3: Order Calculation**
- Subtotal: Sum of all item totals
- Discount total: Total discounts applied
- Tax total: Total taxes
- Shipping cost: Shipping charges
- Grand total: Subtotal - Discount + Tax + Shipping

**Step 4: Order Status**
- Order created with status: "Draft"
- Can be edited while in Draft status
- No stock deducted yet
- No accounting entries created

**Step 5: Order Confirmation**
- Change status from "Draft" to "Pending"
- Stock is automatically deducted for Sales Orders
- Order is now confirmed and cannot be edited (except status changes)

### Order Number Format
- Sales Order: `SO-YYYYMMDD-XXXX` (e.g., SO-20240801-1234)
- Purchase Order: `PO-YYYYMMDD-XXXX` (e.g., PO-20240801-1234)

### Stock Impact
- When Sales Order is confirmed (not Draft):
  - Product stock is reduced
  - Available stock is reduced
  - Stock movement record created (type: "order_reserved")

---

## 2. Order Processing

### Order Status Flow

```
Draft → Pending → Processing → Packed → Shipped → In Transit → Delivered
                ↓
            On Hold
                ↓
            Cancelled
```

### Status Explanations

**Draft**
- Order created but not confirmed
- Can be edited
- No stock deducted
- No accounting impact

**Pending**
- Order confirmed
- Stock deducted
- Waiting to be processed
- Cannot be edited

**Processing**
- Order is being picked
- Items being gathered from warehouse
- Picker assigned

**Packed**
- Items picked and packed
- Packer assigned
- Ready for shipping
- Shipping label generated

**Shipped**
- Order handed to shipping carrier
- Shipper assigned
- Tracking number assigned
- Shipping date recorded

**In Transit**
- Order is with shipping carrier
- On the way to customer
- Customer can track shipment

**Delivered**
- Order delivered to customer
- Delivery date recorded
- Ready for invoicing

**On Hold**
- Order paused
- Waiting for customer action (payment, confirmation)
- Can be resumed later

**Cancelled**
- Order cancelled
- Stock restored
- Cannot be processed further

### Order Processing Steps

#### Step 1: Order Confirmation
- Change status from "Draft" to "Pending"
- Stock automatically deducted
- Customer receives order confirmation

#### Step 2: Picking
- Change status to "Processing"
- Assign picker (warehouse staff)
- Picker gathers items from warehouse
- Update item quantities if shortages found

#### Step 3: Packing
- Change status to "Packed"
- Assign packer
- Items packed into shipping boxes
- Shipping label generated
- Weight and dimensions recorded

#### Step 4: Shipping
- Change status to "Shipped"
- Assign shipper
- Hand to shipping carrier
- Tracking number assigned
- Customer notified with tracking info

#### Step 5: Delivery
- Change status to "In Transit"
- Order in transit to customer
- Customer can track shipment

#### Step 6: Completion
- Change status to "Delivered"
- Delivery date recorded
- Order ready for invoicing

### Fulfillment Status
Separate from order status, tracks fulfillment progress:
- Not Started
- Partially Fulfilled
- Fully Fulfilled

### Approval Status
For orders requiring approval:
- Pending Approval
- Approved
- Rejected

---

## 3. Delivery Management

### Purpose
Deliveries track the physical shipment of goods to customers.

### Delivery Creation
- Delivery can be created from Sales Order
- Or created manually for standalone shipments

### Delivery Information
- Delivery number (auto-generated)
- Linked to Sales Order
- Customer name and address
- Delivery date
- Expected delivery date
- Shipping method and carrier
- Tracking number
- Delivery status

### Delivery Status Flow

```
Pending → Picked Up → In Transit → Out for Delivery → Delivered → Failed
```

### Delivery Status Explanations

**Pending**
- Delivery scheduled but not started
- Waiting for pickup

**Picked Up**
- Carrier picked up shipment
- On its way

**In Transit**
- Shipment is with carrier
- Moving to destination

**Out for Delivery**
- Shipment at local facility
- Will be delivered today

**Delivered**
- Successfully delivered
- Proof of delivery recorded (signature, photo)

**Failed**
- Delivery attempt failed
- Will retry or return to sender

### Proof of Delivery
- Signature capture
- Photo of delivered package
- Delivery time
- Recipient name
- Delivery notes

---

## 4. Sales Invoice Generation

### Purpose
Sales Invoices are the official billing documents sent to customers for payment.

### When to Create Sales Invoice
- After order is delivered
- For credit sales (payment terms)
- For B2B customers
- For monthly billing
- For contract-based sales

### Invoice Creation Methods

#### Method 1: From Sales Order
- Select delivered Sales Order
- Generate invoice from order
- Auto-fills:
  - Customer information
  - Order items and quantities
  - Prices and discounts
  - Shipping details
  - Order number reference

#### Method 2: Manual Creation
- Create invoice without order
- For standalone credit sales
- Manual entry of all details

### Invoice Status Flow

```
Draft → Posted → Partially Paid → Paid
          ↓
      Cancelled
```

### Invoice Status Explanations

**Draft**
- Invoice created but not posted to accounting
- Can be edited
- No journal entry created
- No accounts receivable record
- No stock reduction (already done by order)

**Posted**
- Invoice posted to accounting
- Journal entry created
- Accounts receivable record created
- Customer outstanding balance increased
- Cannot be edited (except notes)

**Partially Paid**
- Customer made partial payment
- Outstanding balance reduced
- Payment recorded

**Paid**
- Fully paid by customer
- Outstanding balance = 0
- Accounts receivable cleared

**Cancelled**
- Invoice cancelled
- Journal entry reversed
- Accounts receivable deleted
- Customer outstanding balance reduced

### Invoice Number Format
- `SI-YYYYMMDD-XXXX` (e.g., SI-20240801-1234)

### Payment Terms
- Net 15: Payment due in 15 days
- Net 30: Payment due in 30 days
- Net 60: Payment due in 60 days
- Due on Receipt: Payment due immediately
- Custom: Custom payment terms

### Due Date Calculation
- Based on payment terms
- Invoice date + payment term days
- Example: Invoice date Aug 1 + Net 30 = Due date Aug 31

---

## 5. Payment Collection

### Purpose
Track and record customer payments against invoices.

### Payment Methods
- Cash
- Bank Transfer
- Credit Card
- Check
- Mobile Payment
- Online Payment Gateway

### Payment Recording Flow

**Step 1: Receive Payment**
- Customer makes payment
- Payment method recorded
- Amount recorded
- Reference number (check number, transaction ID)

**Step 2: Apply to Invoice**
- Select invoice to apply payment
- Payment amount deducted from outstanding balance
- Payment status updated

**Step 3: Accounting Entry**
- Journal entry created:
  - Debit: Cash/Bank Account
  - Credit: Accounts Receivable
- Payment recorded in system

**Step 4: Invoice Status Update**
- If full payment: Status = "Paid"
- If partial payment: Status = "Partially Paid"
- Outstanding balance updated

**Step 5: Accounts Receivable Update**
- AR record updated
- Customer outstanding balance reduced
- Payment history recorded

### Payment Status
- Pending: Payment expected but not received
- Completed: Payment received and recorded
- Failed: Payment failed (insufficient funds, etc.)
- Refunded: Payment refunded to customer

---

## 6. Returns and Refunds

### Purpose
Handle customer returns and process refunds.

### Return Types
- Full Return: All items returned
- Partial Return: Some items returned
- Exchange: Items exchanged for different items

### Return Process Flow

**Step 1: Return Request**
- Customer requests return
- Reason recorded (defective, wrong item, etc.)
- Return authorization issued

**Step 2: Item Return**
- Items received back
- Condition inspected
- Return quantity verified

**Step 3: Stock Restoration**
- Returned items added back to stock
- Stock movement created (type: "stock_in")
- Inventory updated

**Step 4: Refund Processing**
- Refund method selected (original payment, store credit, etc.)
- Refund amount calculated
- Refund processed

**Step 5: Accounting Entry**
- Journal entry created to reverse sale:
  - Debit: Sales Revenue (to reverse income)
  - Credit: Cash/Bank (to refund payment)
  - Debit: Inventory (to restore asset)
  - Credit: COGS (to reverse expense)

**Step 6: Invoice Update**
- Original invoice marked as "Returned" (if full return)
- Credit memo created
- Customer account updated

### Return Number Format
- `RET-{timestamp}-{random}` (e.g., RET-1722478400000-1234)

---

## Integration with Other Modules

### Inventory Module
- **Sales Order**: Deducts stock when confirmed
- **Delivery**: No stock impact (already deducted by order)
- **Sales Invoice**: No stock impact (already deducted by order)
- **Return**: Restores stock when items returned

### Stock Movement Module
- **Sales Order**: Creates "order_reserved" movement
- **Delivery**: Creates "shipped" movement
- **Return**: Creates "stock_in" movement

### Chart of Accounts
- **Sales Invoice**: Creates journal entry when posted
  - Debit: Accounts Receivable (1200)
  - Credit: Sales Revenue (4000)
- **Payment**: Creates journal entry
  - Debit: Cash/Bank (1100/1110)
  - Credit: Accounts Receivable (1200)
- **Return**: Creates reversing journal entry

### Journal Entry Module
- **Sales Invoice**: Creates JE when posted
- **Payment**: Creates JE when payment received
- **Return**: Creates reversing JE

### Accounts Receivable Module
- **Sales Invoice**: Creates AR record when posted
- **Payment**: Updates AR record
- **Return**: Reduces AR balance

### Customer Module
- **Sales Order**: Updates customer stats
- **Sales Invoice**: Updates outstanding balance
- **Payment**: Reduces outstanding balance
- **Return**: Updates return history

---

## Complete Data Flow Example

### Scenario: B2B Customer Places Order

**1. Sales Order Created**
- Order: SO-20240801-1234
- Customer: ABC Corp
- Items: 100 units Product A @ $10 each
- Total: $1,000
- Status: Draft

**2. Order Confirmed**
- Status: Pending
- Stock: Product A reduced by 100 units
- Stock movement: "order_reserved" created

**3. Order Processing**
- Status: Processing → Packed → Shipped
- Picker, Packer, Shipper assigned
- Tracking number assigned

**4. Delivery**
- Delivery created
- Status: In Transit → Delivered
- Delivery date recorded

**5. Sales Invoice Generated**
- Invoice: SI-20240801-5678
- Linked to Order: SO-20240801-1234
- Payment Terms: Net 30
- Due Date: Aug 31, 2024
- Status: Posted
- Journal Entry: Debit AR $1,000, Credit Revenue $1,000
- Accounts Receivable: $1,000 outstanding
- Customer Balance: +$1,000

**6. Payment Received**
- Payment: $1,000 via Bank Transfer
- Journal Entry: Debit Bank $1,000, Credit AR $1,000
- Invoice Status: Paid
- Accounts Receivable: $0 outstanding
- Customer Balance: $0

---

## Reports and Analytics

### Order Reports
- Order Status Report
- Order Aging Report
- Sales by Customer
- Sales by Product
- Sales by Region
- Sales by Sales Person

 Invoice Reports
- Invoice Aging Report
- Overdue Invoices
- Payment Status Report
- Revenue by Customer
- Revenue by Product
- Monthly Revenue Report

### Delivery Reports
- Delivery Status Report
- On-Time Delivery Report
- Carrier Performance
- Delivery Exceptions

### Return Reports
- Return Rate Report
- Return Reason Analysis
- Return by Product
- Refund Summary

---

## Best Practices

### Order Management
- Always confirm orders before processing
- Keep order notes updated
- Communicate status changes to customers
- Monitor order aging

### Delivery Management
- Use tracking numbers for all shipments
- Record proof of delivery
- Monitor delivery performance
- Handle delivery exceptions quickly

### Invoice Management
- Send invoices promptly after delivery
- Follow up on overdue invoices
- Review payment terms regularly
- Monitor accounts receivable aging

### Payment Management
- Record payments accurately
- Reconcile payments daily
- Handle payment exceptions quickly
- Maintain payment records

### Return Management
- Have clear return policy
- Process returns quickly
- Analyze return reasons
- Improve product quality based on returns

---

## Common Issues and Solutions

### Issue: Order Stock Shortage
**Solution:**
- Place remaining items on backorder
- Notify customer of shortage
- Offer alternative products
- Cancel and refund if needed

### Issue: Delivery Delay
**Solution:**
- Notify customer immediately
- Provide new delivery date
- Offer compensation if significant delay
- Investigate carrier performance

### Issue: Invoice Dispute
**Solution:**
- Review invoice details with customer
- Provide supporting documentation
- Issue credit memo if error found
- Update invoice if needed

### Issue: Payment Overdue
**Solution:**
- Send payment reminder
- Call customer
- Apply late fees if per policy
- Escalate to collections if needed

### Issue: Return Request
**Solution:**
- Verify return eligibility
- Issue return authorization
- Process return quickly
- Refund promptly

---

## Summary

The complete sales management flow includes:

1. **Sales Order** - Customer order creation and confirmation
2. **Order Processing** - Picking, packing, shipping
3. **Delivery** - Physical shipment to customer
4. **Sales Invoice** - Billing and accounts receivable
5. **Payment Collection** - Receiving and recording payments
6. **Returns** - Handling returns and refunds

Each step integrates with inventory, accounting, and customer management modules to provide a complete ERP solution for sales management.
