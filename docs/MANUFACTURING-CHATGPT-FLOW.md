# Bisonstechs ERP — Manufacturing Flow (ChatGPT Knowledge File)

**App:** Bisonstechs ERP  
**Module:** Manufacturing  
**Open from:** Main Dashboard → Manufacturing  
**Base URL:** `/manufacturing/...`

Yeh file **complete manufacturing module** ka source of truth hai. Isko ChatGPT / kisi AI ko paste karke bolo ke flow samjha de.

---

## CHATGPT KO YE PROMPT KE SAATH DO

Neeche wala prompt copy karo, phir is poori file ke baad paste karo:

```
You are my Bisonstechs ERP Manufacturing teacher.

Use ONLY the document I pasted. Do not invent screens, buttons, fields, or statuses that are not in the document.

Explain in simple Roman Urdu + English mix, like you are teaching a factory user who is not a developer.

When I ask about a flow:
1. Tell me which sidebar menu to open
2. Tell me the exact screen/route
3. Tell me what to search
4. Tell me what to select from pickers (do not type IDs)
5. List the fields I must fill
6. Tell me which button to click
7. Tell me what happens after save (stock, status, next screen)
8. Tell me common mistakes

If I ask "start to end production", walk me through the happy path in numbered steps.

If I ask a screen name, explain only that screen.

Wait for my question after you confirm you understood this document.
```

---

## 0. Module ka simple picture

Factory mein finished product banana = **recipe + steps + materials + people/machines**.

| Real life | System word | Screen |
|-----------|-------------|--------|
| Finished item (chair, cream, shirt) | Product | Warehouse → Products (Manufacturing ke bahar) |
| Warehouse / godown | Location / Warehouse | Warehouse → Locations. Manufacturing pickers isi list se select karte hain |
| Recipe (kitna steel, kitna paint) | BOM (Bill of Materials) | Manufacturing → Master Data → BOM |
| Kaam ke steps (cut → weld → paint) | Routing | Manufacturing → Master Data → Routings |
| Department / line | Work Center | Manufacturing → Master Data → Work Centers |
| Machine on that line | Machine | Manufacturing → Master Data → Machines |
| “100 pieces banao by Friday” | Production Order / Manufacturing Order / MO | Manufacturing → Production → Production Orders |
| Har step ka shop-floor ticket | Work Order / WO | Manufacturing → Production → Work Orders |
| Raw material hold | Reservation | Manufacturing → Materials → Reservations |
| Raw material factory ko dena | Material Issue | Manufacturing → Materials → Issues **ya** MO workspace → Materials tab |
| Kharab / wastage | Scrap | Materials → Scrap **ya** MO workspace → Scrap tab |
| Extra item jo saath nikalta hai | By-product | Materials → By-products **ya** MO workspace |
| Quality check | Inspection | Quality → Inspections **ya** MO workspace → Quality tab |
| Fail ke baad dubara kaam | Rework | Quality → Rework |

**Golden rule:** pehle master data (ek dafa), phir Production Order, phir Release, phir materials issue, phir shop floor, phir quality, last mein Complete + Close.

**IDs type mat karo.** Product, warehouse, BOM, machine, vendor, production order sab **searchable picker** se select hote hain.

**Location/branch:** top bar / location context jahan available ho wahan current warehouse/branch apply hota hai. Lists aksar isi location se filter hoti hain.

---

## 1. Sidebar map (left menu)

Login → Main Dashboard → **Manufacturing**

Left sidebar sections:

### MAIN
- Dashboard → `/manufacturing/dashboard`

### PLANNING
- Demand → `/manufacturing/planning/demand`
- MPS → `/manufacturing/planning/mps`
- MRP → `/manufacturing/planning/mrp`
- Material Shortage → `/manufacturing/planning/shortage`

### PRODUCTION
- Production Orders → `/manufacturing/production/orders`  ← **central workspace yahan se khulta hai**
- Work Orders → `/manufacturing/production/work-orders`

### MASTER DATA
- BOM → `/manufacturing/master/bom`
- Routings → `/manufacturing/master/routings`
- Work Centers → `/manufacturing/master/work-centers`
- Machines → `/manufacturing/master/machines`

### MATERIALS
- Reservations → `/manufacturing/materials/reservations`
- Issues → `/manufacturing/materials/issues`
- Scrap → `/manufacturing/materials/scrap`
- By-products → `/manufacturing/materials/byproducts`

### QUALITY
- Inspections → `/manufacturing/quality/inspections`
- Rework → `/manufacturing/quality/rework`

### MAINTENANCE
- Requests → `/manufacturing/maintenance/requests`
- Orders → `/manufacturing/maintenance/orders`

### SUBCONTRACTING
- Vendors → `/manufacturing/subcontracting/vendors`
- Orders → `/manufacturing/subcontracting/orders`

### COSTING & REPORTS
- Costing → `/manufacturing/costing`
- Reports → `/manufacturing/reports`
- Settings → `/manufacturing/settings`

---

## 2. Pickers — kahan kya search hota hai

Har jagah jahan “Select …” likha ho, click karo, search box mein type karo, list se choose karo.

| Picker | Search kahan | List mein kya dikhta hai | Use |
|--------|----------------|---------------------------|-----|
| Product picker | Product name / SKU | Name, SKU, current stock | Finished product, BOM component, scrap item, by-product, inspection product |
| Warehouse picker | Warehouse name / code | Name, code, type | Source WH, WIP WH, FG WH, issue-from warehouse |
| BOM picker | BOM number / product | BOM #, product, version | Production order par BOM choose |
| Production order picker | Order number / product | Order #, product, status | Issue, scrap, inspection, rework |
| Work center picker | Name / code | Name, code, department | Machine, routing operation, scrap |
| Machine picker | Name / code | Machine, code, status | Routing operation, scrap, maintenance |
| Vendor picker | Name / email / phone | Vendor, email, phone | Subcontract order |

Product picker warehouse products se aata hai (`/api/warehouse/products`). Pehle Warehouse module mein product exist hona chahiye.

---

## 3. START-TO-END HAPPY PATH (yeh sab se important flow hai)

Example product: **Finished Product A**, 100 units banana hai.

BOM:
- Raw Material A — 10 KG per unit
- Raw Material B — 5 KG per unit
- Packaging — 2 pcs per unit

System calculate karega:
- RM A = 1000 KG
- RM B = 500 KG
- Packaging = 200 pcs

### Step 0 — Warehouse products (Manufacturing se pehle)

Screen: Warehouse → Products

Banao / confirm karo:
1. Finished Product A
2. Raw Material A, B, Packaging

Raw materials par stock hona chahiye, warna release ke baad shortage dikhegi aur issue fail ho sakta hai (agar negative inventory off ho).

Warehouses bhi banao: Source (raw), WIP (optional), Finished Goods.

### Step 1 — Work Center

Screen: Manufacturing → Master Data → **Work Centers**  
Route: `/manufacturing/master/work-centers`

**Search:** name / code

**Add button** → form:

| Field | Required? | Kya likho |
|-------|-----------|-----------|
| Name | Yes | e.g. Cutting Line |
| Code | No | auto ho sakta hai, e.g. WC-... |
| Department | No | Production |
| Factory | No | Plant 1 |
| Capacity / hour | No | 100 |
| Shift | No | Morning |
| Cost Per Hour | No | labor/machine costing ke liye |
| Efficiency % | No | 100 |
| Status | No | Active / Inactive / Maintenance |
| Notes | No | |

Save. Status **Active** rakho.

### Step 2 — Machine (optional but recommended)

Screen: Master Data → **Machines**  
Route: `/manufacturing/master/machines`

**Search:** machine name / code

**Add:**

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Machine Name | Yes | type |
| Machine Code | No | |
| Serial Number | No | |
| Model | No | |
| Manufacturer | No | |
| Work Center | No | picker se Step 1 wala work center select |
| Status | No | Idle / Running / Maintenance / Breakdown / Offline |
| Hourly Operating Cost | No | costing |
| Purchase Date | No | |
| Installation Date | No | |

### Step 3 — BOM (recipe)

Screen: Master Data → **BOM**  
Route: `/manufacturing/master/bom`

**List search:** BOM number / product name

**New BOM** button → `/manufacturing/master/bom/new`

#### Header fields

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Finished Product | Yes | Product picker — Finished Product A search + select |
| Version / Revision | No | default `1.0` — baad mein V2 banao, purane orders purani revision par rehte hain |
| Status | No | Draft, phir **Active** karo warna default BOM load nahi hogi |
| Effective From | No | aaj |
| Effective To | No | blank = open |
| Notes | No | |

Right card **BOM Costing** automatically dikhata hai: Material + Expected scrap + Estimated cost.

#### Component table (ek document, multiple lines)

Har line:

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Item | Yes | Product picker — raw material search + select |
| Qty | Yes | 1 finished unit ke liye kitna chahiye, e.g. 10 |
| UoM | Yes | pcs, KG, L — product se default aa sakta hai |
| Scrap % | No | extra wastage, e.g. 5 matlab 5% extra required |
| Est. cost | No | line estimated cost; blank ho to product cost × qty |
| Substitute | No | alternate material name |
| Op seq | No | kis operation pe consume hoga, e.g. 1 |
| trash icon | | line delete |

**Add component** se nayi line.

Example 3 lines:
1. Raw Material A, Qty 10, UoM KG
2. Raw Material B, Qty 5, UoM KG
3. Packaging, Qty 2, UoM pcs

**Save BOM.** List mein BOM number dikhega. Row click = same editor (edit).

**Zaroori:** Status **Active** hona chahiye taake naya Production Order default BOM uthaye.

### Step 4 — Routing (steps)

Screen: Master Data → **Routings**  
Route: `/manufacturing/master/routings`

**Search:** routing number / product

**New Routing** → `/manufacturing/master/routings/new`

#### Header

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Product | Yes | same Finished Product A |
| Description | No | e.g. Cutting → Welding → Paint |
| Version | No | 1.0 |
| Status | No | **Active** |
| Notes | No | |

Right card: total minutes + estimated operation cost.

#### Operations (multiple steps, one routing)

Har step card:

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Operation | Yes | Cutting, Welding, Painting... |
| Work center | Yes | picker — Step 1 wala center. Bina iske save nahi hoga |
| Machine | No | picker |
| Setup (min) | No | machine setup time |
| Run / unit (min) | No | 1 piece ka run time |
| Queue (min) | No | waiting |
| Workers | No | labor count |
| Estimated cost | No | |
| Quality checkpoint | No | checkbox |
| Instructions | No | drawings, tools, notes |

**Add operation** se naya step. Up/down arrows se order change. Trash se delete.

Sequence automatically 1, 2, 3...

**Save routing.** Status **Active**.

Release ke time har operation se **Work Order** banega.

### Step 5 — (Optional) Planning

Zaroorat nahi agar seedha order banana hai. Planning yeh hai:

**Demand** `/manufacturing/planning/demand`
- Search: product
- Add: Product picker, Demand Type = SalesOrder / Forecast / Manual, Quantity, Required Date, Notes

**MPS** `/manufacturing/planning/mps`
- Product picker (multiple allowed), Period week/month, Quantity
- Creates one MPS row per selected product

**MRP** `/manufacturing/planning/mrp`
- Button: **Run MRP**
- Koi extra field nahi
- Table: Material, Required, Available, Reserved, Incoming, Shortage, Suggested Purchase, Suggested Production
- Open production orders + open demand explode karta hai

**Shortage** `/manufacturing/planning/shortage`
- Auto load
- Materials Short + Shortage Quantity
- Table: Material, Required, Available, Reserved, Shortage

### Step 6 — New Manufacturing / Production Order

Screen: Production → **Production Orders** → **New Order**  
Route: `/manufacturing/production/orders/new`

#### Fields

| Field | Required? | Kya karo |
|-------|-----------|----------|
| Product | Yes | picker — Finished Product A. Select karte hi default **Active BOM**, **Active Routing**, aur **calculated material requirement** load |
| BOM revision | No | auto; override kar sakte ho isi product ki BOMs se |
| Routing | No | read-only default routing name; backend product ke Active routing se attach karta hai |
| Planned Quantity | Yes | 100. Change karo to explosion dubara calculate |
| Priority | No | Low / Medium / High / Urgent |
| Start Date | No | default aaj |
| Due Date | No | default +7 days |
| Demand Type | No | Make to Stock, Make to Order, Sales Order, Forecast, Manual |
| Sales Order Reference | No | text, e.g. SO-1044 |
| Source Warehouse | No | raw material nikalne ki jagah. Picker |
| WIP Warehouse | No | in-process |
| Finished Goods Warehouse | No | complete hone par yahan stock IN |
| Notes | No | |

Neeche card **Calculated material requirement**:

| Column | Meaning |
|--------|---------|
| Component | raw item |
| BOM qty | 1 finished unit |
| Scrap % | extra |
| Required | planned × BOM qty × (1 + scrap%/100) — 100 units par 1000 / 500 / 200 |
| Est. cost | |

**Create Order** → Detail/workspace khulta hai. Status = **Draft**.

### Step 7 — Manufacturing Order Workspace (sab se important screen)

Route: `/manufacturing/production/orders/:id`  
List se row click karke aao.

Header buttons **status ke mutabiq**:

| Current status | Buttons |
|----------------|---------|
| Draft / Planned | **Release**, **Cancel** |
| Released | **Start production**, **Cancel** |
| In Progress | **Hold** (pause), **Cancel** |
| Paused | **Resume**, **Cancel** |
| Completed | **Close** |
| Closed / Cancelled | koi action nahi, edit nahi |

Pause/Cancel par reason prompt.

Upar KPI cards: Planned, Good qty, Rejected, Scrap, Remaining, Unit cost.

Timeline chips: Created → Released → Materials reserved → Materials issued → In production → Completed → QC → FG received → Closed

**Tabs:**
1. Overview
2. Materials
3. Operations
4. Output
5. Quality
6. Scrap / By-products
7. Costing
8. History

#### Tab Overview
Product, SKU, BOM number, Routing number, Priority, Demand, Sales order, Batch, Start, Due, Source WH, FG WH, notes.  
Progress: kitni materials issued, kitni operations done, inspections count, created by.

#### Tab Materials
Release se pehle khali: “Release the order to explode BOM”.

**Release** dabao (Draft se). System:
- Har BOM component ki required qty calculate
- Available stock dekhta hai
- **Reservation** banata hai
- Warehouse **reserved stock** badhata hai (jitna available ho)
- Routing se **Work Orders** banata hai
- WIP record
- Status **Released**

Uske baad table:

| Column | Meaning |
|--------|---------|
| Item | component + UoM |
| Required | explode qty |
| Reserved | stock hold |
| Issued | already given to factory |
| Remaining | required − issued |
| Issue now | is transaction mein kitna dena hai (default remaining) |
| Batch | raw material batch/lot |

**Issue selected lines** — **ek transaction**, saari lines. Warehouse source WH se stock OUT. Reserved bhi adjust.

Shortage ho to issue fail ho sakta hai (negative inventory off).

Yahi kaam Materials → Issues screen se bhi ho sakta hai (neeche).

#### Tab Operations
Release ke baad har routing step = 1 Work Order.

Har card:
- Sequence, name
- Work center
- Previous / Next operation
- Status badge
- **Start** (Pending), **Pause** (In Progress), **Resume** (Paused)
- Good qty, Scrap, Rejected, Downtime min
- **Report**

Parent order Start / pehli WO start se **In Progress** ho jata hai.

Poori order Complete **tab se nahi** hoti ke last WO complete ho — FG ke liye Output tab use karo.

Work Orders list screen se bhi Start/Pause/Report/Complete ho sakta hai.

#### Tab Output (finished goods)

| Field | Kya karo |
|-------|----------|
| Good quantity | achhi produced qty, e.g. 95 |
| Rejected | QC fail |
| Scrap | kharab |
| Rework | dubara process |
| Production batch | FG lot number |
| Finished goods warehouse | picker; order ki FG WH default |

**Complete & receive FG**
- Status **Completed**
- Remaining = planned − good
- FG warehouse par **stock IN** (good qty)
- WIP complete
- History entry

Closed nahi hota abhi.

#### Tab Quality
Yahan se ya Quality → Inspections se.

| Field | Kya karo |
|-------|----------|
| Type | Incoming / InProcess / Final |
| Result | Pending / Passed / Failed / Rework / Scrap |
| Remarks | |

Parameter table (multiple rows, one inspection):

| Parameter | Standard | Actual | Tolerance | UoM |
|-----------|----------|--------|-----------|-----|
| Weight | 10 | 10.1 | 0.2 | KG |
| Color | White | White | | |

**Parameter** button se row. **Save inspection**.

**Note:** pehle HR module mein kam az kam 1 employee hona chahiye (inspector FK). Warna error: create an employee first.

Numeric standard vs actual ± tolerance = Pass/Fail auto.

#### Tab Scrap / By-products

**Scrap (left)**
- Product picker per line
- Qty, Reason, Recoverable checkbox, Cost
- **Line** se multiple
- **Save scrap** — order ki scrap qty update

**By-products (right)**
- Product picker, Qty, Batch
- **Receive** — selected warehouse/FG par **stock IN**

#### Tab Costing
Cards: Material, Labor, Machine, Overhead, Additional/scrap, Total, Unit cost, Variance  
BOM estimated + routing times × work center/machine rates.

#### Tab History
When, From status, To status, Reason (issues/complete bhi yahan note).

### Step 8 — Close

Status **Completed** par header **Close**.  
Closed order edit nahi hota.

---

## 4. Har screen ka detail (sidebar order)

### 4.1 Dashboard — `/manufacturing/dashboard`

Kya hota hai: KPI cards + charts + recent orders.

Search: nahi. Location change se reload. **Refresh** button.

Cards (click → related list):
- Production Today / This Month / Planned / Actual → Production Orders
- Pending Orders → orders?status=Draft
- In Progress / WIP → In Progress orders
- Completed / Finished Goods → Completed orders
- Cancelled → Cancelled
- Material Shortage → Shortage screen
- Scrap → Scrap
- Rework → Rework
- Quality Rejections → Inspections
- Downtime / Efficiency / OEE / Yield → Reports or Work Centers

Recent Production Orders table: row click → workspace.

### 4.2 Demand — `/manufacturing/planning/demand`

Search: product name.

Add/Edit:

| Field | Type | Required |
|-------|------|----------|
| Product | picker | Yes |
| Demand Type | SalesOrder, Forecast, Manual | |
| Quantity | number | Yes |
| Required Date | date | Yes |
| Notes | textarea | |

List: Product, Type, Qty, Period, Status.

MRP is demand ko bhi requirement samajh sakta hai.

### 4.3 MPS — `/manufacturing/planning/mps`

Search list nahi; table of schedules.

Create:
- Product picker (multiple products = multiple MPS rows, same qty/period)
- Period: week / month
- Quantity

List: Product, Period, Planned, Actual, Week/month, Status.

### 4.4 MRP — `/manufacturing/planning/mrp`

Sirf **Run MRP**.  
Open MOs (Draft/Planned/Released/In Progress/Paused) ki BOM explode + open Demand.

Formula: `component.qty × order.plannedQty × (1 + scrap%/100)`

Columns: Material, Required, Available, Reserved, Incoming (abhi 0), Shortage, Suggested Purchase, Suggested Production (abhi 0).

Auto PO abhi setting se nahi banta automatically (setting stored hai, execution limited).

### 4.5 Material Shortage — `/manufacturing/planning/shortage`

Search nahi. Location ke mutabiq.  
Summary: Materials Short, Shortage Quantity.  
Table: Material, Required, Available, Reserved, Shortage.

### 4.6 Production Orders list — `/manufacturing/production/orders`

Search: order number / product.

Status pills: All, Draft, Planned, Released, In Progress, Paused, Completed, Closed, Cancelled.

Columns: Order, Product, Planned, Produced, Remaining, Start, Due, Status, Progress.

**New Order** → create form.  
Row click → workspace.

Dashboard KPI `?status=` yahan filter set karta hai.

### 4.7 Work Orders — `/manufacturing/production/work-orders`

Search: WO number / operation.

Ye Release ke baad auto bante hain. Manually rarely.

Columns: WO #, MO # (link to workspace), Operation, Work Center, Planned, Completed, Status, Actions.

Actions:
- Pending: Start, Report
- In Progress: Pause, Report, Complete
- Paused: Resume, Report, Complete

List screen par Report abhi browser prompt: Good qty, Scrap qty.  
Workspace Operations tab par zyada fields: rejected, downtime, notes.

Pehli Start parent MO ko In Progress kar deti hai. Last WO complete parent ko auto-Complete **nahi** karti.

### 4.8 BOM list — `/manufacturing/master/bom`

Search: BOM / product.  
Columns: BOM, Product, Version, Components, Est. cost, Status.  
New BOM / row click = editor.

### 4.9 Routings list — `/manufacturing/master/routings`

Search: routing / product.  
Columns: Routing, Product, Operations count, Status.  
New / row = editor.

### 4.10 Work Centers / Machines

Upar Step 1–2.  
Lists: search box. Add/Edit/Delete modal (generic list).  
Machines: Work Center picker se link.

### 4.11 Reservations — `/manufacturing/materials/reservations`

Search: reservation / material.

Normally **Release auto create** karta hai. Manual Add:

| Field | Required |
|-------|----------|
| Production Order | picker, Yes |
| Material / Product | picker, Yes |
| Required Qty | number |
| Reserved Qty | number |

List: MO #, Material, Required, Reserved, Status (Pending / Reserved / PartiallyReserved / Completed).

Manual reserved qty warehouse reserved stock ko tab update karti hai jab Release flow chale. Manual create informational ho sakti hai.

### 4.12 Issues — `/manufacturing/materials/issues`

Do hisson mein:

**New issue document**
1. Manufacturing order picker — select MO
2. System materials load: Item, Required, Already issued, Remaining, Issue now, Batch
3. From warehouse picker
4. Quantities edit
5. **Issue materials** — ek document number, multiple lines, stock OUT

**Issue history** search: issue # / material.  
Columns: Issue #, MO #, Material, Qty, Batch, Status (Issued).

Workspace Materials tab same API.

### 4.13 Scrap — `/manufacturing/materials/scrap`

**New scrap document**
- MO picker
- Work center picker (optional)
- Lines: Product picker, Qty, Reason, Recoverable checkbox, Cost
- Add Line, Save scrap

History: MO #, Material, Qty, Reason, Cost.

Workspace Scrap tab bhi same.

### 4.14 By-products — `/manufacturing/materials/byproducts`

Generic add:

| Field | Type |
|-------|------|
| Production Order | picker required |
| By-product | product picker required |
| Quantity | number required |
| Warehouse | picker |
| Batch / Lot | text |
| Cost allocation | number |

Save par warehouse stock IN (agar warehouse diya).

### 4.15 Inspections — `/manufacturing/quality/inspections`

**New inspection**
- MO picker
- Product picker
- Type, Result
- Parameter grid (multiple)
- Remarks
- Save inspection

History: Inspection #, MO #, Product, Result.

HR employee chahiye inspector ke liye.

### 4.16 Rework — `/manufacturing/quality/rework`

| Field | Type |
|-------|------|
| Production Order | picker required |
| Product | picker required |
| Rework Qty | number |
| Reason | text |
| Rework Cost | number |
| Status | Pending / InProgress / Completed / Scrap |

### 4.17 Maintenance Requests — `/manufacturing/maintenance/requests`

| Field | Type |
|-------|------|
| Machine | picker required |
| Type | Preventive / Corrective / Breakdown |
| Priority | Low / Normal / High / Urgent |
| Description | |
| Status | Pending / Approved / InProgress / Completed / Rejected |

Search: request #.

### 4.18 Maintenance Orders — `/manufacturing/maintenance/orders`

| Field | Type |
|-------|------|
| Machine | picker required |
| Technician | text/id (HR employee id agar use ho) |
| Start Date | |
| End Date | |
| Maintenance Cost | |
| Status | Open mapped to Scheduled; In Progress; Completed; Cancelled |

### 4.19 Subcontract Vendors — `/manufacturing/subcontracting/vendors`

| Field | Type |
|-------|------|
| Vendor name | required |
| Email | |
| Phone | |
| Status | Active / Inactive |

Alag vendor master hai, Warehouse suppliers se mix nahi.

### 4.20 Subcontract Orders — `/manufacturing/subcontracting/orders`

| Field | Type |
|-------|------|
| Vendor | picker required |
| Product | picker required |
| Quantity | |
| Due Date | expectedDeliveryDate |
| Status | Pending / Sent / PartiallyReceived / Received / Cancelled |

List mein Operation column ho sakti hai lekin form mein operation picker nahi.

Materials sent/received child screens redirect yahin.

### 4.21 Costing — `/manufacturing/costing`

Tabs (filters nahi):
- **Standard** — product, material, labor, machine, overhead, total
- **Actual** — MO, product, same cost buckets
finq asddsfs
- **Variance** — standard vs actual, material/labor variance
- **Product lookup** — product picker, breakdown including subcontracting

Order workspace Costing tab usi order ka breakdown.

### 4.22 Reports — `/manufacturing/reports`

Tabs, 4 summary cards each, row-level report nahi:
- Production: orders, good qty, scrap, completion %
- Material: consumed, variance, shortage, WIP
- Quality: inspections, passed, failed, rejection rate
- Machine: total, running, downtime, maintenance cost
- Efficiency: efficiency, yield, utilization, OEE
- Cost: standard, actual, variance, labor

Date filters currently nahi.

### 4.23 Settings — `/manufacturing/settings`

| Field | Meaning |
|-------|---------|
| Production Order Prefix | MO- |
| Work Order Prefix | WO- |
| BOM Prefix | BOM- |
| Next Sequence Number | numbering |
| Allow Negative Inventory | No recommended. Yes = issue stock khatam hone par bhi allow (clamp) |
| Auto-create Purchase Orders from MRP | stored; full auto PO abhi limited |
| Default Source Warehouse | picker |
| Default WIP Warehouse | picker |
| Default Finished Goods Warehouse | picker |

Save.

---

## 5. Status meanings

### Production / Manufacturing Order
`Draft` → Release → `Released` → Start → `In Progress` → Complete & receive FG → `Completed` → Close → `Closed`

Exceptions:
- `Paused` = Hold
- `Cancelled` = remaining reservations release
- `Planned` list filter mein hai; create always Draft

Closed / Cancelled: edit band.

### Work Order
`Pending` → Start → `In Progress` ⇄ `Paused` → `Completed`

### BOM / Routing
`Draft` | `Active` | `Obsolete`  
Naya order **Active** uthata hai.

### Reservation
`Pending` | `Reserved` | `PartiallyReserved` | `Completed`

### Material Issue
`Issued` (Consumed/Returned schema mein hain, UI mainly Issued)

### Inspection result
`Pending` | `Passed` | `Failed` | `Rework` | `Scrap`

Parameter line: `Pass` | `Fail`

### Rework
`Pending` | `InProgress` | `Completed` | `Scrap`

---

## 6. Inventory kya hota hai (Warehouse stock)

Manufacturing **naya accounting engine nahi** chalata. Existing warehouse `ProductStock` use hota hai.

| Action | Stock |
|--------|--------|
| Create MO | kuch nahi |
| Release | Raw material **reserved** (available kam) |
| Issue materials | Raw **current stock OUT**, reserved adjust |
| Complete & receive FG | Finished goods **IN** |
| By-product receive | That product **IN** |
| Cancel MO | remaining reservation **release** |
| Scrap record | qty/cost record; issued material pehle nikal chuka hota hai |

Warehouse → Products / stock screens par asar dikhega.

**Limitation:** warehouse stock integer hai. 10.4 KG issue round ho ke 10 post ho sakta hai.

---

## 7. System kya khud calculate karta hai

- BOM required = planned × BOM qty × (1 + scrap%/100)
- New MO: default Active BOM + Active Routing + explosion table
- Reservation required qty on Release
- Remaining = required − issued
- Operation estimated cost from setup/run × work center rate
- Order costing: material + labor + machine + ~10% overhead + scrap cost
- Unit cost = total / produced
- QC numeric pass/fail from standard ± tolerance
- Progress % from completed work orders

User ko manually required qty type karne ki zaroorat nahi, sirf issue/produced/scrap/actual readings.

---

## 8. Common mistakes

1. Warehouse mein product nahi → picker khali.
2. BOM/Routing **Draft** → naya order default nahi uthata. **Active** karo.
3. Routing operations mein work center nahi → save error.
4. Bina Release materials issue → lines nahi / kam data.
5. Raw stock nahi + negative inventory off → issue error.
6. Source / FG warehouse nahi → reserve/receive skip ya fail.
7. QC save → “HR employee required as inspector”.
8. Completed ke baad Close bhoolna → order open rehta hai.
9. Har material ke liye alag Issue banana — **mat karo**. Ek document, multiple lines.
10. BOM badalne se purane MOs ki revision nahi badalti. Purana order usi BOM id/version par hai jo create/release par lagi.

---

## 9. Document chain (navigate)

```
Sales Order reference (text on MO)
    → Demand (optional)
    → Manufacturing Order (workspace)
        → Reservations (auto on Release)
        → Material Issues (multi-line)
        → Work Orders / Operations
        → Quality Inspection (parameters)
        → Scrap / By-products
        → FG Receipt on Complete
        → Close
```


Workspace se zyada kaam ho jata hai. Alag screens history/list + extra documents ke liye hain.

---

## 10. Mini script teacher ke liye (100 units)

1. Warehouse: Product A, RM A, RM B, Packaging + stock on RMs + 3 warehouses.
2. Work Center Active + optional Machine.
3. BOM Active: A=10, B=5, Pack=2. Status Active.
4. Routing Active: 2–3 operations, har ek par work center.
5. New Order: Product A, qty 100, warehouses. Check explosion 1000/500/200. Create.
6. Workspace: Release.
7. Materials tab: teeno lines Issue.
8. Operations: Start + Report good qty.
9. Quality: Final, parameters, Passed.
10. Output: good 100, batch, FG warehouse, Complete & receive FG.
11. Close.
12. Dashboard + Warehouse products par FG stock check.

Agar user poochhe “ab main kahan hoon?”, usse current **status** aur **tab** pucho, phir next button batao.
