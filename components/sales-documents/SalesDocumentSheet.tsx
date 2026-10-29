'use client';

import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import type { PdfBranding } from '@/lib/pdf-branding';
import type { CompanyContactInfo } from '@/lib/company-contact';
import type { SalesDocument } from '@/lib/sales-document';
import { useCurrency } from '@/lib/currency-context';

type Props = {
  doc: SalesDocument;
  branding: PdfBranding | null;
  companyContact?: CompanyContactInfo | null;
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '5px 6px',
  fontSize: 8,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #d6dee8',
  color: '#475569',
  fontWeight: 700,
  background: '#f4f7fb',
};

const td: React.CSSProperties = {
  padding: '5px 6px',
  fontSize: 9,
  borderBottom: '1px solid #e8edf3',
  color: '#1f2937',
  verticalAlign: 'top',
};

const num: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' };

const TABLE_MARGIN_BOTTOM = 12;

function StatusChip({ value }: { value: string }) {
  const normalized = String(value || '').toLowerCase();
  let bg = '#eef2f7';
  let color = '#475569';
  if (normalized.includes('paid') || normalized.includes('deliver') || normalized.includes('post')) {
    if (!normalized.includes('partial') && !normalized.includes('unpaid')) {
      bg = '#e7f6ec';
      color = '#166534';
    }
  }
  if (normalized.includes('partial')) {
    bg = '#fff5e5';
    color = '#9a5b00';
  }
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('process')) {
    bg = '#e8f1fb';
    color = '#14508a';
  }
  if (normalized.includes('cancel') || normalized.includes('overdue') || normalized.includes('unpaid')) {
    bg = '#fdecec';
    color = '#a61b1b';
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 8,
        fontWeight: 700,
      }}
    >
      {value || '—'}
    </span>
  );
}

export const SalesDocumentSheet = forwardRef<HTMLDivElement, Props>(
  function SalesDocumentSheet({ doc: data, branding, companyContact }, ref) {
    const { formatAmount } = useCurrency();
    const measureRef = useRef<HTMLDivElement>(null);
    const [pageSlices, setPageSlices] = useState<number[][]>([[0]]);

    const accent = branding?.accentColor || '#014582';
    const companyName =
      branding?.showCompanyName !== false ? branding?.companyName?.trim() || 'Company' : '';
    const companyAddress =
      branding?.showAddress !== false ? branding?.companyAddress?.trim() || '' : '';
    const logo = branding?.showLogo !== false ? branding?.logoDataUrl : undefined;
    const footerText = branding?.footerText?.trim() || '';
    const signature = branding?.showSignature !== false ? branding?.signatureDataUrl : undefined;

    const money = (value: number) => formatAmount(Number(value) || 0);
    const qty = (value: number) => (Number(value) || 0).toLocaleString();

    const isDelivery = data.kind === 'delivery';
    const columns = isDelivery
      ? [
          { key: '#', label: '#', style: { width: '6%' } as React.CSSProperties },
          { key: 'description', label: 'Description', style: {} },
          { key: 'sku', label: 'SKU', style: { width: '16%' } },
          { key: 'unit', label: 'Unit', style: { width: '9%' } },
          { key: 'ordered', label: 'Ordered', style: num },
          { key: 'delivered', label: 'Delivered', style: num },
          { key: 'remaining', label: 'Remaining', style: num },
        ]
      : [
          { key: '#', label: '#', style: { width: '5%' } as React.CSSProperties },
          { key: 'description', label: 'Description', style: {} },
          { key: 'sku', label: 'SKU', style: { width: '15%' } },
          { key: 'qty', label: 'Qty', style: num },
          { key: 'rate', label: 'Rate', style: num },
          { key: 'disc', label: 'Disc', style: num },
          { key: 'tax', label: 'Tax', style: num },
          { key: 'amount', label: 'Amount', style: num },
        ];

    const cellValue = (item: SalesDocument['items'][number], key: string): string => {
      switch (key) {
        case 'sku':
          return item.sku || '—';
        case 'unit':
          return item.unit || '—';
        case 'qty':
          return qty(item.quantity);
        case 'rate':
          return money(Number(item.rate) || 0);
        case 'disc':
          return item.discount ? `${item.discount}%` : '—';
        case 'tax':
          return item.taxRate ? `${item.taxRate}%` : '—';
        case 'amount':
          return money(Number(item.amount) || 0);
        case 'ordered':
          return qty(Number(item.orderedQuantity) || 0);
        case 'delivered':
          return qty(Number(item.deliveredQuantity) || 0);
        case 'remaining':
          return qty(Number(item.remainingQuantity) || 0);
        default:
          return '';
      }
    };

    const renderHeader = () => {
      const contactLines = [
        companyContact?.phone ? `Tel: ${companyContact.phone}` : '',
        companyContact?.email ? `Email: ${companyContact.email}` : '',
        companyContact?.website ? companyContact.website : '',
      ].filter(Boolean);
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt="Company logo"
                  style={{ width: 58, height: 58, objectFit: 'contain' }}
                />
              ) : null}
              <div>
                {companyName ? (
                  <div style={{ fontSize: 16, fontWeight: 800, color: accent }}>{companyName}</div>
                ) : null}
                {companyAddress ? (
                  <div
                    style={{
                      fontSize: 8.5,
                      color: '#64748b',
                      whiteSpace: 'pre-line',
                      maxWidth: 260,
                    }}
                  >
                    {companyAddress}
                  </div>
                ) : null}
                {contactLines.length ? (
                  <div style={{ fontSize: 7.5, color: '#64748b', marginTop: 2, maxWidth: 280 }}>
                    {contactLines.join('  •  ')}
                  </div>
                ) : null}
                {companyContact?.taxRegistrationNumber ? (
                  <div style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
                    Tax Reg. #: {companyContact.taxRegistrationNumber}
                  </div>
                ) : null}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: accent, letterSpacing: 0.5 }}>
                {data.title}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', marginTop: 2 }}>
                {data.number}
              </div>
              <div style={{ fontSize: 8.5, color: '#475569', marginTop: 3 }}>
                Date: {data.date ? new Date(data.date).toLocaleDateString('en-GB') : '—'}
              </div>
              <div style={{ marginTop: 5 }}>
                <StatusChip value={data.status} />
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: accent, margin: '10px 0 12px' }} />
        </>
      );
    };

    const renderBillTo = () => (
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1.3 }}>
          <div
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            Bill To
          </div>
          <div style={{ fontSize: 12, fontWeight: 800 }}>{data.party.name}</div>
          {data.party.company && data.party.company !== data.party.name ? (
            <div style={{ fontSize: 9, color: '#334155' }}>{data.party.company}</div>
          ) : null}
          <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.5, marginTop: 2 }}>
            {data.party.accountNumber ? <div>Account #: {data.party.accountNumber}</div> : null}
            {data.party.phone ? <div>Phone: {data.party.phone}</div> : null}
            {data.party.email ? <div>Email: {data.party.email}</div> : null}
            {data.party.taxId ? <div>Tax ID: {data.party.taxId}</div> : null}
            {data.party.billingAddress ? <div>Address: {data.party.billingAddress}</div> : null}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Document Details
          </div>
          <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.6 }}>
            {data.meta.map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: '#64748b' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>
                  {row.value}
                </span>
              </div>
            ))}
            {data.paymentStatus ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: '#64748b' }}>Payment</span>
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{data.paymentStatus}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );

    const renderTable = (itemIndexes: number[], measure = false) => (
      <table
        data-measure-table={measure ? 'true' : undefined}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          marginBottom: TABLE_MARGIN_BOTTOM,
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ ...th, ...column.style }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itemIndexes.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ ...td, textAlign: 'center', color: '#94a3b8' }}>
                No line items on this document
              </td>
            </tr>
          ) : (
            itemIndexes.map((itemIndex) => {
              const item = data.items[itemIndex];
              return (
                <tr key={`${item.sku || item.description}-${itemIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ ...td, ...column.style }}>
                      {column.key === '#'
                        ? itemIndex + 1
                        : column.key === 'description'
                          ? item.description
                          : cellValue(item, column.key)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );

    const renderRest = () => (
      <>
        <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            {data.notes ? (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Notes
                </div>
                <div style={{ fontSize: 8.5, color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {data.notes}
                </div>
              </div>
            ) : null}
            {data.terms ? (
              <div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Terms &amp; Conditions
                </div>
                <div style={{ fontSize: 8.5, color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {data.terms}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ width: '62mm' }}>
            {data.totals.map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '3px 0',
                  borderBottom: row.emphasize ? `1px solid ${accent}` : '1px solid #eef2f7',
                  fontSize: row.emphasize ? 10.5 : 9,
                  fontWeight: row.emphasize ? 800 : 500,
                  color: row.emphasize ? accent : '#334155',
                  marginTop: row.emphasize ? 3 : 0,
                }}
              >
                <span>{row.label}</span>
                <span>{row.format === 'quantity' ? qty(row.value) : money(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <div style={{ textAlign: 'center', minWidth: '60mm' }}>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signature}
                alt="Authorized signature"
                style={{ height: 46, objectFit: 'contain', marginBottom: 2 }}
              />
            ) : (
              <div style={{ height: 34 }} />
            )}
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 8.5, color: '#475569' }}>
              Authorized Signature
            </div>
          </div>
        </div>
      </>
    );

    const renderFooter = (pageIndex: number, pageCount: number) => (
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 6,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 7.5,
          color: '#94a3b8',
        }}
      >
        <span>{footerText || 'Thank you for your business.'}</span>
        <span>
          Page {pageIndex + 1} of {pageCount} · Generated {new Date().toLocaleString('en-GB')}
        </span>
      </div>
    );

    const renderMeasurement = () => (
      <div
        ref={measureRef}
        data-sheet-measure="true"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '210mm',
          padding: '12mm',
          boxSizing: 'border-box',
          background: '#ffffff',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        {renderHeader()}
        {renderBillTo()}
        {renderTable(data.items.map((_, index) => index), true)}
        {renderRest()}
        <div style={{ marginTop: 14, paddingTop: 6, borderTop: '1px solid #e2e8f0', fontSize: 7.5, color: '#94a3b8' }}>
          <span>{footerText || 'Thank you for your business.'}</span>
        </div>
      </div>
    );

    useLayoutEffect(() => {
      const measureEl = measureRef.current;
      if (!measureEl) return;
      const tableEl = measureEl.querySelector<HTMLTableElement>('[data-measure-table]');
      if (!tableEl) return;

      const measureRect = measureEl.getBoundingClientRect();
      const mmToPx = measureRect.width / 210;
      const pageH = mmToPx * 297;
      const paddingPx = mmToPx * 12;
      const contentH = pageH - paddingPx * 2;

      const tableTop = tableEl.getBoundingClientRect().top - measureRect.top;
      const theadH = tableEl.querySelector('thead')?.getBoundingClientRect().height || 0;
      const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
      const rowHs = rows.map((row) => row.getBoundingClientRect().height);
      const restH =
        measureEl.scrollHeight - (tableEl.getBoundingClientRect().bottom - measureRect.top);
      const footerH = 22;
      const continuedReserve = 18;

      const headerBlockH = tableTop;
      const theadAndMargin = theadH + TABLE_MARGIN_BOTTOM;

      // Capacity for a page whose rows will NOT be followed by the summary block.
      const plainCapacity = contentH - headerBlockH - footerH - continuedReserve - 2;
      // Capacity for the page that carries the summary block (totals/notes/signature/footer).
      const lastCapacity = contentH - headerBlockH - restH - 2;

      const sum = (indexes: number[]) => indexes.reduce((acc, i) => acc + (rowHs[i] || 0), 0);

      // Greedy split using the plain capacity.
      const chunks: number[][] = [];
      let start = 0;
      while (start < data.items.length) {
        let used = 0;
        let end = start;
        while (end < data.items.length && used + (rowHs[end] || 0) <= plainCapacity - theadAndMargin) {
          used += rowHs[end] || 0;
          end++;
        }
        if (end === start) end = start + 1; // row taller than a page — keep it alone
        chunks.push(data.items.slice(start, end).map((_, i) => start + i));
        start = end;
      }

      // The final chunk must also fit the summary block; rebalance if needed.
      let last = chunks[chunks.length - 1];
      let lastH = theadAndMargin + sum(last);
      if (lastH > lastCapacity && chunks.length > 1) {
        let previous = chunks[chunks.length - 2];
        let prevH = theadAndMargin + sum(previous);
        while (lastH > lastCapacity && last.length > 1) {
          const room = plainCapacity - prevH;
          let moved = 0;
          let moveH = 0;
          while (moved < last.length - 1 && moveH + (rowHs[last[moved]] || 0) <= room) {
            moveH += rowHs[last[moved]] || 0;
            moved++;
          }
          if (moved === 0) {
            // Previous page is full — the summary gets its own final page below.
            break;
          }
          const relocated = last.splice(0, moved);
          previous.push(...relocated);
          prevH += moveH;
          lastH = theadAndMargin + sum(last);
        }
      }

      if (lastH > lastCapacity && lastH <= plainCapacity) {
        // Summary block moves to its own page.
        chunks.push([]);
      }

      setPageSlices(chunks.length ? chunks : [data.items.map((_, i) => i)]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, branding, companyContact]);

    const pageCount = pageSlices.length;

    return (
      <div ref={ref}>
        {renderMeasurement()}
        {pageSlices.map((itemIndexes, pageIndex) => {
          const isLast = pageIndex === pageCount - 1;
          return (
            <div
              key={pageIndex}
              data-sheet-page="true"
              style={{
                width: '210mm',
                height: '297mm',
                overflow: 'hidden',
                background: '#ffffff',
                color: '#1f2937',
                fontFamily: 'Helvetica, Arial, sans-serif',
                padding: '12mm',
                boxSizing: 'border-box',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {renderHeader()}
              {renderBillTo()}
              {!(isLast && itemIndexes.length === 0) ? renderTable(itemIndexes) : null}
              {isLast ? (
                renderRest()
              ) : (
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: 7.5,
                    color: '#94a3b8',
                    paddingBottom: 4,
                  }}
                >
                  Continued on next page…
                </div>
              )}
              {renderFooter(pageIndex, pageCount)}
            </div>
          );
        })}
      </div>
    );
  }
);
