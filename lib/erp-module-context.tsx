'use client';

import React, { createContext, useContext } from 'react';

export type ErpModuleKey = 'sales' | 'purchases' | 'trading' | 'warehouse' | 'accounting';

type ErpModuleContextValue = {
  module: ErpModuleKey;
  /** Optional override for page chrome title (e.g. "Trading Sales Orders") */
  pageTitle?: string;
};

const ErpModuleContext = createContext<ErpModuleContextValue>({ module: 'sales' });

export function ErpModuleProvider({
  module,
  pageTitle,
  children,
}: {
  module: ErpModuleKey;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ErpModuleContext.Provider value={{ module, pageTitle }}>
      {children}
    </ErpModuleContext.Provider>
  );
}

export function useErpModule() {
  return useContext(ErpModuleContext);
}

/**
 * Thin chrome when embedding Sales/Purchase forms inside Trading (or other modules).
 * Keeps the shared form/flow unchanged; only the module-facing title changes.
 */
export function ModulePageChrome({
  title,
  sharedFrom,
  children,
}: {
  title: string;
  sharedFrom: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <h1 className="text-sm font-bold text-slate-900">{title}</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {sharedFrom} workflow (create, approve, post) — Trading module view
        </p>
      </div>
      {children}
    </div>
  );
}
