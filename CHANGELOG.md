# Bisonstechs ERP - Changelog

This document tracks all significant changes to the Bisonstechs ERP system.

## 2026-09-15

### Manufacturing — enterprise workspace, multi-line transactions, inventory posting
- **Production Order** is now a tabbed manufacturing workspace (overview, materials, operations, output, quality, scrap/by-products, costing, history) instead of a thin summary page. Close is available after Complete; Released orders can Start Production.
- **One document, many lines:** material issues, scrap, quality parameters, BOM components, routing operations, by-products and production output can be completed in a single transaction.
- **BOM / Routing:** full editors with scrap %, substitutes, operation sequence, estimated cost, reorderable operations, setup/run/queue time, labor and quality checkpoints. Historical production orders keep the BOM revision captured at create/release.
- **Inventory integration:** release reserves warehouse stock; material issue decreases on-hand (and reserved) stock via existing location stock helpers; completion receives finished goods; by-products receive stock. Uses current warehouse stock services — no duplicate accounting engine.
- **Smart defaults:** selecting a product on a new manufacturing order loads default BOM, routing and exploded required quantities (planned × BOM qty × scrap %).
- **Audit:** status history table; closed/cancelled orders are not freely editable.
- **Dashboard KPIs** drill through to filtered manufacturing lists.
- **Fixed**: created BOMs were missing from the list because create did not send `locationId` while the list filtered by the current warehouse. BOM list is company-wide; create now tags the current location.

## 2026-09-14

### HR Offices - location search + geofence radius
- **Added**: Office location search via OpenStreetMap Photon (no Google API key), Leaflet map with pin, and a geofence radius circle (slider / meter input).

### Manufacturing Module - Flow cleanup + backend
- **Added**: Backend Manufacturing API (`/api/manufacturing`) with CRUD, production-order lifecycle (release/pause/resume/complete/close/cancel), work-order shop-floor actions, dashboard, MRP, shortage, costing, reports and settings.
- **Added**: Prisma migration `20260914120000_add_manufacturing_module` for manufacturing tables.
- **Simplified**: Sidebar now follows a real production flow — Planning → Production Orders → Work Orders → Master Data → Materials → Quality → Maintenance → Subcontracting → Costing/Reports.
- **Removed from nav** (old URLs redirect, no 404): BOM Versions, Operations, Shop Floor, Production Tracking, Material Consumption, WIP, Inspection Plans, Defects, Quality Reports, Preventive/Breakdown/Spare Parts, Subcontract materials sent/received, and the four separate costing pages.
- **Merged**: Costing is one tabbed page; shop-floor start/report/complete lives on Work Orders.
- **Fixed**: `/manufacturing` now opens the dashboard; create forms aligned to schema fields (no unused `name` on BOM/routing, etc.).

### Manufacturing Module - Frontend
- **Added**: Complete Manufacturing module frontend following the HR module pattern (grouped sidebar, direct pages, shared `ui` primitives).
- **Added**: Manufacturing entry to the main hub sidebar + breadcrumb module/page labels.
- **Added**: Manufacturing dashboard with 20 KPI cards and charts (production, materials, quality, machines) consuming `/api/manufacturing/dashboard`.
- **Added**: Production Orders (list with status filters, create form, detail with materials/operations/production/cost + release/pause/resume/complete/close/cancel actions).
- **Added**: Master data pages (BOM + multi-level detail, BOM Versions, Routings, Operations, Work Centers, Machines).
- **Added**: Work Orders, Shop Floor (start/pause/resume/complete/report), Production Tracking.
- **Added**: Materials pages (Reservations, Issues, Consumption w/ variance, WIP, Scrap, By-products).
- **Added**: Quality pages (Inspection Plans, Inspections, Defects, Rework, Quality Reports).
- **Added**: Maintenance pages (Requests, Preventive, Breakdown, Orders, Spare Parts).
- **Added**: Subcontracting pages (Vendors, Orders, Materials Sent/Received).
- **Added**: Planning pages (Demand Planning, MPS, MRP, Material Shortage).
- **Added**: Costing pages (Product Cost, Standard Cost, Actual Cost, Cost Variance).
- **Added**: Reports page (Production/Material/Quality/Machine/Efficiency/Cost tabs) and Settings.
- **Added**: `lib/manufacturing-service.ts` — service layer wired to `/api/manufacturing/*` (proxied to backend via `next.config` rewrite).
- **Integration**: Uses existing `apiClient`, `useLocation` (multi-branch), `usePermissions` (RBAC), Location/FiscalYear providers, and reused `productService`.


- **Added**: AI_CONTEXT.md - Comprehensive project documentation for AI agents
- **Added**: PROJECT_STATUS.md - Current implementation status tracking
- **Added**: CHANGELOG.md - Project change history documentation
- **Added**: DEVELOPMENT_RULES.md - Development rules and guidelines for AI agents
- **Added**: AI_TASKS.md - Persistent task list for AI agents
- **Purpose**: Enable continuity across AI sessions and provide context for future development
- **Added**: Complete HR module database schema (migration: 20260909120000_add_hr_module)
- **Added**: HR workforce features (migration: 20260910120000_add_hr_workforce)
- **Added**: Payroll breakdown functionality (migration: 20260910140000_payroll_breakdown)
- **Added**: HR HCM layer features (migration: 20260910180000_add_hr_hcm_layer)
- **Models**: HrOffice, HrEmployee, HrAttendance, HrLeave, HrOvertime, HrTask, HrPerformanceReview, HrPayrollItem, HrDepartment, HrDesignation, HrShift, HrHoliday, HrLeaveType, HrLeaveBalance, HrRoster, HrLoan, HrBonus, HrDocument, HrLifecycleEvent, HrApproval, HrAuditLog, HrGoal, HrFeedback, HrShiftSwap
- **Features**: Employee management, attendance tracking, leave management, overtime, payroll, loans, bonuses, performance reviews, documents, approvals, tasks, office management with geofencing
- **Integration**: Linked to User, Company, Location models
- **Added**: Complete HR module UI with sidebar navigation
- **Added**: HR dashboard with employee statistics
- **Added**: Employee management pages (list, add, edit, details)
- **Added**: Office management with geofence configuration
- **Added**: Attendance tracking with check-in/check-out
- **Added**: Leave management with policies and approvals
- **Added**: Overtime management
- **Added**: Payroll processing with sales commission
- **Added**: Loans and advances management
- **Added**: Bonuses management
- **Added**: Performance reviews
- **Added**: Document management
- **Added**: Approvals workflow
- **Added**: Task management
- **Added**: Organization chart
- **Added**: Shift management and planning
- **Added**: Roster management
- **Added**: Live tracking with geofencing
- **Added**: Calendar views
- **Added**: HR settings and configuration
- **Added**: HR reports and analytics
- **Services**: hr-employees-service.ts, hr-workforce-service.ts, hr-hcm-service.ts, hr-offices-service.ts, hr-shifts-service.ts, hr-holidays-service.ts
- **Components**: HR-specific components for offices, employee editing, payroll sales
- **Added**: Complete manufacturing module database schema (no implementation yet)
- **Models**: ManufacturingBOM, ManufacturingBOMComponent, ManufacturingRouting, ManufacturingRoutingOperation, ManufacturingWorkCenter, ManufacturingMachine, ManufacturingProductionOrder, ManufacturingWorkOrder, ManufacturingMaterialReservation, ManufacturingMaterialIssue, ManufacturingMaterialConsumption, ManufacturingWIP, ManufacturingScrap, ManufacturingByProduct, ManufacturingRework, ManufacturingQualityInspection, ManufacturingQualityParameter, ManufacturingMaintenanceRequest, ManufacturingMaintenanceOrder, ManufacturingSubcontractVendor, ManufacturingSubcontractOrder, ManufacturingSubcontractMaterialSent, ManufacturingSubcontractMaterialReceived, ManufacturingMRP, ManufacturingMRPItem, ManufacturingMPS, ManufacturingDemand, ManufacturingProductCost, ManufacturingCostVariance, ManufacturingSetting
- **Integration**: Properly linked to existing Product, Location, HrEmployee, Company models
- **Status**: Schema defined only, no backend or frontend implementation
- **Added**: Enterprise-level purchases flow improvements (migration: 20260908120000_enterprise_purchases_flow)
- **Enhanced**: Purchase order management
- **Enhanced**: Goods receiving process
- **Enhanced**: Purchase invoice processing
- **Status**: Backend implementation complete
- **Added**: Location ID to accounting tables (migration: 20260901190000_add_accounting_location_id)
- **Purpose**: Enable location-based accounting operations
- **Affected**: Journal entries, transactions, and other accounting entities

### Customer Email Per Company
- **Added**: Company-specific customer emails (migration: 20260901180000_customer_email_per_company)
- **Purpose**: Enable email management per company

### Restaurant POS Enhancements
- **Added**: Concurrent kitchen display system (migration: 20260901130000_restaurant_concurrent_kds)
- **Enhanced**: Restaurant POS mode for multiple kitchen stations

## 2026-08-31

### Company Subscription Licensing
- **Added**: Subscription licensing system (migration: 20260831140000_company_subscription_licensing)
- **Features**: User limits, branch limits, plan enforcement
- **Models**: Company subscription fields, licensing logic
- **Integration**: Authentication middleware subscription checks

### Restaurant POS Mode
- **Added**: Restaurant POS mode (migration: 20260831160000_restaurant_pos_mode)
- **Features**: Kitchen display, table management, order routing
- **Models**: RestaurantOrder, KitchenStation

### POS Mode Configuration
- **Added**: POS mode configuration (migration: 20260831190000_pos_mode_configured)
- **Purpose**: Track whether POS mode is configured
- **Models**: Company posModeConfigured field

### User Assigned Terminal
- **Added**: User-terminal assignment (migration: 20260831120000_add_user_assigned_terminal)
- **Purpose**: Assign users to specific POS terminals
- **Models**: User assignedTerminalId field, POSTerminal relations

## 2026-08-27

### POS Master Data Sync - Bidirectional
- **Added**: Bidirectional sync fields (migration: 20260827233000_add_bidirectional_sync_fields)
- **Features**: syncId, syncStatus, lastSyncedAt for Categories and Products
- **Purpose**: Enable offline POS to sync changes back to cloud
- **Documentation**: Complete sync documentation in pos/sync/README.md

## 2026-08-26

### POS Master Data Sync Changes
- **Enhanced**: POS master data sync system (migration: 20260826120000_pos_master_sync_changes)
- **Features**: Improved sync reliability and performance

### POS Custom Sale Items
- **Added**: Custom sale items support (migration: 20260826010000_pos_custom_sale_items)
- **Purpose**: Enable flexible product configuration in POS

## 2026-08-25

### Product QR Code
- **Added**: QR code support for products (migration: 20260825120000_add_product_qr_code)
- **Purpose**: Enable QR code generation and scanning for products

## 2026-08-23

### User Locations
- **Added**: User-location assignment system (migration: 20260823000000_add_user_locations)
- **Models**: UserLocation table
- **Purpose**: Enable users to be assigned to specific locations
- **Integration**: Location-based access control

## 2026-08-11

### Support Tickets and Fixed Asset Fields
- **Added**: Support ticket system (migration: 20260811070000_support_tickets_and_fixed_asset_fields)
- **Models**: SupportTicket
- **Enhanced**: Fixed asset fields
- **Purpose**: Enable customer support and enhanced asset management

## 2026-08-09

### Global Bill Number Unique Constraint
- **Modified**: Removed global unique constraint on bill numbers (migration: 20260809081500_drop_global_bill_number_unique_again)
- **Purpose**: Allow bill numbers to be unique per company instead of globally

## 2026-07-07

### Sales Invoice with Accounting
- **Added**: Sales invoice accounting integration (migration: 20260707200335_add_sales_invoice_with_accounting)
- **Purpose**: Generate accounting entries from sales invoices
- **Integration**: Journal entry generation

### Sales Payment Received
- **Added**: Sales payment received tracking (migration: 20260707232120_add_sales_payment_received)
- **Models**: SalesPaymentReceived
- **Purpose**: Track customer payments

### Purchase Order Module
- **Added**: Purchase order management (migration: 20260707232120_add_purchase_order_module)
- **Models**: PurchaseOrder
- **Purpose**: Enable purchase order workflow

## 2026-07-06

### Quotation Module
- **Added**: Quotation management (migration: 20260707173316_add_quotation_module)
- **Models**: Quotation
- **Purpose**: Enable quote-to-order workflow

### Delivery Module
- **Added**: Delivery management (migration: 20260707172220_add_delivery_module)
- **Models**: Delivery
- **Purpose**: Enable delivery tracking and management

## 2026-07-01

### Sales Purchase Return Refund Support
- **Added**: Return and refund support (migration: 20260707010140_add_sales_purchase_return_refund_support)
- **Models**: Return, Refund
- **Purpose**: Enable returns and refunds for sales and purchases
- **Added**: User ID tracking to all tables (migration: 20260706195141_add_user_id_to_all_tables)
- **Purpose**: Enable audit trail and user tracking
- **Affected**: All major transactional tables
- **Added**: Business details to user model (migration: 20260706172936_add_business_details)
- **Purpose**: Store additional business information
- **Models**: User businessDetails field (JSON)
- **Added**: Account relation to expenses (migration: 20260702230923_add_expense_account_relation)
- **Purpose**: Link expenses to chart of accounts

### Income Account Relation
- **Added**: Account relation to income (migration: 20260702233332_add_income_account_relation)
- **Purpose**: Link income to chart of accounts

## 2026-07-02

### Bill Relation
- **Added**: Bill relation (migration: 20260703203622_add_bill_relation)
- **Purpose**: Link bills to accounting system

### Cleared Date to Payments
- **Added**: Cleared date to payments (migration: 20260703214445_add_cleared_date_to_payments)
- **Purpose**: Track payment clearance dates

## 2026-07-01

### Fixed Assets
- **Added**: Fixed asset management (migration: 20260701213509_add_fixed_assets)
- **Models**: FixedAsset
- **Purpose**: Enable fixed asset tracking and depreciation

### Loans
- **Added**: Loan management (migration: 20260701220310_add_loans)
- **Models**: Loan
- **Purpose**: Enable loan tracking and management

## 2026-07-01

### Credit Notes Table
- **Added**: Credit notes functionality (migration: 20260701203057_add_credit_notes_table)
- **Models**: CreditNote
- **Purpose**: Enable credit note management for sales and purchases

### Outstanding to Warehouse Invoices
- **Added**: Outstanding amount to warehouse invoices (migration: 20260701210930_add_outstanding_to_warehouse_invoices)
- **Purpose**: Track outstanding balances on warehouse invoices

### Remove Invoice Use Warehouse Invoice
- **Modified**: Removed duplicate invoice usage (migration: 20260701211913_remove_invoice_use_warehouse_invoice)
- **Purpose**: Clean up invoice model structure

## Historical Changes (Pre-July 2026)

### Core System
- **Initial Implementation**: Basic accounting, warehouse, sales, purchases modules
- **POS System**: Initial POS implementation with offline support
- **User Management**: Basic user authentication and authorization
- **Multi-tenancy**: Company-based data isolation
- **Location System**: Multi-location/branch support

### Accounting
- **Chart of Accounts**: Basic account structure
- **Journal Entries**: Double-entry bookkeeping
- **Basic Reports**: Trial balance, basic financial statements

### Warehouse
- **Product Management**: Basic product CRUD
- **Stock Movement**: Basic stock tracking
- **Supplier/Customer**: Basic contact management

### Sales/Purchases
- **Basic Orders**: Simple order processing
- **Basic Invoices**: Simple invoice generation

## Migration History Summary

Total migrations: 58+ database migrations covering:
- Core system architecture
- Accounting module enhancements
- Warehouse/inventory features
- Sales and purchases improvements
- POS system development
- HR module implementation
- Manufacturing schema definition
- System optimizations and fixes

## Note on Manufacturing Module

The manufacturing module database schema was added in the most recent changes but has no implementation yet. This includes:
- Complete database schema with 30+ models
- Proper integration with existing modules
- No backend API implementation
- No frontend UI implementation
- No business logic implementation

This represents the foundation for future manufacturing module development.