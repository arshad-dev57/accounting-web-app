'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  itemCount,
  loyaltyPoints,
  money,
  receiptBarcodeValue,
  receiptQrPngDataUrl,
  renderBarcodeSvg,
  resolveReceiptCompany,
  resolveReceiptMeta,
  type PosReceiptSale,
} from '../../../lib/pos-receipt';
import { loadPosSettings, loadReceiptTemplate, type PosReceiptTemplate } from '../../../lib/pos-settings';

export default function POSReceipt({
  sale,
  companyProfile,
  shift,
  template,
}: {
  sale: PosReceiptSale;
  companyProfile?: any;
  shift?: any;
  template?: PosReceiptTemplate;
}) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const settings = loadPosSettings();
  const tpl = template || loadReceiptTemplate();
  const company = resolveReceiptCompany(companyProfile, tpl);
  const meta = resolveReceiptMeta(sale, shift);
  const invoice = sale.invoiceNumber || 'RECEIPT';
  const items = sale.items || [];
  const payments = sale.payments || [];
  const points = loyaltyPoints(sale, settings);
  const soldAt = new Date(sale.createdAt || Date.now());
  const paperWidth = tpl.thermalPaperWidthMm === 58 ? 260 : 320;
  const barcodeValue = receiptBarcodeValue(sale);
  const qrDisplaySize = tpl.thermalPaperWidthMm === 58 ? 168 : 196;

  useEffect(() => {
    if (!tpl.showBarcode) return;
    if (barcodeRef.current) {
      renderBarcodeSvg(barcodeValue, barcodeRef.current);
    }
    let cancelled = false;
    void receiptQrPngDataUrl(sale, shift, 320).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [barcodeValue, sale, shift, tpl.showBarcode]);

  const wrap: CSSProperties = {
    width: paperWidth,
    maxWidth: '100%',
    margin: '0 auto',
    background: '#ffffff',
    color: '#111827',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  };
  const inner: CSSProperties = {
    padding: '16px 14px',
    fontSize: 11,
    lineHeight: 1.45,
  };
  const center: CSSProperties = { textAlign: 'center' };
  const muted: CSSProperties = { fontSize: 10, color: '#4b5563' };

  return (
    <div className="pos-receipt-paper" style={wrap}>
      <div style={inner}>
        {tpl.showLogo ? (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <img
              className="company-logo"
              src={company.logo || '/bisontechs.png'}
              alt={company.name}
              style={{ height: 56, maxWidth: 160, objectFit: 'contain', display: 'inline-block' }}
            />
          </div>
        ) : null}

        <div style={center}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {company.name}
          </div>
          {tpl.showAddress && company.address ? (
            <div style={{ ...muted, marginTop: 4 }}>{company.address}</div>
          ) : null}
          {tpl.showPhone && company.phone ? <div style={muted}>Tel: {company.phone}</div> : null}
          {tpl.showEmail && company.email ? <div style={muted}>{company.email}</div> : null}
          {tpl.showWebsite && company.website ? (
            <div style={muted}>{company.website.replace(/^https?:\/\//, '')}</div>
          ) : null}
          {tpl.showTaxId && company.taxId ? (
            <div style={{ ...muted, marginTop: 4, fontWeight: 700 }}>NTN / Tax ID: {company.taxId}</div>
          ) : null}
        </div>

        <Dash />
        <div style={{ ...center, fontWeight: 900, letterSpacing: 1.4, fontSize: 11 }}>
          {tpl.receiptHeader || 'TAX INVOICE / SALES RECEIPT'}
        </div>
        {tpl.copyLabel ? (
          <div style={{ ...center, fontSize: 9, color: '#6b7280', marginTop: 2 }}>{tpl.copyLabel}</div>
        ) : null}
        <Dash />

        <Row label="Receipt #" value={invoice} strong />
        <Row label="Date" value={soldAt.toLocaleDateString()} />
        <Row label="Time" value={soldAt.toLocaleTimeString()} />
        {tpl.showTerminal && meta.terminal ? (
          <Row
            label="Terminal"
            value={meta.terminalCode ? `${meta.terminal} (${meta.terminalCode})` : meta.terminal}
          />
        ) : null}
        {tpl.showCashier && meta.cashier ? <Row label="Cashier" value={meta.cashier} /> : null}
        {sale.status ? <Row label="Status" value={String(sale.status)} /> : null}

        <Dash />
        <div style={{ fontWeight: 700 }}>BILL TO</div>
        <div>{sale.customerName || 'Walk-in Customer'}</div>
        {sale.customerPhone ? <div>Phone: {sale.customerPhone}</div> : null}
        {sale.customerEmail ? <div>Email: {sale.customerEmail}</div> : null}

        <Dash />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontWeight: 700, borderBottom: '1px dashed #9ca3af' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0 0 4px', textAlign: 'left' }}>ITEM</td>
              <td style={{ padding: '0 0 4px', textAlign: 'center', width: 36 }}>QTY</td>
              <td style={{ padding: '0 0 4px', textAlign: 'right', width: 88 }}>AMOUNT</td>
            </tr>
          </tbody>
        </table>

        {items.map((item, i) => (
          <div key={i} style={{ margin: '8px 0' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{item.productName || 'Item'}</div>
            {tpl.showSku ? (
              <div style={muted}>
                {item.sku ? `SKU ${item.sku}` : 'SKU —'}
                {item.barcodeNumber ? `  ·  ${item.barcodeNumber}` : ''}
              </div>
            ) : null}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, color: '#4b5563' }}>
              <tbody>
                <tr>
                  <td style={{ paddingTop: 2, textAlign: 'left' }}>
                    {item.quantity || 0} × {money(item.unitPrice)}
                    {item.discount ? `  Disc ${item.discount}%` : ''}
                    {item.taxRate ? `  Tax ${item.taxRate}%` : ''}
                  </td>
                  <td style={{ paddingTop: 2, textAlign: 'center', width: 36 }}>{item.quantity || 0}</td>
                  <td style={{ paddingTop: 2, textAlign: 'right', width: 88, fontWeight: 700, color: '#111827' }}>
                    {money(item.lineTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <Dash />
        <Row label="No. of items" value={String(itemCount(sale))} />
        <Row label="Subtotal" value={money(sale.subtotal)} />
        {Number(sale.discountTotal) > 0 ? <Row label="Discount" value={`-${money(sale.discountTotal)}`} /> : null}
        {Number(sale.taxTotal) > 0 ? <Row label="Tax" value={money(sale.taxTotal)} /> : null}
        <Dash />
        <Row label="TOTAL" value={money(sale.grandTotal)} strong large />
        <Dash />

        <div style={{ fontWeight: 700, marginBottom: 4 }}>PAYMENT</div>
        {payments.length > 0 ? (
          payments.map((pmt, i) => (
            <Row
              key={i}
              label={pmt.reference ? `${pmt.paymentMethod} · ${pmt.reference}` : pmt.paymentMethod || 'Payment'}
              value={money(pmt.amount)}
            />
          ))
        ) : (
          <Row label="Paid" value={money(sale.paidAmount)} />
        )}
        <Row label="Amount paid" value={money(sale.paidAmount)} strong />
        {Number(sale.changeAmount) > 0 ? <Row label="Change due" value={money(sale.changeAmount)} /> : null}
        {tpl.showLoyalty && points > 0 ? <Row label="Loyalty points earned" value={String(points)} /> : null}
        {sale.notes ? (
          <>
            <Dash />
            <div style={{ fontSize: 10 }}>
              <span style={{ fontWeight: 700 }}>Notes: </span>
              {sale.notes}
            </div>
          </>
        ) : null}

        {tpl.showBarcode ? (
          <>
            <Dash />
            <div style={{ textAlign: 'center', padding: '8px 0 4px', overflow: 'hidden' }}>
              <svg
                ref={barcodeRef}
                style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }}
              />
            </div>
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              {qrUrl ? (
              <img
                  src={qrUrl}
                  alt={`QR ${invoice}`}
                  className="receipt-qr"
                  width={qrDisplaySize}
                  height={qrDisplaySize}
                  style={{
                    width: qrDisplaySize,
                    height: qrDisplaySize,
                    display: 'inline-block',
                    imageRendering: 'pixelated',
                  }}
                />
              ) : null}
            </div>
            <div style={{ ...center, fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
              Barcode = receipt # · QR = sale details
            </div>
          </>
        ) : null}

        <Dash />
        {tpl.receiptReturnPolicy ? (
          <div style={{ ...center, fontSize: 9, color: '#374151', whiteSpace: 'pre-wrap' }}>
            {tpl.receiptReturnPolicy}
          </div>
        ) : null}
        {tpl.receiptNotes ? (
          <div style={{ ...center, fontSize: 9, color: '#4b5563', marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {tpl.receiptNotes}
          </div>
        ) : null}
        {tpl.receiptFooter ? (
          <div style={{ ...center, fontWeight: 700, marginTop: 12 }}>{tpl.receiptFooter}</div>
        ) : null}
        {tpl.servedByPrefix ? (
          <div style={{ ...center, fontSize: 9, color: '#6b7280', marginTop: 8 }}>
            {tpl.servedByPrefix} {meta.cashier || 'our team'}
          </div>
        ) : null}
        <div style={{ ...center, fontSize: 9, color: '#9ca3af', marginTop: 4 }}>
          Generated {new Date().toLocaleString()}
        </div>
        {tpl.poweredBy ? (
          <div style={{ ...center, fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{tpl.poweredBy}</div>
        ) : null}
      </div>
    </div>
  );
}

function Dash() {
  return (
    <div
      style={{
        borderTop: '1px dashed #9ca3af',
        margin: '10px 0',
      }}
    />
  );
}

function Row({
  label,
  value,
  strong,
  large,
}: {
  label: string;
  value: string;
  strong?: boolean;
  large?: boolean;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: large ? 13 : 11, fontWeight: strong ? 700 : 400 }}>
      <tbody>
        <tr>
          <td style={{ textAlign: 'left', padding: '1px 8px 1px 0', verticalAlign: 'top' }}>{label}</td>
          <td style={{ textAlign: 'right', padding: '1px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}