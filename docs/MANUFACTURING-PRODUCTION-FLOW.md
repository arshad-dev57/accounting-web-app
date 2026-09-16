# Manufacturing Production Flow — User Guide

**App:** Bisonstechs ERP → Manufacturing  
**Audience:** Factory / production staff, planners, warehouse, quality  
**Open from:** Main Dashboard → **Manufacturing** (`/manufacturing/dashboard`)

Yeh file ek normal user ko batati hai ke production **kahan se start** hoti hai, **kab kya banana** hai, aur **kisi cheez ka asar kahan** padta hai. IDs type nahi karni — lists se select karo.

---

## 1. Picture in one minute

Factory mein finished product banana = recipe + steps + materials + people/machines.

| Real life | System mein | Screen |
|-----------|-------------|--------|
| Finished item (chair, cream, shirt) | **Product** (Warehouse se) | Warehouse → Products |
| Recipe (kitna wood, kitna glue) | **BOM** (Bill of Materials) | Manufacturing → Master Data → BOM |
| Kaam ke steps (cut → assemble → pack) | **Routing** | Manufacturing → Master Data → Routings |
| Department / line | **Work Center** | Manufacturing → Master Data → Work Centers |
| Machine on that line | **Machine** | Manufacturing → Master Data → Machines |
| “100 chairs banao by Friday” | **Production Order** (MO) | Manufacturing → Production → Production Orders |
| Har step ka shop-floor ticket | **Work Order** (WO) | Manufacturing → Production → Work Orders |
| Raw material reserve / issue | **Reservations / Issues** | Manufacturing → Materials |

**Golden rule:** pehle **master data** (ek dafa), phir **order**, phir **release**, phir **shop floor + materials**, phir **quality**, last mein **complete / close**.

### Manufacturing Order is the workspace

Production Order (`/manufacturing/production/orders/:id`) ek hi jagah se:

- BOM materials dekho, shortage dekho, **saari lines ek transaction mein issue** karo
- Operations start / pause / report (good, scrap, rejected, downtime)
- Output: good / rejected / scrap / rework / batch / FG warehouse → **Complete & receive FG**
- Quality inspection with multiple parameters
- Scrap + by-products as multi-line documents
- Costing (material, labor, machine, overhead, unit cost)
- Status timeline + audit history

Status: **Draft → Released → In Progress → Completed → Closed** (Hold/Cancel exceptions). Closed orders edit nahi hote.

```
Warehouse products
        │
        ▼
Work Centers → Machines
        │
        ▼
BOM (recipe) + Routing (steps)     ←  ek dafa, product ke liye
        │
        ▼
Demand / MPS  (optional planning)
        │
        ▼
Create Production Order  (Draft)
        │
        ▼
Release  ──►  Material Reservations
         └──►  Work Orders + WIP
        │
        ▼
Issue materials  →  Start / Report / Complete work orders
        │
        ▼
Inspections / Rework / Scrap / By-products
        │
        ▼
Complete Production Order  →  Close
        │
        ▼
Dashboard, Costing, Reports
```

---

## 2. Pehli dafa setup (ek martaba)

In cheezon ke baghair production order **ban** sakta hai, lekin release ke baad materials / work orders **khali** reh sakte hain. Is liye pehle yeh karo.

### 2.1 Warehouse products

**Kahan:** Warehouse → Products  

**Kab:** koi naya finished item ya raw material stock mein aaye.

**Kya banana:** finished product **aur** saare components (screws, fabric, chemical, packing).

**Kahan se aata hai:** Warehouse catalog. Manufacturing in products ko **select** karta hai, naya SKU yahan nahi banata.

**Asar:**
- BOM finished product + components yahi se aate hain
- Production order product picker yahi list dikhata hai
- MRP / shortage **available stock** yahi warehouse stock se milata hai

### 2.2 Warehouses (locations)

**Kahan:** Warehouse → Locations  

**Kab:** factory / store / FG godown alag hon.

**Kya banana:** kam az kam:
- source / raw warehouse (jahan se material nikalta hai)
- WIP warehouse (optional)
- finished-goods warehouse (optional)

**Asar:**
- New Production Order par Source / WIP / FG warehouse pickers
- Material Issue “From Warehouse”
- Manufacturing → Settings → default WIP / FG warehouse
- Release par reservation us source warehouse ke stock se match hoti hai

### 2.3 Work centers

**Kahan:** `/manufacturing/master/work-centers`  

**Kab:** koi production line / department (Cutting, Mixing, Assembly, Packing).

**Kya banana:** name, code, capacity, cost per hour, status **Active**.

**Asar:**
- Machines isi work center se link hoti hain
- Scrap form par work center select
- Routing operations (jab hon) isi par lagte hain
- Work orders release ke baad isi work center pe dikhte hain

### 2.4 Machines

**Kahan:** `/manufacturing/master/machines`  

**Kab:** physical machine us line par ho.

**Kya banana:** machine name + **Work Center** (modal se select, ID mat likho). Multiple work centers tick karoge to multiple machine records banenge.

**Asar:**
- Maintenance Requests / Orders isi machine se
- Scrap form par machine
- Dashboard machine Running / Idle / Maintenance counts

### 2.5 BOM (recipe) — sab se zaroori

**Kahan:** `/manufacturing/master/bom` → Add  

**Kab:** finished product pehli dafa banana ho, ya recipe change ho.

**Kya banana:**
1. **Finished Product** — picker se (woh item jo factory nikaalegi)
2. **Components** — raw products + **quantity per 1 finished unit**
3. Status **Active** (Draft se release par recipe use nahi hogi)
4. Version (optional, e.g. `1.0`)

**Kahan se aata hai:** Warehouse products.

**Asar (bahut important):**
- Production Order create par, agar BOM na chuni ho to system **usi product ki latest Active BOM** khud lagaata hai
- **Release** par har component ke liye reservation:  
  `required = component qty × planned qty × (1 + scrap%)`
- Order detail → Materials tab inhi lines se bharti hai
- **MRP** aur **Material Shortage** inhi requirements ko stock se compare karte hain
- **Costing** material cost BOM estimated cost × planned qty se aati hai

Example: 1 chair BOM = 4 legs + 1 seat. Order of 10 chairs → reserve 40 legs + 10 seats.

### 2.6 Routing (steps)

**Kahan:** `/manufacturing/master/routings`  

**Kab:** product ke production steps define karni hon.

**Kya banana:** product select, description, status **Active**.

**Kahan se aata hai:** same Warehouse product.

**Asar:**
- Production Order create par, agar routing na di ho to **usi product ki latest Active routing** auto-link hoti hai
- **Release** par, routing ki **operations** se Work Orders banate hain (har step = 1 WO)
- Order detail → Operations tab
- Work Orders list: “Work orders are created automatically when a production order is released with a routing”
- Costing labor cost routing operations ke estimated cost se

Agar routing par operations nahi hain to Work Orders list khali reh sakti hai — production order phir bhi Release / Complete ho sakta hai.

### 2.7 Settings (optional)

**Kahan:** `/manufacturing/settings`  

Prefixes (`MO-`, `WO-`, `BOM-`), default WIP / FG warehouse, negative inventory allow, MRP se auto PO (off by default — purchase orders khud nahi bante jab tak yeh on na ho).

---

## 3. Planning (optional, lekin useful)

Planning **pehle sochna** hai ke kitna banana hai. Iske baghair bhi seedha Production Order bana sakte ho.

### 3.1 Demand

**Kahan:** `/manufacturing/planning/demand`  

**Kab:** sales order, forecast, ya manual “hamein 500 units chahiye 30 tareekh tak”.

**Kya banana:** product, type (SalesOrder / Forecast / Manual), quantity, required date.

**Kahan se aata hai:** Warehouse products. Sales Order reference optional text hai — Sales module ka order yahan auto-import nahi hota.

**Asar:**
- MRP / Shortage **Open + Planned** demand ko required qty mein jodte hain
- Production dashboard planning picture

### 3.2 MPS (Master Production Schedule)

**Kahan:** `/manufacturing/planning/mps`  

**Kab:** week / month ke hisaab se “itna produce karenge” lock karna ho.

**Kya banana:** product(s) + period + quantity.

**Asar:** schedule list. MRP explode isi planning picture ke saath material need nikalta hai (open production + demand).

### 3.3 MRP (Material Requirements Planning)

**Kahan:** `/manufacturing/planning/mrp` → **Run MRP**

**Kab:** “kya khareedna / banana hai?” — production start se pehle.

**Kahan se aata hai:**
- Open production orders (Draft, Planned, Released, In Progress, Paused) ki BOM explosion
- Open / Planned demand
- Warehouse **available** aur **reserved** stock

**Asar:**
- Required vs available vs shortage
- Suggested purchase qty (shortage)
- Suggested production qty (abhi 0 — yeh suggestion screen hai)
- Purchase order **auto create nahi** hota jab tak Settings mein allow na ho
- Result Manufacturing MRP run ke taur par save hota hai

### 3.4 Material Shortage

**Kahan:** `/manufacturing/planning/shortage`  

**Kab:** sirf un items ko dekhna jin par shortage > 0.

**Asar:** same explode as MRP, filtered. Dashboard materials shortage chart bhi yahi idea use karta hai.

---

## 4. Daily production — step by step

Yeh woh flow hai jo har job par chalti hai.

### Step A — Production Order banao (Draft)

**Kahan:** `/manufacturing/production/orders` → **New Order**  
(`/manufacturing/production/orders/new`)

**Kab:** factory ko clearly pata ho ke **kaunsa product, kitna, kab tak**.

**Form mein select / fill:**

| Field | Kahan se aata hai | Asar |
|-------|-------------------|------|
| Product | Warehouse products | BOM + routing auto-link; order list / dashboard |
| BOM | Master Data → BOM (usi product ki) | Release par material reservations |
| Planned quantity | User | required materials = BOM × yeh number |
| Priority / dates | User | planning, due date on list |
| Demand type | User | order description |
| Sales order ref | Optional text | trace only |
| Source warehouse | Warehouse locations | reservation + issue stock location |
| WIP / FG warehouse | Warehouse locations | WIP record location; FG default |

Status start: **Draft**. Is waqt:
- stock **reserve nahi** hota
- work orders **nahi** bante
- warehouse qty **nahi** kat-ti

**Kahan dikhega:** Production Orders list (`MO-…`). Click → detail page.

### Step B — Release (sab se bari action)

**Kahan:** order detail → **Release**  
Sirf **Draft** ya **Planned** par.

**Kab:** materials aur shop floor ready hon; job confirm ho.

**System khud karta hai:**

1. **Material Reservations** (BOM components se)  
   Screen: `/manufacturing/materials/reservations`  
   Status: Reserved / PartiallyReserved / Pending (stock kam ho to shortage qty)

2. **Work Orders** (routing operations se)  
   Screen: `/manufacturing/production/work-orders`  
   Har operation = 1 WO, planned qty = order planned qty

3. **WIP** record (in-progress quantity)  
   Dashboard / internal WIP — nav par alag page nahi (dashboard pe production picture)

4. Order status → **Released**, actual start date set

**Asar:**
- Order Materials tab fill
- Shortage / MRP next run mein yeh required qty dikhegi
- Warehouse available vs reserved MRP mein dikhega
- Shop floor ko kaam milta hai

Release **undo** nahi — galat order **Cancel** karo (Draft/Planned/Released/In Progress/Paused se, Complete/Closed ke baad nahi).

### Step C — Materials shop floor ko do

**Reservations** release ke baad auto. Extra reservation manually bhi: Materials → Reservations → Add (production order + product pickers).

**Issues** (raw nikaalna): `/manufacturing/materials/issues` → Add  

**Kab:** material physically line par ja raha ho.

**Select:** production order, product, qty, **from warehouse**.

**Asar:**
- Order Materials tab: Issued / Remaining
- Issue number `ISS-…`
- Consumption / cost picture ke liye issued qty use hoti hai
- Is step ke baghair bhi order Complete ho sakta hai, lekin materials tracking adhoori reh jaati hai

### Step D — Shop floor (Work Orders)

**Kahan:** `/manufacturing/production/work-orders`

**Kab:** Release ke baad, jab line kaam start kare.

| Button | Kab | Asar |
|--------|-----|------|
| **Start** | Pending | WO → In Progress; parent order usually In Progress jab kaam chale |
| **Pause / Resume** | line rukegi / dubara | WO Paused / In Progress; production order Pause/Resume alag buttons hain |
| **Report** | good + scrap qty | completed / scrap on WO; planned poora ho to WO Complete |
| **Complete** | step khatam | WO Completed |

**Kahan se aata hai:** Release + routing operations + work center on that operation.

**Asar:**
- Order Operations tab statuses
- Dashboard production progress
- Scrap qty yahan report se bhi, Scrap screen se bhi

Production order khud bhi **Pause / Resume / Complete** se control hoti hai (order detail).

### Step E — Quality, scrap, by-products (jab zaroorat ho)

Saari screens par **Production Order** aur **Product** picker se select — ID mat likho.

| Screen | Kab | Asar |
|--------|-----|------|
| Inspections `/manufacturing/quality/inspections` | incoming / in-process / final check | Dashboard quality passed/failed/rework/scrap |
| Rework `/manufacturing/quality/rework` | fail ke baad dobara kaam | Order rework qty / cost; dashboard rework |
| Scrap `/manufacturing/materials/scrap` | material / FG barbad | Order scrap, work center, machine, cost |
| By-products `/manufacturing/materials/byproducts` | extra output (e.g. offcuts) | qty + warehouse |

### Step F — Complete then Close

**Complete** (order detail): jab planned production practically ho chuki ho.  
Status → **Completed**, produced qty set, WIP → Completed, actual end date.

**Close:** books / list saaf rakhni ho, koi aur shop-floor action nahi. Status → **Closed**. Buttons hat jaate hain.

**Cancel:** galat job. Status → **Cancelled**. Reason prompt.

---

## 5. Maintenance & subcontract (side flows)

Production ke parallel, factory ruk na jaye.

### Maintenance

1. **Request** `/manufacturing/maintenance/requests` — machine select, type Preventive / Corrective / Breakdown  
2. **Order** `/manufacturing/maintenance/orders` — technician, time, cost  

**Asar:** machine status (Idle / Maintenance / Breakdown) dashboard machines chart. Production line isi machine par slow / stop ho sakti hai.

### Subcontracting

1. **Vendors** `/manufacturing/subcontracting/vendors`  
2. **Orders** `/manufacturing/subcontracting/orders` — vendor + product + qty + due  

**Asar:** bahar bheja hua operation track. Material issue / receive alag old screens nav se hata di gayi hain (orders par focus).

---

## 6. After the job — costing, dashboard, reports

| Screen | Kahan se data | Kab dekho |
|--------|----------------|-----------|
| Dashboard `/manufacturing/dashboard` | open orders, inspections, machines, shortages | roz |
| Costing `/manufacturing/costing` | BOM material estimate + routing labor estimate; product lookup | job ke baad / month end |
| Reports `/manufacturing/reports` | production / material / quality / machine / efficiency / cost tabs | management |

Costing **standard vs actual vs variance** tabs hain. Product lookup = ek product ki cost.

---

## 7. Quick map: yeh cheez kahan se aayi, kahan asar

| Cheez | Source (kahan se aayi) | Create kab | Effect (kahan dikhegi) |
|-------|------------------------|------------|-------------------------|
| Product | Warehouse → Products | pehle se | BOM, orders, MRP, issues, inspections |
| Warehouse | Warehouse → Locations | pehle se | Order warehouses, issues, settings, reservation location |
| Work center | Master → Work Centers | pehle se | Machines, scrap, work orders |
| Machine | Master → Machines | work center ke baad | Maintenance, scrap, dashboard |
| BOM | Master → BOM | product ke baad, **Active** | Release reservations, MRP, costing, order materials |
| Routing | Master → Routings | product ke baad, **Active** | Release work orders, operations tab, labor cost |
| Demand | Planning → Demand | jab need pata ho | MRP + shortage required qty |
| MPS | Planning → MPS | weekly/monthly plan | schedule list |
| MRP run | Planning → MRP | plan confirm se pehle | shortage + suggested purchase |
| Production order | Production → Orders → New | job confirm | list, dashboard, all child records |
| Release | Order detail | materials + line ready | Reservations, Work Orders, WIP, status Released |
| Reservation | auto on release, or Materials → Reservations | release / extra hold | Materials tab, MRP reserved |
| Issue | Materials → Issues | material line par jaaye | Issued qty on order |
| Work order | auto on release | shop floor start | WO list, operations tab |
| Inspection / rework / scrap | Quality / Materials | defect ya extra output | dashboard quality, order scrap/rework |
| Complete / Close | Order detail | job done | status, WIP done, reports |

---

## 8. Suggested real-life sequence (pehli job)

1. Warehouse mein finished + raw products aur stock.  
2. Locations (source warehouse).  
3. Work Center → Machine.  
4. BOM **Active** (finished + components + qty).  
5. Routing **Active** (product).  
6. (Optional) Demand ya MPS.  
7. Run MRP — shortage ho to pehle purchase / stock adjust.  
8. **New Production Order** — product, qty, dates, warehouses.  
9. Detail page → **Release**.  
10. Materials → Issues (reserved items nikaalo).  
11. Work Orders → Start → Report → Complete.  
12. Inspection (final). Scrap / rework agar ho.  
13. Production Order → **Complete** → **Close**.  
14. Dashboard / Costing / Reports.

---

## 9. Status cheatsheet (Production Order)

`Draft` → `Released` → `In Progress` → (`Paused` ↔ resume) → `Completed` → `Closed`  
Kabhi: `Cancelled`

- Draft / Planned: Release ya Cancel  
- Released: Cancel (shop floor start ke baad In Progress)  
- In Progress: Pause, Complete, Cancel  
- Paused: Resume, Cancel  
- Completed / Closed / Cancelled: actions band

Work Order: `Pending` → `In Progress` → `Paused` / `Completed`

---

## 10. Common mistakes

1. **BOM Active nahi** — release par reservations nahi banti, Materials tab khali.  
2. **Raw products Warehouse mein nahi** — BOM component picker khali / galat item.  
3. **Planned qty 1 rakh kar sochna ke 100 banenge** — materials BOM × planned qty se nikalte hain.  
4. **ID paste karna** — har link (product, work center, machine, order, warehouse, vendor) modal se select karo.  
5. **Release se pehle issue** — pehle release (reserve), phir issue.  
6. **MRP ko PO samajhna** — MRP suggestion hai; Purchases module alag hai jab tak auto-PO setting on na ho.  
7. **Work Orders empty** — routing operations nahi; pehle routing/operations check, ya order ko order-level Complete se close karo.  
8. **Galat warehouse** — reservation source warehouse ke stock se match hoti hai; issue bhi wahi se.

---

## 11. Screen index

| Need | Go to |
|------|--------|
| Overview | `/manufacturing/dashboard` |
| What to make / buy | `/manufacturing/planning/mrp` and `/manufacturing/planning/shortage` |
| Start a job | `/manufacturing/production/orders/new` |
| Release / complete job | `/manufacturing/production/orders/[id]` |
| Shop floor | `/manufacturing/production/work-orders` |
| Recipe | `/manufacturing/master/bom` |
| Steps | `/manufacturing/master/routings` |
| Lines / machines | `/manufacturing/master/work-centers`, `/manufacturing/master/machines` |
| Give material to line | `/manufacturing/materials/issues` |
| Quality | `/manufacturing/quality/inspections` |
| Numbers | `/manufacturing/costing`, `/manufacturing/reports` |
| Prefixes / default warehouses | `/manufacturing/settings` |
