# Bisonstechs ERP - AI Context Documentation

## Project Overview

**Project Name**: Bisonstechs ERP  
**Project Purpose**: Enterprise-level business management system for small to medium businesses  
**Version**: Enterprise multi-module ERP with POS integration

## Technology Stack

### Frontend
- **React Version**: 19.2.4
- **UI System**: Tailwind CSS v4, Lucide React icons
- **State Management**: Context API (FiscalYearProvider, LocationProvider, CurrencyProvider)
- **Build Tool**: Next.js built-in bundler
- **Deployment**: Vercel (production), local development

### Backend
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL with Prisma ORM 5.22.0
- **Authentication**: JWT-based with bcryptjs 3.0.3
- **File Upload**: Multer with Cloudinary
- **Email**: Nodemailer with Resend API integration
- **Payment**: Stripe integration
- **Deployment**: Railway (production), local development

### Database
- **Provider**: PostgreSQL (Neon database hosting)
- **ORM**: Prisma 5.22.0
- **Connection**: Pooled and Direct URLs for different use cases
- **Migration System**: Prisma migrations with proper versioning

## Architecture

### Frontend Architecture
- **Module Pattern**: Each module has dedicated `/app/{module}/layout.tsx` with sidebar navigation
- **Component Structure**: Reusable components in `/components/` and module-specific in `/app/{module}/components/`
- **Service Layer**: API communication through services in `/lib/`
- **Permission System**: Custom `usePermissions` hook for RBAC
- **View Preservation**: ModuleViewHost system for maintaining component state across navigation
- **Authentication**: JWT tokens stored in localStorage with cookie-based session management

### Backend Architecture
- **API Structure**: RESTful routes organized by module (`/routes/`, `/warehouse/routes/`, `/pos/routes/`)
- **Controller Pattern**: Separate controllers for each module (`/controllers/`)
- **Middleware Stack**: Authentication, authorization, fiscal year guards, rate limiting, validation
- **Database Access**: Prisma client with proper transaction handling
- **Multi-tenancy**: Company-based isolation with `companyId` on all models
- **Location-based Access**: User-location scoping for multi-branch operations

### Database Architecture
- **Multi-tenant**: Company model with cascading relations to all entities
- **Multi-location**: Location model for branches/warehouses/factories
- **Audit Trail**: CreatedBy, UpdatedBy, createdAt, updatedAt on all major entities
- **Soft Deletes**: Where appropriate (categories, products with isDeleted flag)
- **Indexing**: Strategic indexes on companyId, locationId, status, dates for performance

## Important Environment Configuration

### Database Configuration
- **DATABASE_URL**: PostgreSQL connection string (pooled for simple queries)
- **DIRECT_URL**: PostgreSQL direct connection (required for migrations and transactions)
- **Connection Strategy**: Use pooled for reads, direct for writes and migrations

### Email Configuration
- **Provider**: Resend API (preferred) or SMTP (local dev)
- **Supported**: Team invitations, password resets, notifications

### Authentication
- **JWT_SECRET**: Secret key for token signing
- **JWT_EXPIRY**: Token expiration time
- **Platform Owners**: Configured via PLATFORM_OWNER_EMAILS environment variable

### Subscription
- **Subscription Plans**: trial, monthly, yearly
- **Product Tiers**: pos, erp_pos
- **Licensing**: User and branch limits enforced

## Main Modules

### Completed Modules
1. **Accounting**: Chart of accounts, journal entries, general ledger, trial balance, balance sheet, profit & loss, cash flow, accounts receivable/payable, payments, bills, expenses, income, fixed assets, loans, equity, fiscal years
2. **Warehouse/Inventory**: Products, categories, suppliers, customers, stock movements, locations, inventory valuation, reports
3. **Sales**: Sales orders, sales invoices, quotations, deliveries, refunds, customer management
4. **Purchases**: Purchase orders, purchase requisitions, goods receiving, purchase invoices, purchase returns, supplier management
5. **POS**: Point of sale with offline sync, restaurant mode, terminal management, shift management, kitchen display system
6. **HR**: Employee management, attendance tracking, leave management, overtime, payroll, loans, bonuses, performance reviews, documents, approvals, tasks, office management with geofencing
7. **Tax**: Tax compliance, jurisdictions, types, rates, rules, exemptions, transactions
8. **Fixed Assets**: Asset management with depreciation

### Manufacturing Module (Core flow implemented)
**Status**: Schema, backend API and slim UI are in place. Inventory/accounting postings still pending.
- **Models**: 30+ manufacturing models including BOM, routing, work centers, machines, production orders, work orders, material reservations, quality control, maintenance, subcontracting, MRP, MPS, demand planning, costing
- **API**: `/api/manufacturing` on the Express backend (proxied from the Next.js app)
- **UI flow**: Demand/MPS/MRP → Production Orders → Work Orders → materials/quality/maintenance as needed

## Module Relationships

### Accounting Integration
- **Sales → Accounting**: Sales invoices generate journal entries, revenue recognition
- **Purchases → Accounting**: Purchase invoices generate journal entries, expense recognition
- **POS → Accounting**: POS sales generate journal entries
- **Warehouse → Accounting**: Stock movements can generate accounting entries
- **HR → Accounting**: Payroll generates journal entries for salary expenses
- **Manufacturing → Accounting**: (Not implemented) Should generate cost accounting entries

### Inventory Integration
- **Purchases → Inventory**: Goods receiving updates stock levels
- **Sales → Inventory**: Sales orders reduce stock
- **Manufacturing → Inventory**: (Not implemented) Material issues, consumption, finished goods receipts
- **Location Management**: Multi-warehouse/branch stock tracking

### HR Integration
- **Manufacturing → HR**: (Not implemented) Employee assignment to work centers, labor cost tracking
- **Users ↔ HR Employees**: User accounts linked to HR employee records

### Multi-Location Architecture
- **Company → Locations**: One company can have multiple locations (branches, warehouses, factories)
- **User → Locations**: Users can be assigned to specific locations
- **Module Data → Locations**: Most transactional data is location-scoped

## Important Business Rules

### Accounting Rules
- **Double-Entry Bookkeeping**: All financial transactions maintain balanced debits and credits
- **Fiscal Year Control**: Cannot post to closed fiscal years (enforced by fiscalYearGuard middleware)
- **Chart of Accounts**: Hierarchical structure with account types and sub-accounts
- **Currency Management**: Multi-currency support with base currency configuration
- **Tax Calculation**: Complex tax rules with jurisdictions, rates, exemptions

### Inventory Rules
- **Stock Valuation**: FIFO/LIFO support (implementation varies)
- **Location Scoping**: Stock tracked per location with transfers between locations
- **Product Categories**: Hierarchical category structure
- **Supplier Management**: Vendor-specific pricing and terms
- **Stock Movements**: Full audit trail of all stock changes

### HR/Payroll Rules
- **Geofencing**: Employee check-in/out validated against office geofences
- **Attendance Tracking**: Multiple check-in/out cycles per day, late detection
- **Leave Management**: Leave type policies, balance tracking, approval workflow
- **Payroll Calculation**: Based on attendance, overtime, bonuses, deductions
- **Employee Lifecycle**: Onboarding, promotions, transfers, offboarding

### POS Rules
- **Offline Operation**: POS can work offline with local SQLite database
- **Bidirectional Sync**: Master data sync between cloud and local POS
- **Terminal Management**: Multiple POS terminals per location
- **Shift Management**: Cashier shifts with opening/closing balances
- **Restaurant Mode**: Kitchen display system, order routing, table management

### Manufacturing Rules (Schema Defined, Not Implemented)
- **BOM Versioning**: Historical BOM versions for production orders
- **Material Reservation**: Automatic material reservation based on BOM
- **Work Order Generation**: Production orders generate work orders based on routing
- **Quality Control**: Incoming, in-process, and final inspections
- **Cost Calculation**: Material + labor + machine + overhead costs

## Multi-Company/Tenancy Architecture

### Company Isolation
- **All Data Scoped**: Every major entity has companyId field
- **User Assignment**: Users belong to specific companies
- **Subscription Control**: Subscription status enforced at company level
- **Data Separation**: Strict isolation between companies in queries

### Location/Branch Architecture
- **Multi-Location**: Companies can have multiple locations (branches, warehouses, factories)
- **User Location Access**: Users can be restricted to specific locations
- **Location-Scoped Data**: Most operational data is location-specific
- **Stock Per Location**: Inventory tracked separately per location

## Important API Structure

### Authentication
- **JWT Token**: Bearer token authentication
- **Login Flow**: Email/password → OTP verification → JWT token
- **Token Refresh**: Not implemented (tokens have fixed expiry)
- **Demo Login**: Special flow for app store reviewers with fixed OTP

### API Patterns
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Response Format**: { success: boolean, data?: any, message?: string }
- **Error Handling**: Consistent error responses with status codes
- **Pagination**: Offset/limit or cursor-based depending on endpoint
- **Filtering**: Query parameters for filtering, sorting, searching

### Module-Specific Routes
- **Accounting**: `/api/chart-of-accounts`, `/api/journal-entries`, etc.
- **Warehouse**: `/api/products`, `/api/categories`, `/api/stock-movement`
- **Sales**: `/api/sales/invoices`, `/api/quotations`, `/api/deliveries`
- **Purchases**: `/api/purchase/orders`, `/api/goods-receiving`, `/api/purchase/invoices`
- **POS**: `/api/pos/*`, `/api/sync/master-data`
- **HR**: `/api/hr/*`
- **Manufacturing**: (Not implemented) Should be `/api/manufacturing/*`

## Important Database Relationships

### Core Relationships
- **Company → User**: One-to-many (users belong to companies)
- **Company → Location**: One-to-many (locations belong to companies)
- **User → HrEmployee**: One-to-one (users linked to employee records)
- **Location → ProductStock**: One-to-many (stock tracked per location)
- **Product → ProductStock**: One-to-many (product has stock in multiple locations)

### Transactional Relationships
- **SalesInvoice → JournalEntry**: Sales generate accounting entries
- **PurchaseInvoice → JournalEntry**: Purchases generate accounting entries
- **StockMovement → JournalEntry**: Stock movements can generate accounting entries
- **ProductionOrder → MaterialReservation**: (Not implemented) BOM-based reservations

### Manufacturing Relationships (Schema Only)
- **ManufacturingBOM → Product**: BOM defines product composition
- **ManufacturingRouting → Product**: Routing defines production process
- **ManufacturingProductionOrder → ManufacturingBOM**: Orders use specific BOM versions
- **ManufacturingWorkOrder → ManufacturingProductionOrder**: Work orders belong to production orders
- **ManufacturingMachine → ManufacturingWorkCenter**: Machines assigned to work centers

## Important Architectural Decisions

### Technology Choices
- **Next.js App Router**: Chosen for latest React features and server components
- **Prisma ORM**: Type-safe database access with excellent migration system
- **PostgreSQL**: Robust relational database with advanced features
- **Express.js**: Simple, flexible backend framework
- **JWT Authentication**: Stateless authentication for scalability

### Design Patterns
### Performance Decisions
- **Database Indexing**: Strategic indexes on foreign keys and filter fields
- **Connection Pooling**: Separate pooled and direct database connections
- **Caching**: Auth cache with TTL, other caching where appropriate
- **Lazy Loading**: Database queries use selective includes

### Security Decisions
- **JWT Authentication**: Stateless tokens with secure secret
- **Role-Based Access Control**: Granular permissions per user
- **Location Scoping**: Users restricted to assigned locations
- **Fiscal Year Guards**: Prevent modifications to closed periods
- **Input Validation**: Comprehensive validation middleware

## Things AI Agents Must NEVER Change Without Approval

### Critical Business Logic
- **Accounting Formulas**: Double-entry bookkeeping logic, balance calculations
- **Tax Calculations**: Tax rules, rates, jurisdiction logic
- **Payroll Calculations**: Salary, overtime, bonus, deduction formulas
- **Inventory Valuation**: Stock valuation methods
- **Subscription Logic**: Licensing, plan limits, access control

### Database Schema
- **Existing Tables**: Do not modify table structures without explicit approval
- **Foreign Keys**: Do not break existing relationships
- **Indexes**: Do not remove performance-critical indexes
- **Data Migration**: Do not run destructive migrations without approval

### Authentication/Authorization
- **JWT Logic**: Do not modify token generation/validation without approval
- **Permission System**: Do not change permission structure without approval
- **Role Definitions**: Do not modify role hierarchies without approval
- **Platform Owner Logic**: Do not change platform owner access

### Integration Points
- **Accounting Integration**: Do not modify journal entry generation logic
- **Inventory Integration**: Do not change stock movement logic
- **HR Integration**: Do not break employee-user relationships
- **POS Sync Logic**: Do not modify offline sync mechanism

### Multi-Tenancy
- **Company Isolation**: Do not break company-based data separation
- **Location Scoping**: Do not bypass location-based access control
- **Subscription Enforcement**: Do not disable subscription checks

### API Contracts
- **Existing Endpoints**: Do not modify API signatures without approval
- **Response Formats**: Do not change response structures
- **Error Codes**: Do not modify error handling logic

## Current Git Branches

### Backend
- **Current Branch**: `hr-management` (HR module development)
- **Main Branch**: `main` (stable production code)
- **Other Branches**: `after-applying-taxation-and-fiscal-year`, `before-taxing-flow`

### Frontend
- **Current Branch**: `main` (HR UI changes in progress)
- **Other Branches**: `after-applying-taxation-and-fiscal-year`, `before-taxing-flow`, `backup-before-lfs`

## Deployment Information

### Backend
- **Platform**: Railway
- **Database**: Neon PostgreSQL
- **Environment Variables**: Managed via Railway dashboard
- **Migration Strategy**: Prisma migrate deploy on deployment

### Frontend
- **Platform**: Vercel
- **Build Process**: Next.js build
- **Environment Variables**: Managed via Vercel dashboard
- **API URL**: Production API_URL configured

## Known Limitations

### Current Limitations
- **Manufacturing Module**: Schema defined but no implementation
- **Advanced Forecasting**: No automated demand forecasting
- **Batch/Lot Tracking**: Limited batch/lot traceability
- **Serial Number Tracking**: Not fully implemented
- **Barcode Generation**: Basic QR code support, limited barcode support
- **Multi-Currency**: Base currency support, limited multi-currency accounting
- **Advanced Reporting**: Basic reports, limited advanced analytics

### Performance Considerations
- **Large Datasets**: Pagination required for large data sets
- **Complex Queries**: Some reporting queries may be slow with large data
- **Real-time Updates**: No WebSocket implementation for real-time updates

## Development Workflow

### Code Organization
- **Backend**: Express.js with route/controller/service pattern
- **Frontend**: Next.js App Router with component/service pattern
- **Database**: Prisma schema with migration versioning
- **Testing**: Limited automated testing, manual testing required

### Development Rules
- **Follow Existing Patterns**: Use existing code as reference for new features
- **Maintain Consistency**: Follow naming conventions and code style
- **Test Before Commit**: Manual testing of changes before committing
- **Document Changes**: Update relevant documentation for significant changes

## Important Notes for AI Agents

1. **Always Read Existing Code**: Before making changes, thoroughly inspect existing implementations
2. **Follow Multi-Tenancy**: Ensure all new data respects company and location scoping
3. **Use Existing Services**: Reuse existing services and components where possible
4. **Maintain Data Integrity**: Ensure foreign key relationships and data consistency
5. **Test Integration**: Verify that new features integrate properly with existing modules
6. **Check Performance**: Ensure database queries are optimized with proper indexes
7. **Handle Errors**: Implement proper error handling and user feedback
8. **Security First**: Never expose sensitive data, always validate inputs
9. **Git Workflow**: Commit frequently with descriptive messages, use proper branching
10. **Documentation**: Update documentation for architectural or business logic changes