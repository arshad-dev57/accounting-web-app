# Bisonstechs ERP — Manufacturing Process Flow & Visual Diagrams

**Module:** Manufacturing  
**App:** Bisonstechs ERP  
**Interactive UI Guide:** Available in app at `/manufacturing/guide`

---

## 1. Master Journey Diagram (End-to-End Happy Path)

```mermaid
flowchart TD
    subgraph PREPARATION [Phase 1: Preparation & Purchasing]
        A1[Create / Verify Warehouse Locations] --> A2[Create Raw Materials & Finished Product SKUs]
        A2 --> A3[Create Supplier Record]
        A3 --> A4[Create & Approve Purchase Order - PO]
        A4 --> A5[Confirm Goods Receiving Note - GRN]
        A5 --> A6[Raw Material Stock Available in Warehouse]
    end

    subgraph MASTER_DATA [Phase 2: Master Data Setup]
        B1[Create Work Center - Department & Hourly Rates] --> B2[Create Machine - Linked to Work Center]
        B2 --> B3[Create Bill of Materials - BOM Recipe]
        B3 --> B4[Create Routing - Steps & Times]
    end

    subgraph PRODUCTION [Phase 3: Production Order Lifecycle]
        C1[Create Production Order - Status: Draft] --> C2[Press RELEASE]
        C2 --> C3[Material Reservations Created]
        C3 --> C4[Issue Materials - Stock OUT from Raw WH]
        C4 --> C5[Start Order - Status: In Progress]
        C5 --> C6[Operation 1: Preparation]
        C6 --> C7[Operation 2: Assembly / Processing]
        C7 --> C8[Operation 3: Packaging / Finishing]
        C8 --> C9[Report Good / Rejected / Scrap / Downtime]
    end

    subgraph OUTPUT_QUALITY [Phase 4: Output & Quality Inspection]
        D1[Production Output Rolled Up] --> D2[Quality Inspection - Incoming / In-Process / Final]
        D2 --> D3{QUALITY PASSED?}
        D3 -- YES --> D4[Complete & Receive FG - Stock IN to FG WH]
        D3 -- NO --> D5[Create Rework Record - Pending]
        D5 --> D6[Rework In Progress]
        D6 --> D7[Rework Completed]
        D7 --> D8[Final Re-Inspection]
        D8 --> D4
    end

    subgraph CLOSING [Phase 5: Financials & Closing]
        E1[Production Order Status: Completed] --> E2[Costing Breakdown Calculated]
        E2 --> E3[Press CLOSE -> Status: Closed]
    end

    PREPARATION --> MASTER_DATA
    MASTER_DATA --> PRODUCTION
    PRODUCTION --> OUTPUT_QUALITY
    OUTPUT_QUALITY --> CLOSING
```

---

## 2. Alternative Branch Diagrams

### 2.1 Branch Flow A: Partial Production Journey

```mermaid
flowchart TD
    P1[Planned Quantity: 20 Units] --> P2[First Production Output: Good = 15]
    P2 --> P3[Click Complete & Receive FG with Qty = 15]
    P3 --> P4[Produced = 15 | Remaining = 5]
    P4 --> P5[Status: Partially Completed]
    P5 --> P6[CRITICAL: Continue SAME Production Order]
    P6 --> P7[Second Production Output: Good = 5]
    P7 --> P8[Click Complete & Receive FG with Qty = 5]
    P8 --> P9[Produced = 20 | Remaining = 0]
    P9 --> P10[Status: Completed]
```

### 2.2 Branch Flow B: Close Short Journey

```mermaid
flowchart TD
    CS1[Planned Quantity: 20 Units] --> CS2[Produced Quantity: 15 Units]
    CS2 --> CS3[Remaining Quantity: 5 Units]
    CS3 --> CS4[Business Decision: Intentionally Stop Production]
    CS4 --> CS5[Click Close Short Button on Order Workspace]
    CS5 --> CS6[Enter Mandatory Reason String]
    CS6 --> CS7[Remaining Material Reservations Released]
    CS7 --> CS8[Status: Closed Short - Terminal]
```

### 2.3 Branch Flow C: Scrap & Rejected Output Flow

```mermaid
flowchart TD
    SR1[Production Activity] --> SR2[Output: Good 15 + Rejected 3 + Scrap 2]
    SR2 --> SR3[Operation Output Rollup uses Last Operation Output]
    SR3 --> SR4[Finished Goods Warehouse Receives ONLY 15 Good Units]
    SR4 --> SR5[Rejected 3 Units Logged as Non-Conforming]
    SR5 --> SR6[Scrap 2 Units Logged with Loss Reason & Cost]
    SR6 --> SR7[Costs Added to Order Total & Unit Cost]
```

### 2.4 Branch Flow D: By-Product Stock Receipt

```mermaid
flowchart TD
    BP1[Main Manufacturing Activity] --> BP2[Secondary Output Generated e.g. Wood Offcuts]
    BP2 --> BP3[Open By-Products Tab / Form]
    BP3 --> BP4[Select Product, Quantity, Warehouse & Batch]
    BP4 --> BP5[Click Receive]
    BP5 --> BP6[STOCK IN: By-Product Stock Increases in Warehouse]
```

---

## 3. Order Status State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft: Create Production Order
    Draft --> Released: Click Release
    Draft --> Cancelled: Click Cancel
    
    Released --> InProgress: Click Start / Op Start
    Released --> Paused: Click Hold / Pause
    Released --> Cancelled: Click Cancel
    Released --> ClosedShort: Click Close Short + Reason
    Released --> PartiallyCompleted: Complete & Receive FG (remaining > 0)
    Released --> Completed: Complete & Receive FG (remaining = 0)

    InProgress --> Paused: Click Hold / Pause
    InProgress --> PartiallyCompleted: Complete & Receive FG (remaining > 0)
    InProgress --> Completed: Complete & Receive FG (remaining = 0)
    InProgress --> ClosedShort: Click Close Short + Reason
    InProgress --> Cancelled: Click Cancel

    Paused --> InProgress: Click Resume
    Paused --> Completed: Complete & Receive FG
    Paused --> Cancelled: Click Cancel

    PartiallyCompleted --> PartiallyCompleted: Receive FG again (remaining > 0)
    PartiallyCompleted --> Completed: Receive FG (remaining = 0)
    PartiallyCompleted --> ClosedShort: Click Close Short + Reason
    PartiallyCompleted --> Cancelled: Click Cancel

    Completed --> Closed: Click Close

    Closed --> [*]
    ClosedShort --> [*]
    Cancelled --> [*]
```

---

## 4. Simplified 30-Second Journey Map

```
1. PREPARATION   : Product ──► Supplier ──► PO ──► GRN ──► Stock Available
2. MASTER DATA   : Work Center ──► Machine ──► BOM ──► Routing
3. PRODUCTION    : Create MO ──► Release ──► Reserve ──► Issue ──► Operations
4. OUTPUT        : Good / Rejected / Scrap ──► Quality Inspection ──► (Rework if fail)
5. FINANCIALS    : Complete & Receive FG (Stock IN) ──► Costing Calculated
6. CLOSING       : Completed ──► Closed  (or Partially Completed / Close Short)
```
