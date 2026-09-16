# Bisonstechs ERP — Manufacturing Quick Start Guide

**Goal:** Run your first manufacturing job in 10 fast steps without guessing screens or buttons.

---

## Quick Reference Checklist

| Step | What to do | Screen | Key Action / Button | Result |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Create Products | `Warehouse → Products` | `Save Product` | Finished item & raw materials ready |
| **2** | Buy Raw Material | `Purchases → Goods Receiving` | `Confirm Receipt` | **Stock IN** to Raw Warehouse |
| **3** | Create Work Center | `Manufacturing → Master → Work Centers` | `Add Work Center` | Department & cost per hour active |
| **4** | Create Machine | `Manufacturing → Master → Machines` | `Add Machine` | Machine linked to Work Center |
| **5** | Create BOM | `Manufacturing → Master → BOM` | `Save BOM` (Active) | Recipe defined per 1 finished unit |
| **6** | Create Routing | `Manufacturing → Master → Routings` | `Save Routing` (Active) | Production steps defined |
| **7** | Create Order | `Manufacturing → Production → Orders → New` | `Create Order` | Status: `Draft` |
| **8** | Release Order | Production Order Workspace | `Release` | Status: `Released` (Material Reserved) |
| **9** | Issue Material | Order Workspace → Materials Tab | `Issue Selected Lines` | **Stock OUT** to factory line |
| **10**| Execute & Complete | Order Workspace → Output Tab | `Complete & Receive FG` | **Stock IN** to FG Warehouse; Status: `Completed` |

---

## 5 Golden Rules

1. **No manual ID typing:** Search and pick products, warehouses, BOMs, orders, and vendors using searchable pickers.
2. **Release before Issue:** You must *Release* the order (to reserve stock) before you can *Issue* material to the factory line.
3. **Source Warehouse is required:** Ensure a Source Warehouse is assigned to the production order before clicking *Release*.
4. **Partially Completed Orders:** If you produce less than planned quantity, click *Complete & Receive FG*. The order becomes `Partially Completed`. Continue the **SAME** Production Order for the remaining quantity.
5. **Intentionally Stopping Production:** If remaining quantity will not be produced, click *Close Short* and enter a mandatory reason.

---

## Common Exceptions Cheatsheet

* **Material Shortage?** → Issue Purchase Order and confirm GRN in Purchases module first.
* **Quality Failed?** → Open `Quality → Rework`, process rework, re-inspect, then receive FG.
* **Wastage / Loss?** → Record scrap on operation report or via `Materials → Scrap`.
* **Secondary Usable Output?** → Open `Materials → By-products` and click *Receive* (**Stock IN**).
* **Completed Job?** → Press *Close* to lock the order permanently.
