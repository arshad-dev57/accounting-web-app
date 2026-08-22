'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { posTerminalService, posShiftService, posSaleService, asPosArray, asPosTotal } from '../../../lib/pos-service';
import { loadPosSettings, loadReceiptTemplate } from '../../../lib/pos-settings';
import { usePermissions } from '../../../lib/usePermissions';
import { useLocation } from '../../../lib/location-context';
import { locationService, type Location } from '../../../lib/location-service';
import LocationSelect from '../../../components/LocationSelect';
import { Download, Printer, Mail, Loader2, FileSpreadsheet, Calendar, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import POSReceipt from '../components/POSReceipt';
import {
  barcodePngDataUrl,
  downloadPosReceiptPdf,
  receiptBarcodeValue,
  receiptQrPngDataUrl,
  resolveReceiptCompany,
} from '../../../lib/pos-receipt';
import { printPosReceipt } from '../../../lib/pos-thermal-printer';
import ReceiptEditorTab from '../components/ReceiptEditorTab';
import ScannerSettingsTab from '../components/ScannerSettingsTab';
import ThermalPrinterTab from '../components/ThermalPrinterTab';
import PaymentTerminalTab from '../components/PaymentTerminalTab';
import { taxService } from '../../../lib/tax-service';
import TaxUseToggle from '../../../components/TaxUseToggle';

// ─── Utility styles ───────────────────────────────────────────────────────────
const card   = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'16px', padding:'20px', boxShadow:'0 1px 2px rgba(15,23,42,0.04)' };
const badge  = (color:string) => ({ display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:`${color}20`, color, border:`1px solid ${color}40` });
const input  = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'9px 14px', color:'#0f172a', fontSize:'14px', outline:'none' };
const btn    = (bg:string, c='#fff') => ({ padding:'9px 18px', borderRadius:'10px', border:'none', background:bg, color:c, cursor:'pointer', fontWeight:600, fontSize:'13px' });
const tHead  = { background:'#f8fafc', borderBottom:'1px solid #e5e7eb' };
const tCell  = { padding:'12px 16px', color:'#64748b', fontSize:'13px', borderBottom:'1px solid #e5e7eb' };

function emptyHint(label: string, locationIdForApi?: string) {
  return locationIdForApi
    ? `No ${label} for this location. Switch to All locations.`
    : `No ${label} found`;
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status:string }) {
  const map: Record<string,string> = { Active:'#059669', Inactive:'#dc2626', Open:'#059669', Closed:'#dc2626', Suspended:'#d97706', Completed:'#059669', Held:'#d97706', Cancelled:'#dc2626', Returned:'#014582' };
  return <span style={badge(map[status]||'#8b8fa8')}>{status}</span>;
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'16px', padding:'28px', width:'380px' }}>
        <p style={{ color:'#0f172a', marginBottom:'20px', lineHeight:'1.5' }}>{message}</p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button style={btn('#f1f5f9','#475569')} onClick={onCancel}>Cancel</button>
          <button style={btn('rgba(239,68,68,0.8)')} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = ['Terminals','Shifts','Sales','Returns','Receipt','Printer','Scanner','Payments','Tax','Audit Log'] as const;
type Tab = typeof TABS[number];

// ─── Terminals Tab ───────────────────────────────────────────────────────────
function TerminalsTab({
  isAdmin,
  locationIdForApi,
}: {
  isAdmin: boolean;
  locationIdForApi: string;
}) {
  const [terminals, setTerminals]         = useState<any[]>([]);
  const [locations, setLocations]         = useState<Location[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState({ name:'', code:'', locationId:'' });
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [confirm, setConfirm]             = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (locationIdForApi) qs.set('locationId', locationIdForApi);
      const r:any = await posTerminalService.list(qs.toString() || undefined);
      setTerminals(asPosArray(r));
      setError('');
    }
    catch(e:any){ setError(e.message); }
    finally { setLoading(false); }
  }, [locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    locationService.listCached().then(setLocations).catch(() => setLocations([]));
  }, []);

  const create = async () => {
    if (!form.name || !form.code) { setError('Name and Code are required'); return; }
    if (!form.locationId) { setError('Select a warehouse/shop location'); return; }
    setSaving(true); setError('');
    try {
      await posTerminalService.create(form);
      setShowCreate(false);
      setForm({ name: '', code: '', locationId: '' });
      await load();
    }
    catch(e:any){ setError(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (id:string, isActive:boolean) => {
    await posTerminalService.update(id, { isActive:!isActive });
    await load();
  };

  const softDelete = async (id:string) => {
    await posTerminalService.delete(id);
    setConfirm(null);
    await load();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#0f172a', margin:0, fontSize:'18px', fontWeight:700 }}>🖥️ Terminals ({terminals.length})</h2>
        {isAdmin && <button style={btn('#014582')} onClick={()=>setShowCreate(true)}>+ New Terminal</button>}
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'10px 14px', color:'#dc2626', fontSize:'13px', marginBottom:'14px' }}>{error}</div>}

      {showCreate && (
        <div style={{ ...card, marginBottom:'20px', border:'1px solid rgba(1,69,130,0.25)' }}>
          <h3 style={{ color:'#0f172a', marginTop:0, marginBottom:'16px', fontSize:'15px' }}>Create Terminal</h3>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' as const }}>
            <input style={{ ...input, flex:1, minWidth:'150px' }} placeholder="Terminal Name (e.g. Main Counter)" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            <input style={{ ...input, flex:1, minWidth:'120px' }} placeholder="Code (e.g. TERM-01)" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} />
            <select
              style={{ ...input, flex:1, minWidth:'180px' }}
              value={form.locationId}
              onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}
            >
              <option value="">Select location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id} style={{ color: '#111' }}>
                  {l.name} ({l.code}) · {l.type}
                </option>
              ))}
            </select>
            <button style={btn('#014582')} onClick={create} disabled={saving}>{saving?'Saving...':'Create'}</button>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color:'#64748b' }}>Loading...</p> : (
        <div style={{ overflowX:'auto' as const }}>
          <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
            <thead style={tHead}>
              <tr>{['Name','Code','Location','Status','Shifts','Last Sync','Actions'].map(h=><th key={h} style={{ ...tCell, color:'#64748b', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, textAlign:'left' as const }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {terminals.map((t:any) => (
                <tr key={t.id} style={{ transition:'background 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <td style={tCell}><span style={{ color:'#0f172a', fontWeight:600 }}>{t.name}</span></td>
                  <td style={tCell}><code style={{ background:'rgba(1,69,130,0.08)', color:'#014582', padding:'2px 8px', borderRadius:'6px', fontSize:'12px' }}>{t.code}</code></td>
                  <td style={tCell}>
                    {t.location?.name || '—'}
                    {t.location?.code ? (
                      <span style={{ color:'#64748b', marginLeft:6, fontSize:11 }}>({t.location.code})</span>
                    ) : null}
                  </td>
                  <td style={tCell}><StatusBadge status={t.isActive?'Active':'Inactive'} /></td>
                  <td style={tCell}>{t._count?.shifts || 0}</td>
                  <td style={tCell}>{t.lastSyncAt ? new Date(t.lastSyncAt).toLocaleString() : '—'}</td>
                  <td style={tCell}>
                    {isAdmin && (
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button style={btn(t.isActive?'rgba(220,38,38,0.1)':'rgba(5,150,105,0.1)', t.isActive?'#dc2626':'#059669')} onClick={()=>toggle(t.id,t.isActive)}>{t.isActive?'Disable':'Enable'}</button>
                        <button style={btn('rgba(220,38,38,0.1)','#dc2626')} onClick={()=>setConfirm(t.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {terminals.length === 0 && <tr><td colSpan={7} style={{ ...tCell, textAlign:'center', color:'#64748b', padding:'40px' }}>{emptyHint('terminals', locationIdForApi)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {confirm && <ConfirmModal message="Are you sure you want to delete this terminal? This cannot be undone." onConfirm={()=>softDelete(confirm)} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}

// ─── Shifts Tab ───────────────────────────────────────────────────────────────
function ShiftsTab({
  isAdmin,
  locationIdForApi,
}: {
  isAdmin: boolean;
  locationIdForApi: string;
}) {
  const [shifts, setShifts]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [selected, setSelected]   = useState<any>(null);
  const [error, setError]         = useState('');
  const LIMIT = 15;

  const load = useCallback(async (p:number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (locationIdForApi) params.set('locationId', locationIdForApi);
      const r:any = await posShiftService.getHistory(params.toString());
      const rows = asPosArray(r);
      setShifts(rows);
      setTotal(asPosTotal(r, rows));
      setError('');
    } catch (e: any) {
      setShifts([]);
      setTotal(0);
      setError(e?.message || 'Failed to load shifts');
    } finally { setLoading(false); }
  }, [locationIdForApi]);

  useEffect(() => { setPage(1); }, [locationIdForApi]);
  useEffect(() => { load(page); }, [load, page]);

  const reopen = async (shiftId:string) => {
    try { await posShiftService.reopen(shiftId); await load(page); setSelected(null); }
    catch(e:any){ alert(e.message); }
  };

  const diff = (d:number|undefined) => {
    if (d === undefined || d === null) return '—';
    const color = d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#8b8fa8';
    return <span style={{ color, fontWeight:600 }}>{d>0?'+':''}{d.toFixed(2)}</span>;
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#0f172a', margin:0, fontSize:'18px', fontWeight:700 }}>📋 Shift History ({total})</h2>
      </div>
      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'10px 14px', color:'#dc2626', fontSize:'13px', marginBottom:'14px' }}>{error}</div>}
      {loading ? <p style={{ color:'#64748b' }}>Loading...</p> : (
        <>
          <div style={{ overflowX:'auto' as const }}>
            <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
              <thead style={tHead}>
                <tr>{['Cashier','Terminal','Status','Opening Cash','Actual Cash','Difference','Opened At','Closed At','Actions'].map(h=><th key={h} style={{ ...tCell, color:'#64748b', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, textAlign:'left' as const }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {shifts.map((s:any) => (
                  <tr key={s.id} style={{ cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    onClick={()=>setSelected(s)}>
                    <td style={tCell}><span style={{ color:'#0f172a', fontWeight:600 }}>{s.cashier?.firstName} {s.cashier?.lastName}</span></td>
                    <td style={tCell}>{s.terminal?.name}</td>
                    <td style={tCell}><StatusBadge status={s.status} /></td>
                    <td style={tCell}>${s.openingCash?.toFixed(2)}</td>
                    <td style={tCell}>{s.actualCash!=null?`$${s.actualCash.toFixed(2)}`:'—'}</td>
                    <td style={tCell}>{diff(s.difference)}</td>
                    <td style={tCell}>{new Date(s.openedAt).toLocaleString()}</td>
                    <td style={tCell}>{s.closedAt?new Date(s.closedAt).toLocaleString():'—'}</td>
                    <td style={tCell}>
                      {isAdmin && s.status==='Closed' && (
                        <button style={btn('rgba(1,69,130,0.1)','#014582')} onClick={e=>{e.stopPropagation();reopen(s.id);}}>Reopen</button>
                      )}
                    </td>
                  </tr>
                ))}
                {shifts.length===0 && <tr><td colSpan={9} style={{ ...tCell, textAlign:'center', color:'#64748b', padding:'40px' }}>{emptyHint('shifts', locationIdForApi)}</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            <span style={{ color:'#64748b', fontSize:'13px', alignSelf:'center' }}>Page {page} of {Math.ceil(total/LIMIT)||1}</span>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/LIMIT)}>Next →</button>
          </div>
        </>
      )}

      {/* Shift Detail Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'28px', width:'460px', maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
              <h3 style={{ color:'#0f172a', margin:0, fontSize:'17px' }}>Shift Details</h3>
              <button onClick={()=>setSelected(null)} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer', fontSize:'20px' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {[
                ['Cashier', `${selected.cashier?.firstName} ${selected.cashier?.lastName}`],
                ['Terminal', selected.terminal?.name],
                ['Status', ''],
                ['Opening Cash', `$${selected.openingCash?.toFixed(2)}`],
                ['Expected Cash', selected.expectedCash!=null?`$${selected.expectedCash?.toFixed(2)}`:'—'],
                ['Actual Cash', selected.actualCash!=null?`$${selected.actualCash?.toFixed(2)}`:'—'],
                ['Difference', selected.difference!=null?`$${selected.difference?.toFixed(2)}`:'—'],
                ['Sales Count', selected._count?.sales||0],
                ['Opened At', new Date(selected.openedAt).toLocaleString()],
                ['Closed At', selected.closedAt?new Date(selected.closedAt).toLocaleString():'Still Open'],
              ].map(([label,val])=>(
                <div key={label as string} style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px' }}>
                  <div style={{ color:'#64748b', fontSize:'11px', marginBottom:'4px', textTransform:'uppercase' as const }}>{label}</div>
                  {label==='Status'?<StatusBadge status={selected.status}/>:<div style={{ color:'#0f172a', fontWeight:600, fontSize:'14px' }}>{val as string}</div>}
                </div>
              ))}
            </div>
            {selected.notes && <p style={{ color:'#64748b', fontSize:'13px', marginTop:'14px', background:'#ffffff', borderRadius:'8px', padding:'10px' }}>{selected.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ locationIdForApi }: { locationIdForApi: string }) {
  const [sales, setSales]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportRecords, setExportRecords] = useState<any[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const LIMIT = 15;

  // Load company profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = document.cookie.split('auth_token=')[1]?.split(';')[0];
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCompanyProfile(data.data);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, []);

  const load = useCallback(async (p:number, s:string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:String(p), limit:String(LIMIT) });
      if (s) params.set('status', s);
      if (locationIdForApi) params.set('locationId', locationIdForApi);
      const r:any = await posSaleService.list(params.toString());
      const rows = asPosArray(r);
      setSales(rows);
      setTotal(asPosTotal(r, rows));
    } catch {} finally { setLoading(false); }
  }, [locationIdForApi]);

  useEffect(() => { setPage(1); }, [locationIdForApi]);
  useEffect(() => { load(page, status); }, [load, page, status]);

  const openDetail = async (id:string) => {
    try { const r:any = await posSaleService.get(id); setSelected(r.data); }
    catch {}
  };

  const receiptPaperRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPDF = async () => {
    if (!selected) return;
    await downloadPosReceiptPdf({
      sale: selected,
      company: resolveReceiptCompany(companyProfile),
      settings: loadPosSettings(),
    });
  };

  // Send sale via email
  const handleSendEmail = async () => {
    if (!selected || !emailInput) {
      alert('Please enter an email address');
      return;
    }
    setSendingEmail(true);
    try {
      const token = document.cookie.split('auth_token=')[1]?.split(';')[0];
      const response = await fetch('/api/pos/send-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
          sale: selected,
          companyProfile,
          receiptMeta: {
            barcodeDataUrl: barcodePngDataUrl(receiptBarcodeValue(selected)),
            qrDataUrl: await receiptQrPngDataUrl(selected),
            footer: loadReceiptTemplate().receiptFooter,
            header: loadReceiptTemplate().receiptHeader,
            returnPolicy: loadReceiptTemplate().receiptReturnPolicy,
            notes: loadReceiptTemplate().receiptNotes,
            cashierName: `${selected.cashier?.firstName || selected.shift?.cashier?.firstName || ''} ${selected.cashier?.lastName || selected.shift?.cashier?.lastName || ''}`.trim(),
            terminalName: selected.terminal?.name || selected.shift?.terminal?.name,
          },
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Sale sent successfully');
        setShowEmailForm(false);
        setEmailInput('');
      } else {
        alert('Failed to send sale: ' + data.message);
      }
    } catch (e) {
      alert('Failed to send sale');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = async () => {
    if (!receiptPaperRef.current || !selected) return;
    try {
      await printPosReceipt({
        sale: selected,
        companyProfile,
        paperNode: receiptPaperRef.current,
      });
    } catch (e: any) {
      alert(e?.message || 'Print failed');
    }
  };

  // Fetch records for export based on date range
  const fetchExportRecords = async () => {
    if (!exportFromDate || !exportToDate) {
      alert('Please select both from and to dates');
      return;
    }
    setLoadingExport(true);
    try {
      const params = new URLSearchParams({ 
        startDate: exportFromDate,
        endDate: exportToDate,
        limit: '1000' // Get all records for export
      });
      if (locationIdForApi) params.set('locationId', locationIdForApi);
      const r:any = await posSaleService.list(params.toString());
      setExportRecords(asPosArray(r));
    } catch (e) {
      alert('Failed to fetch records');
    } finally {
      setLoadingExport(false);
    }
  };


  // Export to PDF
  const handleExportPDF = async () => {
    if (exportRecords.length === 0) {
      alert('No records to export');
      return;
    }
    setExporting(true);
    try {
      const { createBrandedReport } = await import('../../../lib/pdf-branding');
      const autoTable = (await import('jspdf-autotable')).default;

      const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
        reportTitle: 'POS Sales Report',
      });

      let yPos = startY;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Date Range: ${exportFromDate} to ${exportToDate}`, margin, yPos);
      yPos += 5;
      doc.text(`Total Records: ${exportRecords.length}`, margin, yPos);
      yPos += 8;

      const rows = exportRecords.map((record: any) => [
        record.invoiceNumber || '',
        record.customerName || '',
        String(record.items?.length || 0),
        `$${(record.grandTotal || 0).toFixed(2)}`,
        record.payments?.map((p: any) => p.paymentMethod).join(', ') || '',
        record.status || '',
        new Date(record.createdAt).toLocaleDateString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Invoice', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: accentHex, textColor: '#ffffff' },
        styles: { fontSize: 7 },
        margin: { left: margin, right: margin },
      });

      finalize({
        filename: `pos_sales_report_${exportFromDate}_to_${exportToDate}.pdf`,
      });
      setShowExportModal(false);
    } catch (e) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (exportRecords.length === 0) {
      alert('No records to export');
      return;
    }
    setExporting(true);
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportRecords.map((r: any) => ({
        'Invoice Number': r.invoiceNumber,
        'Customer': r.customerName,
        'Items Count': r.items?.length || 0,
        'Subtotal': r.subtotal,
        'Discount': r.discountTotal,
        'Tax': r.taxTotal,
        'Grand Total': r.grandTotal,
        'Payment Methods': r.payments?.map((p:any)=>p.paymentMethod).join(', '),
        'Status': r.status,
        'Cashier': `${r.shift?.cashier?.firstName || ''} ${r.shift?.cashier?.lastName || ''}`,
        'Date': new Date(r.createdAt).toLocaleString(),
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
      XLSX.writeFile(workbook, `pos_sales_report_${exportFromDate}_to_${exportToDate}.xlsx`);
      setShowExportModal(false);
    } catch (e) {
      alert('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap' as const, gap:'12px' }}>
        <h2 style={{ color:'#0f172a', margin:0, fontSize:'18px', fontWeight:700 }}>🧾 POS Sales ({total})</h2>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' as const }}>
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }} style={{ ...input, minWidth:'140px' }}>
            <option value="">All Status</option>
            {['Completed','Held','Cancelled','Returned'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>setShowExportModal(true)} style={{ ...btn('#014582'), display:'flex', alignItems:'center', gap:'8px' }}>
            <FileSpreadsheet size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? <p style={{ color:'#64748b' }}>Loading...</p> : (
        <>
          <div style={{ overflowX:'auto' as const }}>
            <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
              <thead style={tHead}>
                <tr>{['Invoice','Customer','Items','Total','Payment','Status','Date','Actions'].map(h=><th key={h} style={{ ...tCell, color:'#64748b', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, textAlign:'left' as const }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sales.map((s:any) => (
                  <tr key={s.id} style={{ cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    onClick={()=>openDetail(s.id)}>
                    <td style={tCell}><span style={{ color:'#0f172a', fontWeight:600 }}>{s.invoiceNumber}</span></td>
                    <td style={tCell}>{s.customerName}</td>
                    <td style={tCell}>{s.items?.length || 0}</td>
                    <td style={tCell}>${s.grandTotal?.toFixed(2)}</td>
                    <td style={tCell}>{s.payments?.map((p:any)=>p.paymentMethod).join(', ') || '—'}</td>
                    <td style={tCell}><StatusBadge status={s.status} /></td>
                    <td style={tCell}>{new Date(s.createdAt).toLocaleString()}</td>
                    <td style={tCell}>
                      <button style={btn('rgba(1,69,130,0.1)','#014582')} onClick={e=>{e.stopPropagation();openDetail(s.id);}}>View</button>
                    </td>
                  </tr>
                ))}
                {sales.length===0 && <tr><td colSpan={8} style={{ ...tCell, textAlign:'center', color:'#64748b', padding:'40px' }}>{emptyHint('sales', locationIdForApi)}</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            <span style={{ color:'#64748b', fontSize:'13px', alignSelf:'center' }}>Page {page} of {Math.ceil(total/LIMIT)||1}</span>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/LIMIT)}>Next →</button>
          </div>
        </>
      )}

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'28px', width:'560px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' as const }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <h3 style={{ color:'#0f172a', margin:0, fontSize:'17px' }}>Sale {selected.invoiceNumber}</h3>
              <button onClick={()=>setSelected(null)} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer', fontSize:'20px' }}>✕</button>
            </div>
            <div ref={receiptPaperRef} style={{ margin:'12px 0 18px', borderRadius:'12px', overflow:'hidden' }}>
              <POSReceipt sale={selected} companyProfile={companyProfile} />
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
              <button style={{ ...btn('#014582'), display:'flex', alignItems:'center', gap:'6px' }} onClick={handleDownloadPDF}><Download size={14}/> PDF</button>
              <button style={{ ...btn('#f1f5f9','#475569'), display:'flex', alignItems:'center', gap:'6px' }} onClick={handlePrint}><Printer size={14}/> Print</button>
              <button style={{ ...btn('rgba(5,150,105,0.12)','#059669'), display:'flex', alignItems:'center', gap:'6px' }} onClick={()=>setShowEmailForm(true)}><Mail size={14}/> Email</button>
              {selected.status === 'Completed' && (
                <button
                  style={{ ...btn('rgba(220,38,38,0.12)','#dc2626'), display:'flex', alignItems:'center', gap:'6px' }}
                  onClick={async () => {
                    const reason = prompt('Void reason (required):');
                    if (!reason?.trim()) return;
                    try {
                      await posSaleService.void(selected.id, { reason: reason.trim() });
                      alert('Sale voided');
                      setSelected(null);
                      load(page, status);
                    } catch (e: any) {
                      alert(e.message || 'Void failed');
                    }
                  }}
                >
                  Void Sale
                </button>
              )}
            </div>
            {showEmailForm && (
              <div style={{ marginTop:'14px', display:'flex', gap:'8px' }}>
                <input style={{ ...input, flex:1 }} placeholder="Email address" value={emailInput} onChange={e=>setEmailInput(e.target.value)} />
                <button style={btn('linear-gradient(135deg,#10b981,#059669)')} onClick={handleSendEmail} disabled={sendingEmail}>{sendingEmail?'Sending...':'Send'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'28px', width:'500px', maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ color:'#0f172a', margin:0, fontSize:'18px', display:'flex', alignItems:'center', gap:'10px' }}>
                <FileSpreadsheet size={20} /> Export Sales
              </h3>
              <button onClick={()=>setShowExportModal(false)} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ color:'#64748b', fontSize:'13px', marginBottom:'8px', display:'block' }}>From Date</label>
              <input type="date" value={exportFromDate} onChange={e=>setExportFromDate(e.target.value)} style={{ ...input, width:'100%' }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ color:'#64748b', fontSize:'13px', marginBottom:'8px', display:'block' }}>To Date</label>
              <input type="date" value={exportToDate} onChange={e=>setExportToDate(e.target.value)} style={{ ...input, width:'100%' }} />
            </div>
            <button onClick={fetchExportRecords} disabled={loadingExport} style={{ ...btn('#f1f5f9','#475569'), width:'100%', marginBottom:'14px' }}>
              {loadingExport ? 'Loading...' : `Load Records (${exportRecords.length})`}
            </button>
            {exportRecords.length > 0 && (
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={handleExportPDF} disabled={exporting} style={{ ...btn('#014582'), flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {exporting ? <><Loader2 size={16} className="animate-spin" /> Exporting...</> : <><Download size={16} /> Export PDF</>}
                </button>
                <button onClick={handleExportExcel} disabled={exporting} style={{ ...btn('linear-gradient(135deg,#10b981,#059669)'), flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {exporting ? <><Loader2 size={16} className="animate-spin" /> Exporting...</> : <><FileSpreadsheet size={16} /> Export Excel</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Returns Tab ──────────────────────────────────────────────────────────────
function ReturnsTab({ locationIdForApi }: { locationIdForApi: string }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [saleDetail, setSaleDetail] = useState<any>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPassword, setMgrPassword] = useState('');
  const LIMIT = 15;

  const load = useCallback(async (p:number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:String(p), limit:String(LIMIT), status:'Completed' });
      if (locationIdForApi) params.set('locationId', locationIdForApi);
      const r:any = await posSaleService.list(params.toString());
      const rows = asPosArray(r);
      setSales(rows);
      setTotal(asPosTotal(r, rows));
    } catch {} finally { setLoading(false); }
  }, [locationIdForApi]);

  useEffect(() => { setPage(1); }, [locationIdForApi]);
  useEffect(() => { load(page); }, [load, page]);

  const openReturn = async (sale: any) => {
    setSelected(sale);
    setReason('');
    setRefundMethod('Cash');
    try {
      const r: any = await posSaleService.get(sale.id);
      const detail = r.data;
      setSaleDetail(detail);
      const qtys: Record<string, number> = {};
      (detail.items || []).forEach((it: any) => {
        qtys[it.productId] = it.quantity;
      });
      setReturnQtys(qtys);
    } catch (e: any) {
      alert(e.message || 'Failed to load sale');
      setSelected(null);
    }
  };

  const submitReturn = async () => {
    if (!selected || !saleDetail) return;
    if (!reason.trim()) {
      alert('Return reason is required');
      return;
    }
    const returnItems = Object.entries(returnQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));
    if (!returnItems.length) {
      alert('Select at least one item quantity to return');
      return;
    }

    setReturning(true);
    try {
      const settings = loadPosSettings();
      if (settings.requireManagerForReturn && mgrEmail && mgrPassword) {
        await posSaleService.verifyManager({ email: mgrEmail, password: mgrPassword });
      }
      await posSaleService.return({
        originalSaleId: selected.id,
        returnItems,
        refundMethod,
        reason: reason.trim(),
      });
      alert('Return processed');
      setSelected(null);
      setSaleDetail(null);
      setReason('');
      await load(page);
    } catch (e:any) {
      alert(e.message || 'Failed to process return');
    } finally {
      setReturning(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#0f172a', margin:0, fontSize:'18px', fontWeight:700 }}>↩️ Returns</h2>
      </div>
      <p style={{ color:'#64748b', fontSize:'13px', marginTop:0 }}>Select a completed sale to process a full or partial return.</p>
      {loading ? <p style={{ color:'#64748b' }}>Loading...</p> : (
        <>
          <div style={{ overflowX:'auto' as const }}>
            <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
              <thead style={tHead}>
                <tr>{['Invoice','Customer','Total','Date','Actions'].map(h=><th key={h} style={{ ...tCell, color:'#64748b', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, textAlign:'left' as const }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sales.map((s:any) => (
                  <tr key={s.id}>
                    <td style={tCell}>{s.invoiceNumber}</td>
                    <td style={tCell}>{s.customerName}</td>
                    <td style={tCell}>${s.grandTotal?.toFixed(2)}</td>
                    <td style={tCell}>{new Date(s.createdAt).toLocaleString()}</td>
                    <td style={tCell}>
                      <button style={btn('rgba(239,68,68,0.15)','#f87171')} onClick={()=>openReturn(s)}>Return</button>
                    </td>
                  </tr>
                ))}
                {sales.length===0 && <tr><td colSpan={5} style={{ ...tCell, textAlign:'center', color:'#64748b', padding:'40px' }}>{emptyHint('completed sales', locationIdForApi)}</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            <span style={{ color:'#64748b', fontSize:'13px', alignSelf:'center' }}>Page {page} of {Math.ceil(total/LIMIT)||1}</span>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/LIMIT)}>Next →</button>
          </div>
        </>
      )}

      {selected && saleDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'16px', padding:'28px', width:'560px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ color:'#0f172a', marginTop:0 }}>Return {selected.invoiceNumber}</h3>
            <p style={{ color:'#64748b' }}>Original total: ${selected.grandTotal?.toFixed(2)}</p>

            <div style={{ marginBottom:'14px' }}>
              {(saleDetail.items || []).map((it: any) => (
                <div key={it.productId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ color:'#0f172a', fontSize:'13px' }}>{it.productName}</div>
                    <div style={{ color:'#64748b', fontSize:'11px' }}>Sold: {it.quantity} · ${it.unitPrice?.toFixed(2)}</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={it.quantity}
                    value={returnQtys[it.productId] ?? 0}
                    onChange={(e) =>
                      setReturnQtys((prev) => ({
                        ...prev,
                        [it.productId]: Math.min(it.quantity, Math.max(0, parseInt(e.target.value, 10) || 0)),
                      }))
                    }
                    style={{ ...input, width:'80px' }}
                  />
                </div>
              ))}
            </div>

            <label style={{ color:'#64748b', fontSize:'12px' }}>Refund method</label>
            <select value={refundMethod} onChange={(e)=>setRefundMethod(e.target.value)} style={{ ...input, width:'100%', marginBottom:'10px' }}>
              {['Cash','Card','Bank Transfer','Mobile Wallet','Cheque'].map((m)=>(
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <textarea
              value={reason}
              onChange={e=>setReason(e.target.value)}
              placeholder="Return reason"
              style={{ ...input, width:'100%', minHeight:'70px', marginBottom:'10px', resize:'vertical' as const }}
            />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
              <input placeholder="Manager email (if required)" value={mgrEmail} onChange={(e)=>setMgrEmail(e.target.value)} style={input} />
              <input type="password" placeholder="Manager password" value={mgrPassword} onChange={(e)=>setMgrPassword(e.target.value)} style={input} />
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button style={btn('#f1f5f9','#475569')} onClick={()=>{ setSelected(null); setSaleDetail(null); }}>Cancel</button>
              <button style={btn('rgba(239,68,68,0.8)')} onClick={submitReturn} disabled={returning}>{returning?'Processing...':'Confirm Return'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportRecords, setExportRecords] = useState<any[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const LIMIT = 20;

  const actionColor: Record<string,string> = {
    SALE_COMPLETED: '#4ade80',
    SALE_HELD: '#fbbf24',
    SALE_RETURNED: '#f87171',
    SHIFT_OPENED: '#60a5fa',
    SHIFT_CLOSED: '#a78bfa',
  };

  const load = useCallback(async (p:number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:String(p), limit:String(LIMIT) });
      const r:any = await posSaleService.auditLogs(params.toString());
      const rows = asPosArray(r);
      setLogs(rows);
      setTotal(asPosTotal(r, rows));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const fetchExportRecords = async () => {
    if (!exportFromDate || !exportToDate) {
      alert('Please select both from and to dates');
      return;
    }
    setLoadingExport(true);
    try {
      const params = new URLSearchParams({
        startDate: exportFromDate,
        endDate: exportToDate,
        limit: '1000'
      });
      const r:any = await posSaleService.auditLogs(params.toString());
      setExportRecords(asPosArray(r));
    } catch (e) {
      alert('Failed to fetch records');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportPDF = async () => {
    if (exportRecords.length === 0) {
      alert('No records to export');
      return;
    }
    setExporting(true);
    try {
      const { createBrandedReport } = await import('../../../lib/pdf-branding');
      const autoTable = (await import('jspdf-autotable')).default;

      const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
        reportTitle: 'Audit Log Report',
      });

      let yPos = startY;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Date Range: ${exportFromDate} to ${exportToDate}`, margin, yPos);
      yPos += 5;
      doc.text(`Total Records: ${exportRecords.length}`, margin, yPos);
      yPos += 8;

      const rows = exportRecords.map((record: any) => [
        record.action || '',
        (record.details || '').toString().substring(0, 80),
        `${record.creator?.firstName || ''} ${record.creator?.lastName || ''}`.trim(),
        record.createdAt ? new Date(record.createdAt).toLocaleString() : '',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Action', 'Details', 'User', 'Time']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: accentHex, textColor: '#ffffff' },
        styles: { fontSize: 7 },
        margin: { left: margin, right: margin },
      });

      finalize({
        filename: `audit_log_report_${exportFromDate}_to_${exportToDate}.pdf`,
      });
      setShowExportModal(false);
    } catch (e) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (exportRecords.length === 0) {
      alert('No records to export');
      return;
    }
    setExporting(true);
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportRecords.map((r: any) => ({
        'Action': r.action,
        'Details': r.details,
        'User': `${r.creator?.firstName || ''} ${r.creator?.lastName || ''}`,
        'Date': new Date(r.createdAt).toLocaleString(),
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
      XLSX.writeFile(workbook, `audit_log_report_${exportFromDate}_to_${exportToDate}.xlsx`);
      setShowExportModal(false);
    } catch (e) {
      alert('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#0f172a', margin:0, fontSize:'18px', fontWeight:700 }}>🔍 Audit Log ({total})</h2>
        <button onClick={()=>setShowExportModal(true)} style={{ ...btn('#014582'), display:'flex', alignItems:'center', gap:'8px' }}>
          <FileSpreadsheet size={16} /> Export
        </button>
      </div>
      {loading ? <p style={{ color:'#64748b' }}>Loading...</p> : (
        <>
          <div style={{ overflowX:'auto' as const }}>
            <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
              <thead style={tHead}>
                <tr>{['Action','Details','User','Time'].map(h=><th key={h} style={{ ...tCell, color:'#64748b', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, textAlign:'left' as const }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {logs.map((l:any) => (
                  <tr key={l.id} style={{ transition:'background 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={tCell}><span style={badge(actionColor[l.action]||'#8b8fa8')}>{l.action}</span></td>
                    <td style={{ ...tCell, maxWidth:'300px', color:'#64748b' }}>{l.details}</td>
                    <td style={tCell}>{l.creator?.firstName} {l.creator?.lastName}</td>
                    <td style={tCell}>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length===0 && <tr><td colSpan={4} style={{ ...tCell, textAlign:'center', color:'#64748b', padding:'40px' }}>No audit logs found</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            <span style={{ color:'#64748b', fontSize:'13px', alignSelf:'center' }}>Page {page} of {Math.ceil(total/LIMIT)||1}</span>
            <button style={btn('#f1f5f9','#475569')} onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/LIMIT)}>Next →</button>
          </div>
        </>
      )}

      {showExportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'28px', width:'500px', maxWidth:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ color:'#0f172a', margin:0, fontSize:'18px', display:'flex', alignItems:'center', gap:'10px' }}>
                <FileSpreadsheet size={20} /> Export Audit Logs
              </h3>
              <button onClick={()=>setShowExportModal(false)} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ color:'#64748b', fontSize:'13px', marginBottom:'8px', display:'block' }}>From Date</label>
              <input type="date" value={exportFromDate} onChange={e=>setExportFromDate(e.target.value)} style={{ ...input, width:'100%' }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ color:'#64748b', fontSize:'13px', marginBottom:'8px', display:'block' }}>To Date</label>
              <input type="date" value={exportToDate} onChange={e=>setExportToDate(e.target.value)} style={{ ...input, width:'100%' }} />
            </div>
            <button onClick={fetchExportRecords} disabled={loadingExport} style={{ ...btn('#f1f5f9','#475569'), width:'100%', marginBottom:'14px' }}>
              {loadingExport ? 'Loading...' : `Load Records (${exportRecords.length})`}
            </button>
            {exportRecords.length > 0 && (
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={handleExportPDF} disabled={exporting} style={{ ...btn('#014582'), flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {exporting ? <><Loader2 size={16} className="animate-spin" /> Exporting...</> : <><Download size={16} /> Export PDF</>}
                </button>
                <button onClick={handleExportExcel} disabled={exporting} style={{ ...btn('linear-gradient(135deg,#10b981,#059669)'), flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {exporting ? <><Loader2 size={16} className="animate-spin" /> Exporting...</> : <><FileSpreadsheet size={16} /> Export Excel</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function TaxTab() {
  const [ctx, setCtx] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    taxService.context().then((r) => setCtx(r.data || r)).catch((e) => setError(e.message));
  }, []);
  return (
    <div style={card}>
      <h2 style={{ margin:'0 0 8px', fontSize:'18px' }}>POS tax compliance</h2>
      <p style={{ color:'#64748b', fontSize:'13px', marginBottom:'16px' }}>
        Rates, inclusive/exclusive pricing and exemptions are managed in Tax Compliance. If taxation is OFF, POS will not add tax.
      </p>
      <div style={{ marginBottom:'16px' }}>
        <TaxUseToggle onChanged={() => taxService.context().then((r) => setCtx(r.data || r)).catch(() => {})} />
      </div>
      {error && <p style={{ color:'#f87171', fontSize:'13px' }}>{error}</p>}
      {ctx && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'16px' }}>
          <div><div style={{ color:'#64748b', fontSize:'11px' }}>TAX IN FLOW</div><div>{ctx.enabled ? 'ON' : 'OFF'}</div></div>
          <div><div style={{ color:'#64748b', fontSize:'11px' }}>CONFIGURED</div><div>{ctx.configured ? 'Yes' : 'Not yet'}</div></div>
          <div><div style={{ color:'#64748b', fontSize:'11px' }}>REGIME</div><div>{ctx.regime || '—'}</div></div>
          <div><div style={{ color:'#64748b', fontSize:'11px' }}>PRICING</div><div>{ctx.pricingModel}</div></div>
          <div><div style={{ color:'#64748b', fontSize:'11px' }}>DEFAULT RATE</div><div>{ctx.defaultRate?.rate ?? 0}%</div></div>
        </div>
      )}
      <Link href="/tax" style={{ ...btn('#014582'), textDecoration:'none', display:'inline-block' }}>
        Open Tax Compliance
      </Link>
    </div>
  );
}

// ─── Main POS Management Page ─────────────────────────────────────────────────
export default function POSManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Terminals');
  const { user, loading, isAdmin } = usePermissions();
  const { locationIdForApi, isAllLocations, selectedLocation } = useLocation();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f6fa', color:'#64748b', fontFamily:"'Inter',sans-serif" }}>
      Loading POS Management...
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f3f6fa', fontFamily:"'Inter',sans-serif", color:'#0f172a' }}>
      {/* Header */}
      <div style={{ padding:'24px 32px', borderBottom:'1px solid #e5e7eb', background:'#ffffff', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' as const }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <Link href="/dashboard" style={{ color:'#64748b', fontSize:'13px', textDecoration:'none' }}>← Dashboard</Link>
            <span style={{ color:'#64748b' }}>/</span>
            <span style={{ color:'#014582', fontSize:'13px', fontWeight:600 }}>POS Management</span>
          </div>
          <h1 style={{ margin:0, fontSize:'26px', fontWeight:800 }}>🏪 Point of Sale Management</h1>
          <p style={{ color:'#64748b', margin:'6px 0 0', fontSize:'14px' }}>
            {isAllLocations
              ? 'All locations · Terminals · Shifts · Sales · Returns'
              : `${selectedLocation?.name || 'Location'} · Terminals · Shifts · Sales · Returns`}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' as const }}>
          <LocationSelect allowAll showManageLink={false} />
          <Link href="/pos" style={{ ...btn('#014582'), textDecoration:'none', display:'inline-block' }}>
            🛒 Open POS
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding:'0 32px', borderBottom:'1px solid #e5e7eb', background:'#ffffff', display:'flex', gap:'4px' }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:'14px 20px', background:'transparent', border:'none', borderBottom:`2px solid ${activeTab===t?'#014582':'transparent'}`, color:activeTab===t?'#014582':'#64748b', cursor:'pointer', fontSize:'14px', fontWeight:activeTab===t?700:400, transition:'all 0.2s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'28px 32px', maxWidth: activeTab==='Receipt' ? '1400px' : '1300px' }}>
        {activeTab==='Terminals'  && <TerminalsTab isAdmin={isAdmin} locationIdForApi={locationIdForApi} />}
        {activeTab==='Shifts'     && <ShiftsTab isAdmin={isAdmin} locationIdForApi={locationIdForApi} />}
        {activeTab==='Sales'      && <SalesTab locationIdForApi={locationIdForApi} />}
        {activeTab==='Returns'    && <ReturnsTab locationIdForApi={locationIdForApi} />}
        {activeTab==='Receipt'    && <ReceiptEditorTab isAdmin={isAdmin} />}
        {activeTab==='Printer'    && <ThermalPrinterTab isAdmin={isAdmin} />}
        {activeTab==='Scanner'    && <ScannerSettingsTab isAdmin={isAdmin} />}
        {activeTab==='Payments'   && <PaymentTerminalTab isAdmin={isAdmin} />}
        {activeTab==='Tax'        && <TaxTab />}
        {activeTab==='Audit Log'  && <AuditLogTab />}
      </div>
    </div>
  );
}
