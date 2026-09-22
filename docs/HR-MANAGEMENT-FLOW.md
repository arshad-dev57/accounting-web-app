# Bisonstechs ERP — HR Management Flow (AI Knowledge File)

**App:** Bisonstechs ERP (Web)  
**Module:** HR Management  
**Open from:** Main Dashboard → HR Management  
**Base URL:** `/hr/...`  
**Backend:** Remote HR API at `${API_URL}/api/hr/*` (proxied by Next.js). Shifts and holidays also have local JSON stores.

Yeh file **complete HR module** ka source of truth hai. Isko kisi AI ko paste karke bolo ke flow samjha de.

---

## CHATGPT / AI KO YE PROMPT KE SAATH DO

Neeche wala prompt copy karo, phir is poori file ke baad paste karo:

```
You are my Bisonstechs ERP HR Management teacher.

Use ONLY the document I pasted. Do not invent screens, buttons, fields, or statuses that are not in the document.

Explain in simple Roman Urdu + English mix, like you are teaching an HR admin who is not a developer.

When I ask about a flow:
1. Tell me which sidebar menu to open
2. Tell me the exact screen/route
3. Tell me what to search or filter
4. Tell me what to select from dropdowns/pickers
5. List the fields I must fill
6. Tell me which button to click
7. Tell me what happens after save (status, next screen, downstream effects)
8. Tell me common mistakes

If I ask "start to end HR setup", walk me through the happy path in numbered steps.

If I ask a screen name, explain only that screen.

Wait for my question after you confirm you understood this document.
```

---

## 0. Module ka simple picture

HR module = **employees hire karo → attendance track karo → leave approve karo → salary build karo**.

| Real life | System word | Screen |
|-----------|-------------|--------|
| Office / branch | Office | HR → Offices |
| Department (Sales, Accounts) | Department | HR → Departments |
| Job title (Manager, Executive) | Designation | HR → Departments |
| Employee record | Employee | HR → Employees |
| Mobile app login | App login (email + password) | Created on Add Employee |
| Daily in/out | Attendance | HR → Attendance (or mobile geofence) |
| Chutti | Leave | HR → Leave Management |
| Extra hours | Overtime | HR → Overtime |
| Monthly salary run | Salary build / Payroll | HR → Payroll |
| Sales commission salary | Sales payroll | HR → Sales payroll |
| Loan / advance | Loan | HR → Loans & Advances |
| Bonus | Bonus | HR → Bonuses |
| GPS location on map | Live Tracking | HR → Live Tracking |

**Golden rule:** pehle master setup (settings, offices, departments, shifts, holidays, leave policies), phir employee add karo, phir daily attendance/leave, last mein payroll.

**Employee creation = user creation.** Jab HR employee banata hai, uska email + password set hota hai. Employee mobile app (Employee Dashboard) se login karta hai.

**No recruitment module** exists in this app.

---

## 1. Kaise open karein

1. Login karo
2. Main Dashboard (`/dashboard`) par jao
3. **HR Management** card par click karo → `/hr/dashboard`

**Access rule:** Admin roles (`admin`, `owner`, `superadmin`, `company_admin`) ya users jin ke paas `hr` module access ho (`MainHubSidebar`).

**Note:** HR pages ke andar abhi fine-grained permission checks nahi hain — jo user `/hr/*` tak pohanch sakta hai, woh poora HR UI use kar sakta hai.

---

## 2. Sidebar map (left menu)

Login → Main Dashboard → **HR Management**

Left sidebar 4 sections:

### MAIN
| Menu | Route | Kaam |
|------|-------|------|
| Dashboard | `/hr/dashboard` | Stats, charts, quick actions |
| Employees | `/hr/employees` | Employee list, search, filter, deactivate |
| Add Employee | `/hr/add-employee` | New employee + app login |
| Offices | `/hr/offices` | Office locations + geofence |
| Departments | `/hr/organization` | Departments & designations (tabs) |
| My Team | `/hr/team` | Manager view of direct reports |

### TIME & ATTENDANCE
| Menu | Route | Kaam |
|------|-------|------|
| Attendance | `/hr/attendance` | Daily register, manual mark/edit |
| Shifts | `/hr/shifts` | Local shift definitions |
| Shift Plans | `/hr/shift-plans` | Backend shift plans (for roster) |
| Calendar View | `/hr/calendar` | Month view: holidays + approved leave |
| Leave Management | `/hr/leaves` | Approve/reject leave, manual entry |
| Leave Policies | `/hr/leave-policies` | Leave type quotas & rules |
| Holidays | `/hr/holidays` | Company holiday calendar |
| Overtime | `/hr/overtime` | OT requests approve/reject |
| Roster | `/hr/roster` | Assign shifts to employees by date |
| Live Tracking | `/hr/live-tracking` | GPS map of field employees |

### WORKFORCE
| Menu | Route | Kaam |
|------|-------|------|
| Payroll | `/hr/payroll` | Office salary build |
| Sales payroll | `/hr/payroll/sales` | Commission-based payroll |
| Loans & Advances | `/hr/loans` | Employee loans, monthly recovery |
| Bonuses | `/hr/bonuses` | Bonuses & sales commission |
| Lifecycle | `/hr/lifecycle` | Promotions, transfers, terminations |
| Documents | `/hr/documents` | HR document metadata (no file upload) |
| Approvals | `/hr/approvals` | Unified approval inbox |
| Task Management | `/hr/tasks` | Assign tasks to employees |
| Performance Reviews | `/hr/performance` | Performance ratings & goals |
| Organization Chart | `/hr/org-chart` | Visual org tree |

### INSIGHTS & SETTINGS
| Menu | Route | Kaam |
|------|-------|------|
| Reports & Analytics | `/hr/reports` | Attendance + payroll analytics |
| Notifications | `/hr/notifications` | HR alerts center |
| HR Settings | `/hr/settings` | Attendance rules, salary structure, commission |

---

## 3. Architecture (developer context)

```
Browser (HR pages in app/hr/)
    ↓ apiClient / fetch
Next.js API routes
    ├── /api/hr/[...path]  → proxy → Remote backend /api/hr/*
    ├── /api/hr/shifts     → local .hr-data/hr-shifts.json
    └── /api/hr/holidays   → local .hr-data/hr-holidays.json
```

**Key service files:**
- `lib/hr-employees-service.ts` — employees, dashboard, attendance upsert, live tracking
- `lib/hr-hcm-service.ts` — org, leave policies, roster, loans, bonuses, dossier, approvals
- `lib/hr-workforce-service.ts` — leaves, OT, tasks, performance, payroll, settings
- `lib/hr-offices-service.ts` — offices
- `lib/hr-shifts-service.ts` — local shifts
- `lib/hr-holidays-service.ts` — local holidays

**Important dual-system note:**
- **Shifts:** `/hr/shifts` (local JSON) vs `/hr/shift-plans` (backend). Employee form uses local shifts; roster uses backend shift plans.
- **Holidays:** `/hr/holidays` (local JSON) vs backend holiday-calendar API.

---

## 4. Start-to-end HR setup (happy path)

Yeh steps **pehli dafa** ya naye company ke liye:

### Step 4.1 — HR Settings
**Route:** `/hr/settings`

Configure:
- **Attendance toggles:** geofence auto check-in, auto checkout, late alerts, face/biometric, weekly email
- **Work rules:** hours per day, days per week, grace minutes, late threshold, minimum working hours, half-day hours
- **Salary structure:** basic %, house/transport/medical allowances, tax %, EOBI %, PF %
- **Deductions:** late deduction per day, absent deduction mode, half-day deduction %
- **Sales rules:** commission %, no-sale cut amount, roles for no-sale cut

**Save** → next Salary build in rules use karega.

### Step 4.2 — Offices
**Route:** `/hr/offices`

1. Click add office
2. Fill: name, address
3. Map par pin place karo, geofence radius set karo
4. Save

Employees is office se link hote hain. Geofence attendance is radius par depend karta hai.

### Step 4.3 — Departments & Designations
**Route:** `/hr/organization`

**Departments tab:**
- Add department: name, cost center

**Designations tab:**
- Add designation: name, level

Yeh dropdowns **Add Employee** form mein use hote hain.

### Step 4.4 — Shifts
**Route:** `/hr/shifts` (local) and optionally `/hr/shift-plans` (backend for roster)

**Shifts page:**
- Add shift: name, start time, end time, grace minutes
- Status: Active / Scheduled / Draft / Inactive

### Step 4.5 — Holidays
**Route:** `/hr/holidays`

- Add holiday: name, date, type (National / Religious / Company)
- Calendar View (`/hr/calendar`) mein dikhte hain

### Step 4.6 — Leave Policies
**Route:** `/hr/leave-policies`

- Define leave types: annual, sick, casual, etc.
- Set quotas, paid/carry/encash flags
- Employee leave balances is se affect hote hain

---

## 5. Employee lifecycle flows

### Flow A: Add Employee
**Route:** `/hr/add-employee`

**Prerequisites:** kam az kam 1 department, 1 designation, 1 office hona chahiye.

**Form sections:**

1. **App login** (required)
   - Password (min 6 chars)
   - Confirm password

2. **Personal**
   - First name *
   - Last name *
   - Email * (becomes mobile app login)
   - Phone

3. **Job details**
   - Department * (dropdown — link to `/hr/organization` if empty)
   - Designation * (dropdown)
   - Pay format: monthly / daily / hourly
   - Salary / rate *
   - Office * (dropdown)
   - Employee type: Office Employee / Field Employee / Salesman / Delivery Staff
   - Shift (dropdown from `/hr/shifts`)
   - Joining date
   - Status: Active / On Leave / Inactive

**Button:** Save

**After save:**
- Backend creates employee code (e.g. EMP-001)
- User account banta hai (email + password)
- Redirect to `/hr/employees`
- Toast: share email + password with employee for Employee Dashboard

### Flow B: Manage Employees (list)
**Route:** `/hr/employees`

- Search by name/code/email
- Filter: All / Active / On Leave / Inactive
- Actions per row:
  - **View** → employee dossier `/hr/employees/[id]`
  - **Edit** → `/hr/employees/[id]/edit`
  - **Deactivate** → soft delete (login disabled, history kept)

### Flow C: Employee Dossier (360° view)
**Route:** `/hr/employees/[id]`

**7 tabs:**
1. **Profile** — personal & job info, inline salary edit
2. **Attendance** — history
3. **Leave** — balances & requests
4. **Payroll** — payslip history
5. **Performance** — reviews
6. **Documents** — linked docs
7. **Lifecycle** — employment events

**Actions:** Edit profile, update salary/pay basis, deactivate employee

### Flow D: Edit Employee
**Route:** `/hr/employees/[id]/edit`

Extra fields beyond add form:
- Employment type
- Probation end, confirmation, contract end, termination dates
- Bank name, account, branch
- Emergency contact & phone
- Pay grade

Email is **read-only** (login identity).

---

## 6. Time & attendance flows

### Flow E: Automatic attendance (mobile / geofence)

1. Employee mobile app se GPS send karta hai → backend `/api/hr/tracking`
2. HR Settings mein geofence auto check-in ON ho
3. Employee office geofence mein ~2 min rehta hai → auto check-in
4. Late threshold (default 9:15 AM after grace) → status "Late"
5. Live map: `/hr/live-tracking`

**Live Tracking screen:**
- Polls GPS every few seconds
- Shows employee pins on map
- Filters: inside geofence, field, offline
- Office geofence circles visible

### Flow F: Manual attendance (HR)
**Route:** `/hr/attendance`

1. Select date (prev/next day arrows)
2. Table shows all active employees
3. Absent employees show if no record
4. Click row or "Mark / adjust"
5. Modal: employee, status, check-in time, check-out time
6. Save

**Statuses:** Present, Late, Absent, Half Day, On Leave, Weekly Off, Holiday

**Effect:** Attendance data payroll calculate mein cuts apply karta hai (late, absent, half-day per HR Settings).

### Flow G: Leave management
**Route:** `/hr/leaves`

**Employee side (mobile):** leave request submit → pending in HR inbox

**HR side:**
1. View pending / approved / rejected
2. **Approve** or **Reject** pending requests
3. **Manual entry:** employee, leave type, from date, to date, reason
4. Approved leave → Calendar View + attendance summary mein reflect

**Related:** `/hr/leave-policies` (types/quotas), `/hr/calendar` (month view)

### Flow H: Overtime
**Route:** `/hr/overtime`

1. View OT requests
2. Approve / reject
3. HR can add manually: employee, date, hours
4. Approved OT → payroll calculate mein add hota hai

### Flow I: Roster
**Route:** `/hr/roster`

1. Select date range
2. Assign: employee + shift plan + work date
3. Save to backend

**Note:** Geofence attendance roster clock times use nahi karta — settings-based rules use karta hai.

---

## 7. Payroll flows

### Flow J: Office Payroll (Salary build)
**Route:** `/hr/payroll`

**Pipeline:**

```
Select period (YYYY-MM) + pay date
    ↓
Calculate (mode: office)
    ↓
Review slips (edit individual if needed)
    ↓
Approve (bulk)
    ↓
Mark Paid (bulk)
    ↓
Export CSV / Print payslip
```

**Calculate kya include karta hai:**
- Employee salary + pay basis (monthly/hourly/daily)
- Attendance cuts (late, absent, half-day per settings)
- Approved overtime
- Bonuses
- Loan recoveries
- Statutory: income tax, EOBI, PF
- Probation / pro-rata flags

**Slip breakdown fields:**
- Earnings: basic, allowances, commission, overtime, bonus
- Deductions: attendance cut, loan, other cut, no-sale cut, tax, EOBI, PF

**Actions:**
- Add missing employee to payroll
- Edit individual slip
- Bulk approve → bulk mark paid
- Paid status updates loan balances

### Flow K: Sales Payroll
**Route:** `/hr/payroll/sales`

For sales-type employees (Salesman, sales designation, Field Employee per settings):

1. Select period
2. Enter sales amounts per employee
3. Commission % from HR Settings apply hota hai
4. No-sale cut for zero sales (if configured)
5. Separate calculate → approve → pay flow (`mode: 'sales'`)

---

## 8. Workforce management flows

### Flow L: Loans & Advances
**Route:** `/hr/loans`

1. Create loan: employee, kind, amount, installments
2. Approve loan
3. Monthly recovery automatically on payroll calculate

### Flow M: Bonuses
**Route:** `/hr/bonuses`

1. Create bonus: employee, kind, amount, period, reason
2. Sales commission can auto-calculate from sales amount
3. Approve → included in next payroll calculate

### Flow N: Lifecycle events
**Route:** `/hr/lifecycle`

Record events:
- Onboarding
- Transfer
- Promotion
- Salary revision
- Termination

Updates employee record over time.

### Flow O: Documents
**Route:** `/hr/documents`

Metadata only: title, category, employee, reference, expiry date.  
**No file upload** in current version.

### Flow P: Tasks
**Route:** `/hr/tasks`

- Assign task: title, employee, due date, priority
- Track status

### Flow Q: Performance Reviews
**Route:** `/hr/performance`

- Create review: employee, period, rating, goals, reviewer
- Track status

### Flow R: Approvals inbox
**Route:** `/hr/approvals`

Unified queue for:
- Leave
- Overtime
- Attendance corrections
- Loans
- Bonuses

Approve/reject from one place.

### Flow S: My Team (manager view)
**Route:** `/hr/team`

- Shows direct reports (if user is set as manager on employee profiles)
- Salary hidden from non-HR managers

### Flow T: Organization Chart
**Route:** `/hr/org-chart`

Visual tree of departments and reporting structure.

---

## 9. Insights & settings

### Flow U: Dashboard
**Route:** `/hr/dashboard`

Shows:
- Today's attendance stats (present, absent, on leave, late)
- Headcount, department breakdown
- Charts: attendance trend, department distribution
- Quick actions: Employees, Add Employee, Mark Attendance, Manage Leaves, Salary build, Live Tracking

### Flow V: Reports
**Route:** `/hr/reports`

- Attendance trends
- Payroll statutory summary

### Flow W: Notifications
**Route:** `/hr/notifications`

Alerts for: leave requests, late check-ins, payroll events, new employees, overtime

---

## 10. Employee types & pay basis

| Employee Type | Typical use | Payroll screen |
|---------------|-------------|----------------|
| Office Employee | Desk/office staff | `/hr/payroll` |
| Field Employee | Mobile / on-site | `/hr/payroll` or sales rules |
| Salesman | Commission-based | `/hr/payroll/sales` |
| Delivery Staff | Delivery operations | `/hr/payroll` |

| Pay Basis | Meaning |
|-----------|---------|
| monthly | Fixed monthly package |
| daily | Daily rate × working days |
| hourly | Hourly rate × hours worked |

---

## 11. Status reference

### Employee status
- `Active` — working
- `On Leave` — currently on approved leave
- `Inactive` — deactivated (login disabled)
- `Terminated` — employment ended

### Attendance status
- `Present`, `Late`, `Absent`, `Half Day`, `On Leave`, `Weekly Off`, `Holiday`

### Leave / OT / Loan / Bonus / Approval status
- Typically: `Pending` → `Approved` or `Rejected`
- Payroll slips: draft → approved → paid

---

## 12. API endpoints (backend reference)

Proxied via `/api/hr/[...path]`:

| Area | Endpoints |
|------|-----------|
| Employees | `GET/POST /api/hr/employees`, `GET/PUT/DELETE /api/hr/employees/:id`, `GET /api/hr/employees/:id/dossier` |
| Dashboard | `GET /api/hr/dashboard?date=` |
| Attendance | `GET /api/hr/attendance?date=`, `PUT /api/hr/attendance`, `GET /api/hr/attendance/summary?date=` |
| Tracking | `GET /api/hr/tracking` |
| Org | `GET/POST /api/hr/org/departments`, `GET/POST /api/hr/org/designations`, `GET /api/hr/org-chart` |
| Offices | `GET/POST /api/hr/offices`, `PUT /api/hr/offices/:id` |
| Leave | `GET/POST /api/hr/leaves`, `PUT /api/hr/leaves/:id`, `GET/POST /api/hr/leave-types`, `GET /api/hr/leave-balances` |
| Shifts/Roster | `GET/POST /api/hr/shift-plans`, `GET/POST /api/hr/roster` |
| Overtime | `GET/POST /api/hr/overtime`, `PUT /api/hr/overtime/:id` |
| Payroll | `GET /api/hr/payroll?period=`, `POST /api/hr/payroll/generate`, `PUT /api/hr/payroll/:id`, `POST /api/hr/payroll/bulk-status` |
| Workforce | loans, bonuses, tasks, performance, documents, lifecycle, approvals, goals, feedback |
| Settings | `GET/PUT /api/hr/settings`, `GET /api/hr/notifications` |

Local Next.js only:
- `GET/POST/PUT/DELETE /api/hr/shifts`
- `GET/POST/PUT/DELETE /api/hr/holidays`

---

## 13. End-to-end lifecycle diagram

```
[HR Setup]
  Settings → Offices → Departments/Designations → Shifts → Holidays → Leave Policies
       ↓
[Hire]
  Add Employee (creates user + employee record, share login)
       ↓
[Daily Operations]
  Mobile geofence check-in ──→ Attendance summary
  Employee submits leave ──→ HR approves in Leave Management
  OT requests ──→ HR approves in Overtime
  GPS pings ──→ Live Tracking map
       ↓
[Payroll Cycle]
  HR edits attendance (if needed)
  → Payroll Calculate (office and/or sales)
  → Review slips, bonuses/loans applied
  → Approve → Mark Paid
       ↓
[Employee Lifecycle]
  Lifecycle events, performance reviews, documents
  → Deactivate employee (keeps history)
```

---

## 14. Common mistakes

1. **Employee add karne se pehle departments/offices na banana** — form empty dropdowns dikhata hai
2. **Password share na karna** — employee mobile app login nahi kar sakta
3. **Shifts vs Shift Plans confuse karna** — employee form local shifts use karta hai; roster backend shift plans use karta hai
4. **Payroll calculate se pehle attendance fix na karna** — galat cuts apply honge
5. **HR Settings save na karna** — default rules apply honge jo company ke liye galat ho sakte hain
6. **Sales payroll aur office payroll mix karna** — alag screens, alag calculate modes
7. **Documents mein file upload expect karna** — sirf metadata hai
8. **Deactivate = delete sochna** — history rehti hai, login band hota hai

---

## 15. Key source files (for developers / AI navigation)

```
app/hr/
  layout.tsx              # Sidebar navigation
  ui.tsx                  # Shared HR UI components
  hcm-ui.tsx              # Generic CRUD page wrapper
  dashboard/page.tsx
  employees/page.tsx
  employees/[id]/page.tsx
  employees/[id]/edit/page.tsx
  add-employee/page.tsx
  offices/page.tsx
  organization/page.tsx
  attendance/page.tsx
  shifts/page.tsx
  shift-plans/page.tsx
  leaves/page.tsx
  leave-policies/page.tsx
  holidays/page.tsx
  overtime/page.tsx
  roster/page.tsx
  live-tracking/page.tsx
  payroll/page.tsx
  payroll/sales/page.tsx
  loans/page.tsx
  bonuses/page.tsx
  lifecycle/page.tsx
  documents/page.tsx
  approvals/page.tsx
  tasks/page.tsx
  performance/page.tsx
  org-chart/page.tsx
  reports/page.tsx
  notifications/page.tsx
  settings/page.tsx

lib/
  hr-employees-service.ts
  hr-hcm-service.ts
  hr-workforce-service.ts
  hr-offices-service.ts
  hr-shifts-service.ts
  hr-holidays-service.ts
  hr-backend-proxy.ts

app/api/hr/
  [...path]/route.ts      # Backend proxy
  shifts/                 # Local store
  holidays/               # Local store
```

---

## 16. What is NOT in this module

- Recruitment / job postings
- Multi-step onboarding wizard
- Document file upload
- Fine-grained per-page HR permissions inside the module
- Built-in email sending (weekly report toggle exists but depends on backend)

---

*Generated from codebase analysis of `accounting-web-app` HR module. Last updated: September 2026.*
