'use client';

import React, { useRef, useState } from 'react';
import {
  ShoppingCart,
  PackageCheck,
  Box,
  Users,
  Wrench,
  Boxes,
  Route,
  ClipboardList,
  Rocket,
  PackageSearch,
  FileUp,
  Play,
  ListTodo,
  SearchCheck,
  PackagePlus,
  RotateCcw,
  Calculator,
  CheckCircle2,
  Lock,
  CircleSlash2,
  GraduationCap,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Factory,
  BookOpen,
  ClipboardType,
  Gauge,
  BadgeCheck,
  Clock3,
  CircleAlert,
  HelpCircle,
  PlayCircle,
  FileText,
  AlertTriangle,
  GitFork,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import {
  STEPS,
  TOP_LEVEL,
  ORDER_STATUSES,
  CHILD_RECORDS,
  DECISIONS,
  BOM_EXAMPLE,
  MODULES,
  INVENTORY,
  type GuideStep,
  type ModuleKey,
  type InventoryKey,
} from './guide-data';

const ICON: Record<string, LucideIcon> = {
  ShoppingCart,
  PackageCheck,
  Box,
  Users,
  Wrench,
  Boxes,
  Route,
  ClipboardList,
  Rocket,
  PackageSearch,
  FileUp,
  Play,
  ListTodo,
  SearchCheck,
  PackagePlus,
  RotateCcw,
  Calculator,
  CheckCircle2,
  Lock,
  CircleSlash2,
};

function Badge({
  children,
  color,
  bg,
  tone,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  tone?: 'solid' | 'soft';
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={
        tone === 'solid'
          ? { backgroundColor: color, color: '#fff' }
          : { backgroundColor: bg, color }
      }
    >
      {children}
    </span>
  );
}

function ModuleBadge({ module }: { module: ModuleKey }) {
  const m = MODULES[module];
  return (
    <Badge color={m.color} bg={m.bg}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </Badge>
  );
}

function InventoryBadge({ inv }: { inv: InventoryKey }) {
  const c = INVENTORY[inv];
  return <Badge color={c.color} bg={c.bg}>{inv}</Badge>;
}

function OpenScreen({ href, label = 'Open Screen' }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014582] text-white text-xs font-semibold hover:bg-[#01366a] transition-all shadow-sm"
    >
      <ArrowRight className="w-3.5 h-3.5" />
      {label}
    </a>
  );
}

function SectionTitle({
  id,
  kicker,
  title,
  desc,
}: {
  id?: string;
  kicker?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div id={id} className="pt-4 pb-3 scroll-mt-24">
      {kicker && (
        <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#0FA3E0] uppercase mb-1">
          {kicker}
        </p>
      )}
      <h2 className="text-xl md:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
        {title}
      </h2>
      {desc && <p className="text-sm text-[#5B6E88] mt-1 max-w-4xl">{desc}</p>}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex flex-col items-center my-1">
      <div className="w-px h-6 bg-[#C6D3E2]" />
      <ArrowDown className="w-4 h-4 text-[#0FA3E0] -mt-1.5" />
    </div>
  );
}

function SectionCard({
  title,
  desc,
  children,
  action,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#DDE4EE] shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-[#E6EDF5] flex items-center justify-between flex-wrap gap-2 bg-[#F8FAFC]">
        <div>
          <h3 className="text-base font-extrabold text-[#1A1A2E]">{title}</h3>
          {desc && <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function ProcessGuide() {
  const [activeTab, setActiveTab] = useState<
    'flow' | 'walkthrough' | 'masterdata' | 'lifecycle' | 'inventory' | 'buttons' | 'decisions' | 'scenarios'
  >('flow');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSteps = STEPS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.num.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#1A1A2E] font-sans pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#014582] via-[#01366a] to-[#1a1a2e] text-white px-6 py-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#60A5FA] mb-3">
                <Factory className="w-4 h-4" />
                Bisonstechs ERP — Manufacturing Operating System
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Manufacturing Module Process Guide & Diagram
              </h1>
              <p className="text-sm text-white/70 mt-1 max-w-3xl">
                Complete, enterprise-grade process guide reflecting the actual implemented Bisonstechs ERP system: master data, purchasing, reservations, issues, shop-floor operations, quality, rework, costing, partial completion, and close-short workflows.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/manufacturing/production/orders/new"
                className="px-4 py-2.5 rounded-xl bg-[#0FA3E0] hover:bg-[#0284C7] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                New Production Order
              </a>
              <a
                href="/manufacturing/dashboard"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2"
              >
                <Gauge className="w-4 h-4" />
                Manufacturing Dashboard
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 custom-scrollbar border-b border-white/10">
            {[
              { id: 'flow', label: 'Process Flow Diagram', icon: GitFork },
              { id: 'walkthrough', label: 'Screen-by-Screen Walkthrough', icon: BookOpen },
              { id: 'masterdata', label: 'Master Data & Architecture', icon: Boxes },
              { id: 'lifecycle', label: 'Status Lifecycle', icon: Clock3 },
              { id: 'inventory', label: 'Inventory Effect Table', icon: Box },
              { id: 'buttons', label: 'Button-by-Button Guide', icon: PlayCircle },
              { id: 'decisions', label: 'User Decision Guide', icon: HelpCircle },
              { id: 'scenarios', label: 'Tested Real Scenarios', icon: BadgeCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#014582] shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">

        {/* 1. PROCESS FLOW DIAGRAM */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Visual Process Maps"
              title="End-to-End Manufacturing Journey"
              desc="Comprehensive visual diagrams of the happy path and alternative operational branches in Bisonstechs ERP."
            />

            {/* Quick 30-Second Journey */}
            <SectionCard title="Bisonstechs Manufacturing — 30-Second Journey Summary">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="font-extrabold text-[#014582] uppercase tracking-wider mb-1">1. Preparation</p>
                  <p className="text-slate-600">Product → Supplier → Purchase → GRN → Stock Available</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="font-extrabold text-[#8E44AD] uppercase tracking-wider mb-1">2. Master Data</p>
                  <p className="text-slate-600">Work Center → Machine → BOM → Routing</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="font-extrabold text-[#3B82F6] uppercase tracking-wider mb-1">3. Production</p>
                  <p className="text-slate-600">Create MO → Release → Reservation → Issue → Operations</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="font-extrabold text-[#10B981] uppercase tracking-wider mb-1">4. Output</p>
                  <p className="text-slate-600">Good / Rejected / Scrap → Work Orders Complete</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="font-extrabold text-[#D97706] uppercase tracking-wider mb-1">5. Quality</p>
                  <p className="text-slate-600">Inspection → Pass / Fail → Rework if failed</p>
                </div>
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <p className="font-extrabold text-[#0891B2] uppercase tracking-wider mb-1">6. Financials</p>
                  <p className="text-slate-600">Complete & Receive FG → Costing calculated</p>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl">
                  <p className="font-extrabold text-slate-800 uppercase tracking-wider mb-1">7. Closing</p>
                  <p className="text-slate-600">Completed → Close OR Partially Completed OR Close Short</p>
                </div>
              </div>
            </SectionCard>

            {/* Visual Process Flow Cards */}
            <SectionCard title="Complete Main Happy Path & Decision Flow">
              <div className="space-y-4">
                <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                  <pre className="text-emerald-400">
{`+-----------------------------------------------------------------------------------+
|                            START MANUFACTURING JOURNEY                            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                  [1] Create / Verify Warehouses (Source, WIP, FG)
                                          |
                                          v
                  [2] Create Raw Material & Finished Product Records
                                          |
                                          v
                  [3] Create Supplier & Issue Purchase Order (PO)
                                          |
                                          v
                  [4] Receive Goods via GRN (Stock IN to Raw Warehouse)
                                          |
                                          v
                  [5] Raw Material Available in Stock for Manufacturing
                                          |
                                          v
                  [6] Create Work Center (Capacity & Hourly Rates)
                                          |
                                          v
                  [7] Create Machine (Linked to Work Center)
                                          |
                                          v
                  [8] Create BOM (Recipe: Material, Qty, Scrap %, Est. Cost)
                                          |
                                          v
                  [9] Create Routing (Steps: Op, Work Center, Machine, Times)
                                          |
                                          v
                 [10] Create Production Order (Select Product & Qty) [Draft]
                                          |
                                          v
                 [11] Press RELEASE (Checks Stock, Reserves Items, Creates WOs)
                                          |
                                          v
                 [12] Material Reservations Created (Reserved / Pending)
                                          |
                                          v
                 [13] Issue Materials (Stock OUT from Warehouse -> Issued)
                                          |
                                          v
                 [14] Start Production (Order Status -> In Progress)
                                          |
                                          v
                 [15] Shop-Floor Operations (Op 1 -> Op 2 -> Op 3 in Sequence)
                                          |
                                          v
                 [16] Report Quantities (Good, Rejected, Scrap, Downtime)
                                          |
                                          v
                 [17] Production Output Rolled Up to Production Order
                                          |
                                          v
                 [18] Quality Inspection (Incoming / In-Process / Final)
                                          |
                     +--------------------+--------------------+
                     |                                         |
               [QUALITY PASSED]                          [QUALITY FAILED]
                     |                                         |
                     v                                         v
         Complete & Receive FG (Stock IN)               Create Rework Record
                     |                                         |
                     v                                         v
         Production Order Completed                     Rework Pending -> In Progress
                     |                                         |
                     v                                         v
           Costing Calculated                            Rework Completed
                     |                                         |
                     v                                         v
              Press CLOSE                       Re-inspect & Complete / Close
                     |                                         |
                     v                                         v
             ORDER CLOSED (Final)                     ORDER CLOSED (Final)`}
                  </pre>
                </div>
              </div>
            </SectionCard>

            {/* Alternative Branches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Branch A: Partial Production Flow">
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-amber-900">Planned 20 → Produced 15 → Remaining 5</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>First production output: Good = 15.</li>
                    <li>Press Complete & Receive FG with quantity 15.</li>
                    <li>System calculates: Produced = 15, Remaining = 5.</li>
                    <li>Status changes to <span className="font-bold text-amber-800">Partially Completed</span>.</li>
                    <li><span className="font-bold">Crucial:</span> Do NOT create a new Production Order!</li>
                    <li>Continue the SAME Production Order on the shop floor.</li>
                    <li>Second production output: Good = 5.</li>
                    <li>Press Complete & Receive FG with quantity 5.</li>
                    <li>Produced = 20, Remaining = 0 → Status becomes <span className="font-bold text-emerald-700">Completed</span>.</li>
                  </ol>
                </div>
              </SectionCard>

              <SectionCard title="Branch B: Close Short Flow">
                <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-orange-900">Planned 20 → Produced 15 → Intentionally stop remaining 5</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Produced 15 of 20 planned units (Remaining = 5).</li>
                    <li>Management decides NOT to produce the remaining 5.</li>
                    <li>Press <span className="font-bold text-orange-700">Close Short</span> button on the order workspace.</li>
                    <li>Enter mandatory reason (e.g., "Customer reduced order quantity").</li>
                    <li>System releases all remaining material reservations back to available stock.</li>
                    <li>Status becomes <span className="font-bold text-orange-800">Closed Short</span> (terminal).</li>
                  </ol>
                </div>
              </SectionCard>

              <SectionCard title="Branch C: Scrap & Rejected Output">
                <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-rose-900">Planned 20 → Good 15 + Rejected 3 + Scrap 2</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Good Qty = 15 (accepted finished product).</li>
                    <li>Rejected Qty = 3 (produced but non-conforming).</li>
                    <li>Scrap Qty = 2 (material wasted during production).</li>
                    <li>Multi-step safety: Final output uses the last reported operation output to avoid double-counting across multi-step operations.</li>
                    <li>FG Warehouse receives ONLY Good Qty (15).</li>
                    <li>Scrap & Rejected costs are rolled into final production costing.</li>
                  </ol>
                </div>
              </SectionCard>

              <SectionCard title="Branch D: By-Product Generation">
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-emerald-900">Production generated secondary valuable material</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Main production completes (e.g. Chair manufacturing).</li>
                    <li>Wood offcuts generated as valuable By-product.</li>
                    <li>Open By-products tab / screen.</li>
                    <li>Select By-product Product, Quantity, Warehouse, and Batch.</li>
                    <li>Click <span className="font-bold text-emerald-700">Receive</span>.</li>
                    <li>Warehouse stock for the By-product increases immediately (Stock IN).</li>
                  </ol>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* 2. WALKTHROUGH (SCREEN-BY-SCREEN) */}
        {activeTab === 'walkthrough' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Detailed Walkthrough"
              title="Screen-by-Screen User Guide"
              desc="Step-by-step instructions for every screen, including exact location, fields, buttons, status changes, and inventory impact."
            />

            {/* Search Bar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#DDE4EE] shadow-sm">
              <input
                type="text"
                placeholder="Search steps by title, screen, route or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014582]"
              />
              <span className="text-xs font-bold text-[#64748B]">
                Showing {filteredSteps.length} of {STEPS.length} steps
              </span>
            </div>

            {/* Step List */}
            <div className="space-y-4">
              {filteredSteps.map((step) => {
                const isExpanded = expandedStep === step.id;
                const IconComponent = ICON[step.icon] || Box;

                return (
                  <div
                    key={step.id}
                    id={step.id}
                    className="bg-white rounded-2xl border border-[#DDE4EE] shadow-sm overflow-hidden transition-all hover:border-[#014582]/40"
                  >
                    <div
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      className="px-6 py-4 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#014582]/10 text-[#014582] flex items-center justify-center font-black text-sm shrink-0">
                          {step.num}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-[#1A1A2E]">
                              {step.title}
                            </h3>
                            <ModuleBadge module={step.module} />
                            <InventoryBadge inv={step.inventory} />
                            {step.childOf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                {step.childLabel || 'Child Record'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] mt-0.5">{step.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {step.openScreen && <OpenScreen href={step.openScreen} />}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-[#F8FAFC] space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-extrabold text-[#014582] uppercase text-[10px] tracking-wider mb-1">
                              Purpose & Context
                            </p>
                            <p className="text-slate-700">{step.purpose}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-extrabold text-[#014582] uppercase text-[10px] tracking-wider mb-1">
                              Screen & Routes
                            </p>
                            <p className="font-bold text-slate-800">{step.where.screen}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {step.where.routes.map((r) => (
                                <code
                                  key={r}
                                  className="bg-slate-100 text-[#014582] px-2 py-0.5 rounded text-[11px] font-mono"
                                >
                                  {r}
                                </code>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-extrabold text-[#0FA3E0] uppercase text-[10px] tracking-wider mb-1">
                              What User Should Do
                            </p>
                            <p className="text-slate-700">{step.whatUserDoes}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-extrabold text-[#8E44AD] uppercase text-[10px] tracking-wider mb-1">
                              Status Transition
                            </p>
                            <p className="text-slate-600">
                              Before: <span className="font-bold text-slate-800">{step.statusBefore}</span>
                            </p>
                            <p className="text-slate-600 mt-0.5">
                              Action: <span className="font-bold text-[#014582]">{step.action}</span>
                            </p>
                            <p className="text-slate-600 mt-0.5">
                              After: <span className="font-bold text-emerald-700">{step.statusAfter}</span>
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-extrabold text-[#D97706] uppercase text-[10px] tracking-wider mb-1">
                              Inventory Effect
                            </p>
                            <p className="font-bold text-slate-800">{step.inventoryEffect}</p>
                            {step.accountingEffect && (
                              <p className="text-slate-500 mt-1 text-[11px]">
                                Accounting: {step.accountingEffect}
                              </p>
                            )}
                          </div>
                        </div>

                        {step.whenWrong && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold text-[11px] uppercase tracking-wider">
                                Watch Out / Common Mistake
                              </p>
                              <p className="mt-0.5 text-xs">{step.whenWrong}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-slate-500 font-medium">{step.next}</span>
                          {step.openScreen && <OpenScreen href={step.openScreen} />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. MASTER DATA */}
        {activeTab === 'masterdata' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="System Architecture"
              title="Master Data & Core Entities"
              desc="Detailed breakdown of Products, Warehouses, Work Centers, Machines, BOMs, and Routings."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="1. Product (Warehouse & Manufacturing)">
                <p className="text-xs text-slate-600 mb-3">
                  Products are created in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#014582]">Warehouse → Products</code>. Manufacturing selects products from this catalog for BOM components, finished goods, scrap, and by-products.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-[#014582]">Actual Fields Available:</p>
                  <p className="text-slate-700">• Product Name, SKU, Category, Cost Price, Selling Price</p>
                  <p className="text-slate-700">• Stock Unit (pcs, KG, L), Reorder Point, Lead Time</p>
                  <p className="text-slate-700">• Batch Managed flag, Country of Origin, Supplier & Supplier SKU</p>
                </div>
              </SectionCard>

              <SectionCard title="2. Warehouse Locations">
                <p className="text-xs text-slate-600 mb-3">
                  Warehouses define physical stock locations. A production order specifies three key warehouse roles:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  <li><span className="font-bold">Source Warehouse:</span> Where raw materials are reserved and issued from.</li>
                  <li><span className="font-bold">WIP Warehouse:</span> Location for work-in-progress inventory.</li>
                  <li><span className="font-bold">Finished Goods (FG) Warehouse:</span> Where final produced items enter stock upon completion.</li>
                </ul>
              </SectionCard>

              <SectionCard title="3. Work Center">
                <p className="text-xs text-slate-600 mb-3">
                  Represents a production line, department, or area (e.g. Cutting Line, Assembly Bench).
                </p>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-[#014582]">Fields & Cost Impact:</p>
                  <p className="text-slate-700">• Name, Code, Department, Factory, Capacity / hour</p>
                  <p className="text-slate-700">• Cost Per Hour (directly drives labor cost calculations in routing operations)</p>
                  <p className="text-slate-700">• Status: Active / Inactive / Maintenance</p>
                </div>
              </SectionCard>

              <SectionCard title="4. Machine">
                <p className="text-xs text-slate-600 mb-3">
                  Physical machine linked to a Work Center. Multiple machines can belong to a Work Center.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-[#014582]">Fields & Maintenance:</p>
                  <p className="text-slate-700">• Machine Name, Code, Serial Number, Model, Manufacturer</p>
                  <p className="text-slate-700">• Work Center link (searchable picker)</p>
                  <p className="text-slate-700">• Hourly Operating Cost (feeds machine costing)</p>
                  <p className="text-slate-700">• Status: Idle / Running / Maintenance / Breakdown / Offline</p>
                </div>
              </SectionCard>

              <SectionCard title="5. BOM (Bill of Materials) — WHAT is required">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#014582] font-bold">
                    BOM = Recipe / Material Requirement per 1 Finished Unit
                  </div>
                  <p className="text-slate-700">
                    Header: Finished Product picker, Version (default 1.0), Status (Draft / Active).
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-slate-800">Component Line Fields:</p>
                    <p className="text-slate-700">• Component Product (picker)</p>
                    <p className="text-slate-700">• Quantity (per 1 unit of finished product)</p>
                    <p className="text-slate-700">• Unit of Measure (UoM)</p>
                    <p className="text-slate-700">• Scrap % (extra material required for wastage)</p>
                    <p className="text-slate-700">• Operation Sequence & Estimated Cost</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="6. Routing — HOW it is produced">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[#8E44AD] font-bold">
                    Routing = Step-by-Step Operations / Process
                  </div>
                  <p className="text-slate-700">
                    Header: Product picker, Description, Version, Status (Active).
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-slate-800">Operation Step Fields:</p>
                    <p className="text-slate-700">• Operation Name & Sequence (1, 2, 3...)</p>
                    <p className="text-slate-700">• Work Center (required) & Machine (optional)</p>
                    <p className="text-slate-700">• Setup Time (min), Run Time / unit (min), Queue Time (min)</p>
                    <p className="text-slate-700">• Labor requirement (workers count) & Quality Checkpoint flag</p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Distinction Card */}
            <SectionCard title="BOM vs ROUTING — Fundamental Distinction">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#014582]/10 border border-[#014582]/30 rounded-xl">
                  <h4 className="font-black text-[#014582] text-sm mb-1">BOM = WHAT MATERIAL</h4>
                  <p className="text-slate-700">
                    Defines raw materials, quantities, scrap percentages, and component costs required to produce the product.
                  </p>
                </div>
                <div className="p-4 bg-purple-100/60 border border-purple-300 rounded-xl">
                  <h4 className="font-black text-[#8E44AD] text-sm mb-1">ROUTING = HOW PRODUCED</h4>
                  <p className="text-slate-700">
                    Defines sequence of physical operations, work centers, machines, setup/run times, labor requirements, and inspection steps.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 4. LIFECYCLE */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="State Machine"
              title="Production Order Status Lifecycle"
              desc="Comprehensive guide to every status implemented in Bisonstechs ERP."
            />

            <div className="bg-white rounded-2xl border border-[#DDE4EE] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EDF5] text-[#014582] font-black uppercase text-[10px] tracking-wider">
                      <th className="p-4">Status</th>
                      <th className="p-4">Meaning</th>
                      <th className="p-4">How Reached</th>
                      <th className="p-4">Allowed Actions</th>
                      <th className="p-4">Inventory Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ORDER_STATUSES.map((st) => (
                      <tr key={st.name} className="hover:bg-slate-50">
                        <td className="p-4 font-bold whitespace-nowrap">
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white"
                            style={{ backgroundColor: st.color }}
                          >
                            {st.name}
                          </span>
                        </td>
                        <td className="p-4">{st.meaning}</td>
                        <td className="p-4 font-medium text-slate-900">{st.reachedBy}</td>
                        <td className="p-4 text-emerald-700 font-semibold">{st.canDo}</td>
                        <td className="p-4 font-bold">{st.inventory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. INVENTORY EFFECT TABLE */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Real-time Stock Impact"
              title="Inventory Effect Reference Table"
              desc="Exact stock movement and reservation behavior for every action in the manufacturing flow."
            />

            <div className="bg-white rounded-2xl border border-[#DDE4EE] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EDF5] text-[#014582] font-black uppercase text-[10px] tracking-wider">
                      <th className="p-4">Action</th>
                      <th className="p-4">Raw Material Stock</th>
                      <th className="p-4">Finished Goods Stock</th>
                      <th className="p-4">Reservation</th>
                      <th className="p-4">Status Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold">Create MO</td>
                      <td className="p-4 text-slate-500">No change</td>
                      <td className="p-4 text-slate-500">No change</td>
                      <td className="p-4 text-slate-500">No reservation</td>
                      <td className="p-4 font-bold text-slate-700">Draft</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-purple-700">Release Order</td>
                      <td className="p-4">Available stock drops; On-hand unchanged</td>
                      <td className="p-4 text-slate-500">No change</td>
                      <td className="p-4 font-bold text-purple-700">Reserved stock increases</td>
                      <td className="p-4 font-bold text-purple-700">Released</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-rose-700">Issue Material</td>
                      <td className="p-4 font-bold text-rose-700">Stock OUT (On-hand decreases)</td>
                      <td className="p-4 text-slate-500">No change</td>
                      <td className="p-4 text-purple-700">Reserved stock decreases</td>
                      <td className="p-4 font-bold text-blue-700">Materials Issued</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-blue-700">Start / Operations</td>
                      <td className="p-4 text-slate-500">Shop-floor activity (issued)</td>
                      <td className="p-4 text-slate-500">No automatic FG receipt yet</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 font-bold text-blue-700">In Progress</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-emerald-700">Receive FG</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 font-bold text-emerald-700">Stock IN (FG On-hand increases)</td>
                      <td className="p-4 text-emerald-700">Remaining reservations released if full</td>
                      <td className="p-4 font-bold text-emerald-700">Completed / Partially Completed</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-amber-700">Scrap Record</td>
                      <td className="p-4">Wastage logged & cost recorded</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 font-bold text-amber-700">Scrap Logged</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-teal-700">By-product Receive</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 font-bold text-teal-700">By-product Stock IN increases</td>
                      <td className="p-4 text-slate-500">—</td>
                      <td className="p-4 font-bold text-teal-700">By-product Received</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-orange-700">Close Short</td>
                      <td className="p-4 text-slate-500">Remaining reservations released</td>
                      <td className="p-4 text-slate-500">No new FG</td>
                      <td className="p-4 font-bold text-emerald-700">Remaining reservations released</td>
                      <td className="p-4 font-bold text-orange-700">Closed Short</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. BUTTON-BY-BUTTON GUIDE */}
        {activeTab === 'buttons' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Action Directory"
              title="Button-by-Button Operating Guide"
              desc="Exact triggers, prerequisites, status transitions, inventory effects, and next steps for every button in the manufacturing interface."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'New Order', screen: 'Production Orders list', when: 'Creating a new production job.', does: 'Opens order creation form with auto-filled BOM and Routing defaults.', status: 'Draft', inv: 'None', next: 'Fill planned quantity & warehouses, then click Create Order.' },
                { name: 'Release', screen: 'Production Order workspace', when: 'Material & shop floor are ready to start production.', does: 'Explodes BOM into material reservations, creates Work Orders from Routing, creates WIP record.', status: 'Released', inv: 'Reserves stock in Source Warehouse.', next: 'Issue materials to shop floor.' },
                { name: 'Issue Selected Lines', screen: 'Production Order → Materials tab', when: 'Physically issuing raw materials to the factory line.', does: 'Issues selected lines in one atomic transaction, updates issued quantity, decreases raw material stock.', status: 'Materials Issued / In Progress', inv: 'Stock OUT from Source Warehouse.', next: 'Start production operations.' },
                { name: 'Start', screen: 'Production Order / Work Order card', when: 'Shop floor begins processing an operation.', does: 'Marks Work Order / Production Order as active with actual start date.', status: 'In Progress', inv: 'None (materials already issued).', next: 'Report operation output.' },
                { name: 'Report', screen: 'Work Orders / Operations tab', when: 'Reporting completed good, scrap, rejected, or downtime on an operation.', does: 'Updates operation completion quantity and logs scrap/rejected units.', status: 'In Progress', inv: 'None.', next: 'Complete operation step.' },
                { name: 'Complete & Receive FG', screen: 'Production Order → Output tab', when: 'Finished goods are produced and ready to enter warehouse stock.', does: 'Receives good quantity into FG Warehouse, updates produced/remaining quantity, releases remaining raw reservations if completed.', status: 'Completed (if remaining=0) or Partially Completed', inv: 'Stock IN to Finished Goods Warehouse.', next: 'Perform final quality check or press Close.' },
                { name: 'Close Short', screen: 'Production Order workspace header', when: 'Business decides not to produce the remaining planned quantity.', does: 'Prompts for mandatory reason, sets status to Closed Short, releases all remaining raw reservations.', status: 'Closed Short (Terminal)', inv: 'Releases remaining raw reservations.', next: 'Journey finished for this order.' },
                { name: 'Close', screen: 'Production Order workspace header', when: 'Order is Completed and books/records need to be locked.', does: 'Locks the Completed order permanently.', status: 'Closed (Terminal)', inv: 'None.', next: 'No further actions allowed.' },
                { name: 'Cancel', screen: 'Production Order workspace header', when: 'Order is aborted before completion.', does: 'Cancels order and releases any active material reservations.', status: 'Cancelled (Terminal)', inv: 'Releases active material reservations.', next: 'Order cancelled.' },
                { name: 'Hold / Pause', screen: 'Production Order / Work Order header', when: 'Production is temporarily paused due to breakdown or bottleneck.', does: 'Pauses active execution.', status: 'Paused', inv: 'None.', next: 'Click Resume when ready.' },
                { name: 'Resume', screen: 'Production Order / Work Order header', when: 'Resuming a paused order.', does: 'Restores active execution state.', status: 'In Progress', inv: 'None.', next: 'Continue operations.' },
                { name: 'Save Inspection', screen: 'Quality → Inspections', when: 'Logging quality parameter results.', does: 'Evaluates parameters against standards ± tolerance and saves result.', status: 'Passed / Failed / Rework / Scrap', inv: 'None.', next: 'Receive FG if passed, or create Rework if failed.' },
              ].map((btn) => (
                <div key={btn.name} className="bg-white p-5 rounded-2xl border border-[#DDE4EE] shadow-sm space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#014582] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      Button: {btn.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{btn.screen}</span>
                  </div>
                  <p className="text-slate-700 font-medium">WHEN: {btn.when}</p>
                  <p className="text-slate-600">WHAT IT DOES: {btn.does}</p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px]">
                    <div><span className="font-bold text-slate-700">Status:</span> {btn.status}</div>
                    <div><span className="font-bold text-slate-700">Inventory:</span> {btn.inv}</div>
                  </div>
                  <p className="text-[#0FA3E0] font-bold">NEXT: {btn.next}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. USER DECISION GUIDE */}
        {activeTab === 'decisions' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Troubleshooting & Decisions"
              title="User Decision Guide — If This Happens → Do This"
              desc="Quick operational rules for resolving real shop-floor situations."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DECISIONS.map((dec) => (
                <div
                  key={dec.id}
                  className={`p-5 rounded-2xl border shadow-sm space-y-2 text-xs ${
                    dec.tone === 'danger'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : dec.tone === 'warn'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    IF: {dec.unless}
                  </div>
                  <p className="font-semibold text-slate-800">→ DO THIS: {dec.then}</p>
                  {dec.openScreen && <OpenScreen href={dec.openScreen} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. TESTED SCENARIOS */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <SectionTitle
              kicker="Practical Examples"
              title="Tested Real-World Scenarios"
              desc="Five full real-world scenarios verified against the actual Bisonstechs ERP system implementation."
            />

            <div className="space-y-6">
              {/* Main End-to-End Example */}
              <SectionCard title="Main Full End-to-End Test (24 Steps)">
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-[#014582]">
                    Product: Finished Product A (10 Units) | BOM: Raw Material A (10 KG), Raw Material B (5 KG), Packaging Box (2 PCS)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-4 rounded-xl">
                    <li>Create products in Warehouse: Finished Product A, RM A, RM B, Packaging Box.</li>
                    <li>Create Supplier record in Purchases.</li>
                    <li>Create Purchase Order for RM A (100 KG), RM B (50 KG), Packaging Box (20 PCS).</li>
                    <li>Confirm Goods Receipt Note (GRN) → Stock IN to Raw Warehouse.</li>
                    <li>Verify warehouse stock: RM A = 100 KG, RM B = 50 KG, Packaging = 20 PCS available.</li>
                    <li>Create Work Center: Cutting & Assembly Line.</li>
                    <li>Create Machine: Machine-01 linked to Work Center.</li>
                    <li>Create BOM for Finished Product A with 3 component lines. Set Active.</li>
                    <li>Create Routing with 2 Operations (Cutting, Assembly). Set Active.</li>
                    <li>Create Production Order for 10 units of Finished Product A (Status: Draft).</li>
                    <li>Click Release → Material Reservations created (Reserved status).</li>
                    <li>Click Issue Selected Lines → Stock OUT from Raw Warehouse to Issued.</li>
                    <li>Start Production Order (Status: In Progress).</li>
                    <li>Operation 1 (Cutting): Start → Report 10 Good → Complete.</li>
                    <li>Operation 2 (Assembly): Start → Report 10 Good → Complete.</li>
                    <li>Output tab: Good Qty = 10, Remaining = 0.</li>
                    <li>Quality Inspection: Add Inspection → Passed.</li>
                    <li>Click Complete & Receive FG (Quantity = 10) → Stock IN to FG Warehouse.</li>
                    <li>Production Order Status becomes Completed.</li>
                    <li>Costing screen auto-calculates Material, Labor, Machine, Overhead, Unit Cost.</li>
                    <li>Click Close → Production Order Status becomes Closed.</li>
                  </ol>
                </div>
              </SectionCard>

              {/* Scenario 1-5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard title="Scenario 1: Full Production (10 / 10)">
                  <p className="text-xs text-slate-600 mb-2">
                    Planned 10 → Produced 10 → Receive 10 → Remaining 0 → Status: Completed.
                  </p>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                    Result: Order completed cleanly in one receipt. Remaining raw reservations released.
                  </div>
                </SectionCard>

                <SectionCard title="Scenario 2: Partial Production (15/20 → 5/20)">
                  <p className="text-xs text-slate-600 mb-2">
                    Planned 20 → First batch Good 15 → Receive 15 → Remaining 5 (Partially Completed) → Second batch Good 5 → Receive 5 → Remaining 0 → Status: Completed.
                  </p>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold">
                    Result: Continued on the SAME order without creating a duplicate order.
                  </div>
                </SectionCard>

                <SectionCard title="Scenario 3: Close Short (15/20 → Stop 5)">
                  <p className="text-xs text-slate-600 mb-2">
                    Planned 20 → Produced 15 → Remaining 5 → Click Close Short → Enter mandatory reason → Status: Closed Short.
                  </p>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-xs text-orange-900 font-bold">
                    Result: Order stopped short, reason logged in history, remaining reservations released.
                  </div>
                </SectionCard>

                <SectionCard title="Scenario 4: Good + Rejected + Scrap">
                  <p className="text-xs text-slate-600 mb-2">
                    Planned 20 → Good 15 + Rejected 3 + Scrap 2 → FG receives ONLY 15 Good units → Remaining 5 handles via second receipt or Close Short.
                  </p>
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 font-bold">
                    Result: Rejected & Scrap logged without inflating Good FG inventory.
                  </div>
                </SectionCard>

                <SectionCard title="Scenario 5: Quality Failure & Rework">
                  <p className="text-xs text-slate-600 mb-2">
                    10 Produced → Quality Inspection Failed → Create Rework (Pending → In Progress → Completed) → Re-inspect Passed → Receive FG → Order Completed.
                  </p>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs text-purple-900 font-bold">
                    Result: Full audit trail for defect recovery and extra rework costing.
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
