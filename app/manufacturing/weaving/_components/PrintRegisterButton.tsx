'use client';

import { Printer } from 'lucide-react';
import { MfgButton } from '@/manufacturing/ui';

/** Shared print styles for Munshi register sheets — hide chrome, keep tables. */
export const WEAVING_PRINT_STYLES = `
.weaving-print-only { display: none !important; }
@media print {
  body * { visibility: hidden !important; }
  .weaving-print-root,
  .weaving-print-root * { visibility: visible !important; }
  .weaving-print-root {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 12mm !important;
    background: white !important;
  }
  .no-print { display: none !important; }
  .weaving-print-only { display: block !important; }
  .weaving-print-root table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 11px !important;
  }
  .weaving-print-root th,
  .weaving-print-root td {
    border: 1px solid #333 !important;
    padding: 4px 6px !important;
    color: #000 !important;
  }
  .weaving-print-root th {
    background: #f0f0f0 !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 9px !important;
  }
  .weaving-print-title {
    font-size: 16px !important;
    font-weight: 800 !important;
    margin-bottom: 4px !important;
  }
  .weaving-print-meta {
    font-size: 11px !important;
    margin-bottom: 12px !important;
  }
  .weaving-print-sign {
    margin-top: 28px !important;
    display: flex !important;
    justify-content: space-between !important;
    font-size: 11px !important;
  }
}
`;

export function PrintRegisterButton({ label = 'Print Register Sheet' }: { label?: string }) {
  return (
    <MfgButton
      variant="secondary"
      className="no-print"
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
    >
      <Printer className="h-4 w-4" />
      {label}
    </MfgButton>
  );
}

export function PrintRegisterChrome({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="weaving-print-only mb-4">
      <div className="weaving-print-title">{title}</div>
      {subtitle && <div className="weaving-print-meta">{subtitle}</div>}
      <div className="weaving-print-meta">
        Printed: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export function PrintSignOff() {
  return (
    <div className="weaving-print-only weaving-print-sign">
      <div>Munshi / Accountant ________________</div>
      <div>Checked by ________________</div>
      <div>Date ________________</div>
    </div>
  );
}
