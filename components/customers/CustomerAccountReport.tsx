'use client';

import React, { forwardRef } from 'react';
import type { PdfBranding } from '../../lib/pdf-branding';
import {
  dateLabel,
  money,
  periodText,
  addressText,
  type CustomerAccountData,
} from '../../lib/customer-account';

type Props = {
  data: CustomerAccountData;
  branding: PdfBranding | null;
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
};

const td: React.CSSProperties = {
  padding: '5px 6px',
  fontSize: 9,
  borderBottom: '1px solid #e8edf3',
  color: '#1f2937',
  verticalAlign: 'top',
};

const right: React.CSSProperties = { textAlign: 'right' };

function StatusChip({ value }: { value: string }) {
  const normalized = String(value || '').toLowerCase();
  let bg = '#eef2f7';
  let color = '#475569';
  if (normalized.includes('deliver') && !normalized.includes('not') && !normalized.includes('partial')) {
    bg = '#e7f6ec';
    color = '#166534';
  } else if (normalized.includes('partial')) {
    bg = '#fff5e5';
    color = '#9a5b00';
  } else if (normalized.includes('pending') || normalized.includes('process')) {
    bg = '#e8f1fb';
    color = '#14508a';
  } else if (normalized.includes('not')) {
    bg = '#fdecec';
    color = '#a61b1b';
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
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

export const CustomerAccountReport = forwardRef<HTMLDivElement, Props>(
  function CustomerAccountReport({ data, branding }, ref) {
    const accent = branding?.accentColor || '#014582';
    const currency = data.company.currencySymbol || data.company.currencyCode || 'Rs.';
    const summary = data.summary;
    const companyName =
      branding?.showCompanyName !== false
        ? branding?.companyName?.trim() || data.company.name || 'Company'
        : data.company.name || '';
    const companyAddress =
      branding?.showAddress !== false
        ? branding?.companyAddress?.trim() || data.company.address || ''
        : data.company.address || '';
    const logo = branding?.showLogo !== false ? branding?.logoDataUrl : undefined;

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: '#ffffff',
          color: '#1f2937',
          fontFamily: 'Helvetica, Arial, sans-serif',
          padding: '12mm',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
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
                <div style={{ fontSize: 8.5, color: '#64748b', whiteSpace: 'pre-line', maxWidth: 260 }}>
                  {companyAddress}
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: accent }}>
              CUSTOMER ACCOUNT STATEMENT
            </div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
              Period: {periodText(data.period)}
            </div>
            <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
              Generated: {new Date().toLocaleString('en-GB')}
            </div>
          </div>
        </div>

        <div style={{ height: 2, background: accent, margin: '10px 0 12px' }} />

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1.4 }}>
            <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
              Customer
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{data.customer.name}</div>
            <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.5 }}>
              {data.customer.customerNumber ? <div>Account #: {data.customer.customerNumber}</div> : null}
              {data.customer.phone ? <div>Phone: {data.customer.phone}</div> : null}
              {data.customer.email ? <div>Email: {data.customer.email}</div> : null}
              {addressText(data.customer.billingAddress) || addressText(data.customer.address) ? (
                <div>Address: {addressText(data.customer.billingAddress) || addressText(data.customer.address)}</div>
              ) : null}
              {data.customer.taxId ? <div>Tax ID: {data.customer.taxId}</div> : null}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
              Account Terms
            </div>
            <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.55, marginTop: 2 }}>
              <div>Status: {data.customer.status || 'Active'}</div>
              <div>Credit Terms: {data.customer.creditTerms || 'Net 30'}</div>
              <div>Credit Limit: {money(data.customer.creditLimit, currency)}</div>
              <div>Salesperson: {data.customer.salesperson?.name || 'Unassigned'}</div>
              <div>Territory: {data.customer.territory || '—'}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {[
            ['Opening Balance', summary.openingBalance],
            ['Invoiced', summary.totalInvoiced],
            ['Received', summary.totalReceived],
            ['Credit Notes', summary.totalCredits],
            ['Closing Balance', summary.closingBalance],
            ['Outstanding', summary.totalOutstanding],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                padding: '6px 7px',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 7, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                {label}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: '#0f172a' }}>
                {money(Number(value), currency)}
              </div>
            </div>
          ))}
        </div>

        <SectionTitle accent={accent}>Order Summary — {summary.ordersCount} orders</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={th}>Order #</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={th}>Delivery</th>
              <th style={{ ...th, ...right }}>Total</th>
              <th style={{ ...th, ...right }}>Paid</th>
              <th style={{ ...th, ...right }}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.length === 0 ? (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: '#94a3b8' }} colSpan={7}>
                  No orders in this period
                </td>
              </tr>
            ) : (
              data.orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ ...td, fontWeight: 700 }}>{order.orderNumber}</td>
                  <td style={td}>{dateLabel(order.orderDate)}</td>
                  <td style={td}>
                    <StatusChip value={order.orderStatus} />
                  </td>
                  <td style={td}>
                    <StatusChip value={order.deliveryStatus} />
                  </td>
                  <td style={{ ...td, ...right }}>{money(order.grandTotal, currency)}</td>
                  <td style={{ ...td, ...right }}>{money(order.paid, currency)}</td>
                  <td style={{ ...td, ...right, fontWeight: 700 }}>
                    {money(order.remaining, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...td, fontWeight: 700 }} colSpan={4}>
                Totals
              </td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>{money(summary.ordersValue, currency)}</td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>{money(summary.ordersPaid, currency)}</td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>
                {money(summary.ordersRemaining, currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        <SectionTitle accent={accent}>Payments Received — {data.payments.length} entries</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={th}>Receipt #</th>
              <th style={th}>Date</th>
              <th style={th}>Method</th>
              <th style={th}>Reference</th>
              <th style={{ ...th, ...right }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.length === 0 ? (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: '#94a3b8' }} colSpan={5}>
                  No payments in this period
                </td>
              </tr>
            ) : (
              data.payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ ...td, fontWeight: 700 }}>{payment.paymentNumber}</td>
                  <td style={td}>{dateLabel(payment.paymentDate)}</td>
                  <td style={td}>{payment.paymentMethod || '—'}</td>
                  <td style={td}>{payment.reference || payment.bankAccountName || '—'}</td>
                  <td style={{ ...td, ...right }}>{money(payment.amount, currency)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...td, fontWeight: 700 }} colSpan={4}>
                Total Received
              </td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>{money(summary.totalReceived, currency)}</td>
            </tr>
          </tfoot>
        </table>

        <SectionTitle accent={accent}>Account Ledger</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Document</th>
              <th style={th}>Type</th>
              <th style={{ ...th, ...right }}>Debit</th>
              <th style={{ ...th, ...right }}>Credit</th>
              <th style={{ ...th, ...right }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td} colSpan={5}>
                <strong>Opening Balance</strong>
              </td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>
                {money(summary.openingBalance, currency)}
              </td>
            </tr>
            {data.ledger.length === 0 ? (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: '#94a3b8' }} colSpan={6}>
                  No ledger movement in this period
                </td>
              </tr>
            ) : (
              data.ledger.map((line, index) => (
                <tr key={`${line.documentNumber}-${index}`}>
                  <td style={td}>{dateLabel(line.date)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{line.documentNumber}</td>
                  <td style={td}>{line.documentType}</td>
                  <td style={{ ...td, ...right }}>{line.debit ? money(line.debit, currency) : '—'}</td>
                  <td style={{ ...td, ...right }}>{line.credit ? money(line.credit, currency) : '—'}</td>
                  <td style={{ ...td, ...right, fontWeight: 700 }}>
                    {money(line.runningBalance, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...td, fontWeight: 700 }} colSpan={3}>
                Closing Balance
              </td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>{money(summary.totalInvoiced, currency)}</td>
              <td style={{ ...td, ...right, fontWeight: 700 }}>{money(summary.totalReceived, currency)}</td>
              <td style={{ ...td, ...right, fontWeight: 800, color: accent }}>
                {money(summary.closingBalance, currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        {data.customer.notes ? (
          <div style={{ marginBottom: 10 }}>
            <SectionTitle accent={accent}>Notes</SectionTitle>
            <div style={{ fontSize: 8.5, color: '#475569', whiteSpace: 'pre-line' }}>
              {data.customer.notes}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
          <div style={{ fontSize: 8, color: '#94a3b8', maxWidth: 320 }}>
            {branding?.footerText || 'Confidential - For Internal Use Only'}
          </div>
          <div style={{ textAlign: 'center', minWidth: 180 }}>
            {branding?.showSignature !== false && branding?.signatureDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.signatureDataUrl}
                alt="Signature"
                style={{ height: 38, objectFit: 'contain', marginBottom: 2 }}
              />
            ) : (
              <div style={{ height: 38 }} />
            )}
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 8.5, color: '#475569' }}>
              {branding?.signatureLabel || 'Authorized Signature'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 7.5, color: '#94a3b8', textAlign: 'center' }}>
          This statement is generated from posted invoices, payments and credit notes for the selected period.
        </div>
      </div>
    );
  }
);

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: accent,
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: 3,
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  );
}
