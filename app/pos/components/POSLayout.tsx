'use client';
import { useState, useEffect } from 'react';
import { posShiftService, posSaleService, posReceiptService } from '../../../lib/pos-service';
import { usePermissions } from '../../../lib/usePermissions';
import {
  loadPosSettings,
  savePosSettings,
  saveReceiptTemplate,
  DEFAULT_POS_SETTINGS,
  type PosSettings,
} from '../../../lib/pos-settings';
import { kickCashDrawer } from '../../../lib/pos-thermal-printer';
import { posOfflineQueue } from '../../../lib/pos-offline-queue';
import {
  getPaymentTerminalStatus,
  reconnectPaymentTerminal,
  subscribePaymentTerminalStatus,
  type TerminalLinkStatus,
} from '../../../lib/pos-payment-terminal';
import { reconnectThermalPrinter } from '../../../lib/pos-thermal-printer';
import {
  Store,
  DollarSign,
  Lock,
  Clock,
  BarChart3,
  PauseCircle,
  Settings,
  Loader2,
  X,
  Pause,
  WifiOff,
  RefreshCw,
  CreditCard,
  Menu,
  RotateCcw,
} from 'lucide-react';
import ReturnsScreen from './ReturnsScreen';
import { TopBarBrand } from '../../../components/BrandHeader';
import AppBreadcrumbs from '../../../components/AppBreadcrumbs';
import LocationSelect from '../../../components/LocationSelect';
import { useLocation } from '../../../lib/location-context';

interface Props {
  shift: any;
  onShiftClose: () => void;
  children: React.ReactNode;
}

export default function POSLayout({ shift, onShiftClose, children }: Props) {
  const { isAdmin } = usePermissions();
  const { locationIdForApi, selectedLocation, isAllLocations } = useLocation();
  const [activeTab, setActiveTab] = useState<'sell'|'returns'|'held'|'shifts'|'reports'|'settings'>('sell');
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [time, setTime] = useState(new Date());
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const [payDeviceOn, setPayDeviceOn] = useState(() => loadPosSettings().enablePaymentTerminal);
  const [payDeviceStatus, setPayDeviceStatus] = useState<TerminalLinkStatus>('disconnected');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    posReceiptService.get().then((res: any) => {
      if (res?.data) saveReceiptTemplate(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (loadPosSettings().thermalPrintMode === 'escpos') {
      void reconnectThermalPrinter();
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      setOfflineCount(posOfflineQueue.count());
      setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('pos:offline-queue-changed', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('pos:offline-queue-changed', refresh);
    };
  }, []);

  useEffect(() => {
    const sync = () => setPayDeviceOn(loadPosSettings().enablePaymentTerminal);
    sync();
    setPayDeviceStatus(getPaymentTerminalStatus().status);
    const off = subscribePaymentTerminalStatus((next) => setPayDeviceStatus(next));
    if (loadPosSettings().enablePaymentTerminal) {
      void reconnectPaymentTerminal().catch(() => {});
    }
    window.addEventListener('pos:settings-changed', sync);
    return () => {
      off();
      window.removeEventListener('pos:settings-changed', sync);
    };
  }, []);

  const syncOffline = async () => {
    const txs = posOfflineQueue.list();
    if (!txs.length) return;
    setSyncing(true);
    try {
      const res: any = await posSaleService.sync({ transactions: txs });
      const results = res.data || [];
      for (const r of results) {
        if (r.status === 'success' || r.status === 'skipped') {
          posOfflineQueue.remove(r.id);
        }
      }
      setOfflineCount(posOfflineQueue.count());
      window.dispatchEvent(new Event('pos:offline-queue-changed'));
      alert(res.message || 'Offline sync complete');
    } catch (e: any) {
      alert(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Suspend this shift? You can resume later from the same account.')) return;
    try {
      await posShiftService.suspend(shift.id);
      onShiftClose();
    } catch (e: any) {
      alert(e.message || 'Failed to suspend shift');
    }
  };

  const handleCloseShift = async () => {
    if (!actualCash) { setCloseError('Enter the actual cash count'); return; }
    setCloseLoading(true);
    setCloseError('');
    try {
      // Print Z-report snapshot before close
      try {
        const z: any = await posSaleService.shiftReport(shift.id);
        console.info('Z-Report', z.data);
      } catch { /* non-fatal */ }
      await posShiftService.close(shift.id, { actualCash: parseFloat(actualCash), notes: closeNotes });
      onShiftClose();
    } catch (e: any) {
      setCloseError(e.message);
    } finally {
      setCloseLoading(false);
    }
  };

  const tabs = [
    { id:'sell' as const,     icon: Store,      label:'Sell' },
    { id:'returns' as const,  icon: RotateCcw, label:'Returns' },
    { id:'held' as const,     icon: PauseCircle,label:'Held' },
    { id:'shifts' as const,   icon: Clock,      label:'Shifts' },
    { id:'reports' as const,  icon: BarChart3,  label:'Reports' },
    { id:'settings' as const, icon: Settings,   label:'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="relative bg-[#014582] text-white flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between gap-2 px-3 md:px-4 min-h-[56px] md:h-[64px] py-2">
          <div className="flex items-center gap-2 min-w-0">
            <TopBarBrand
              title="Point of Sale"
              icon={<Store className="w-5 h-5 text-white" />}
              dark
            />
            {!online && (
              <span className="hidden sm:flex text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LocationSelect
              allowAll
              showManageLink={false}
              compact
              variant="dark"
              className="relative z-10 shrink-0"
            />
            <span className="relative z-20 hidden sm:flex items-center justify-center min-w-[118px] h-9 px-3 rounded-lg bg-[#012f5c] text-white font-bold text-sm tabular-nums whitespace-nowrap leading-none overflow-hidden">
              {time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
            <button
              className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-400 whitespace-nowrap"
              onClick={()=>setShowCloseShift(true)}
            >
              Close
            </button>
            <button
              className="lg:hidden p-2 rounded-lg bg-white/15 border border-white/20"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More actions"
            >
              {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-4 pb-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Store className="w-4 h-4" />
            {(!isAllLocations && selectedLocation?.name) ||
              shift.terminal?.location?.name ||
              shift.terminal?.name ||
              'Terminal'}
          </span>
          <span className="text-sm font-medium">
            👤 {shift.cashier?.firstName} {shift.cashier?.lastName}
          </span>
          <span className="bg-emerald-400 text-[#01366a] px-2.5 py-1 rounded-full text-xs font-bold">
            ● SHIFT OPEN
          </span>
          {offlineCount > 0 && (
            <button
              onClick={syncOffline}
              disabled={syncing || !online}
              className="text-xs bg-white text-[#014582] px-2 py-1 rounded-full font-bold disabled:opacity-50"
            >
              Sync {offlineCount}
            </button>
          )}
          <button className="px-3 py-1.5 rounded-lg bg-white/15 text-sm font-semibold" onClick={() => { void kickCashDrawer(); }}>Drawer</button>
          <button className="px-3 py-1.5 rounded-lg bg-white/15 text-sm font-semibold flex items-center gap-1" onClick={()=>setShowCashFlow(true)}>
            <DollarSign className="w-4 h-4" /> Cash
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-amber-400 text-[#01366a] text-sm font-bold flex items-center gap-1" onClick={handleSuspend}>
            <Pause className="w-4 h-4" /> Suspend
          </button>
          {isAdmin && (
            <button className="px-3 py-1.5 rounded-lg bg-white text-[#014582] text-sm font-bold" onClick={() => window.location.href = '/pos/management'}>
              Admin
            </button>
          )}
        </div>

        {moreOpen && (
          <div className="lg:hidden absolute right-3 top-full mt-1 z-50 w-56 rounded-xl bg-white text-gray-900 shadow-xl border border-gray-200 p-2">
            <p className="px-2 py-1 text-xs text-gray-500">
              {shift.cashier?.firstName} {shift.cashier?.lastName}
            </p>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50" onClick={() => { void kickCashDrawer(); setMoreOpen(false); }}>Drawer</button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50" onClick={() => { setShowCashFlow(true); setMoreOpen(false); }}>Cash</button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50" onClick={() => { handleSuspend(); setMoreOpen(false); }}>Suspend shift</button>
            {isAdmin && (
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50" onClick={() => { window.location.href = '/pos/management'; }}>Admin</button>
            )}
          </div>
        )}
      </div>

      <AppBreadcrumbs
        variant="dark"
        extra={[{ label: tabs.find((t) => t.id === activeTab)?.label || 'Sell' }]}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden pb-16 md:pb-0">
        <div className="hidden md:flex w-[80px] bg-[#01366a] flex-col items-center py-4 gap-1.5 flex-shrink-0">
          {tabs.map(t=>(
            <button
              key={t.id}
              className={`w-[68px] h-[62px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer border-none transition-all outline-none ${
                activeTab===t.id ? 'bg-white text-[#014582] shadow-sm' : 'text-white/80 hover:bg-white/10'
              }`}
              onClick={()=>setActiveTab(t.id)}
            >
              <t.icon className={`w-5 h-5 ${activeTab===t.id ? 'text-[#014582]' : 'text-white'}`} />
              <span className={`text-[11px] font-bold ${activeTab===t.id ? 'text-[#014582]' : 'text-white'}`}>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden min-w-0">
          {activeTab === 'sell'     && children}
          {activeTab === 'returns'  && <ReturnsScreen />}
          {activeTab === 'held'     && <HeldSales onRecalled={() => setActiveTab('sell')} />}
          {activeTab === 'shifts'   && (
            <ShiftHistory
              currentShift={shift}
              onRefresh={() => {}}
              locationIdForApi={locationIdForApi}
            />
          )}
          {activeTab === 'reports'  && (
            <ReportsPanel shiftId={shift.id} locationIdForApi={locationIdForApi} />
          )}
          {activeTab === 'settings' && <POSSettings />}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#01366a] flex justify-around items-center h-16 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 ${
              activeTab === t.id ? 'text-white' : 'text-white/60'
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Close Shift Modal */}
      {showCloseShift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 w-[460px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gray-900 text-xl font-semibold m-0 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Close Shift
              </h2>
              <button
                onClick={()=>setShowCloseShift(false)}
                className="bg-transparent border-none text-gray-400 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {closeError && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-600 text-xs mb-4">
                {closeError}
              </div>
            )}
            <div className="mb-4 mt-4">
              <label className="block text-gray-400 text-xs mb-2">Count the cash in your drawer</label>
              <input
                type="number"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-2xl font-bold text-center outline-none focus:border-[#014582] transition-colors"
                value={actualCash}
                onChange={e=>setActualCash(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-5">
              <label className="block text-gray-400 text-xs mb-2">Closing Notes (optional)</label>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                value={closeNotes}
                onChange={e=>setCloseNotes(e.target.value)}
                placeholder="Any notes for closing..."
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-lg bg-transparent border border-gray-200 text-gray-400 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={()=>setShowCloseShift(false)}
              >
                Cancel
              </button>
              <button
                className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 border-none text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={handleCloseShift}
                disabled={closeLoading}
              >
                {closeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Close & Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash In/Out Modal */}
      {showCashFlow && <CashFlowModal shiftId={shift.id} onClose={()=>setShowCashFlow(false)} />}
    </div>
  );
}

// ─── Cash Flow Modal ─────────────────────────────────────────────────────────
function CashFlowModal({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const [type, setType] = useState<'CASH_IN'|'CASH_OUT'>('CASH_IN');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!amount || !reason) { setError('Amount and reason are required'); return; }
    setLoading(true);
    try {
      await posShiftService.recordCash({ shiftId, type, amount: parseFloat(amount), reason });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 w-[420px] max-w-[90vw] font-sans">
        <h2 className="text-gray-900 text-xl font-semibold m-0 mb-5 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cash In / Out
        </h2>
        {success ? (
          <div className="text-center py-6 text-emerald-600 text-lg">✅ Recorded successfully!</div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-600 text-xs mb-4">
                {error}
              </div>
            )}
            <div className="flex gap-2 mb-5 bg-white rounded-lg p-1">
              <button
                className={`flex-1 py-2.5 rounded-lg border-none cursor-pointer font-semibold text-sm transition-colors ${
                  type==='CASH_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-transparent text-gray-500'
                }`}
                onClick={()=>setType('CASH_IN')}
              >
                💚 Cash In
              </button>
              <button
                className={`flex-1 py-2.5 rounded-lg border-none cursor-pointer font-semibold text-sm transition-colors ${
                  type==='CASH_OUT' ? 'bg-red-50 text-red-600' : 'bg-transparent text-gray-500'
                }`}
                onClick={()=>setType('CASH_OUT')}
              >
                🔴 Cash Out
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Amount</label>
              <input
                type="number"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-2xl font-bold text-center outline-none focus:border-[#014582] transition-colors mt-2"
                value={amount}
                onChange={e=>setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="mb-5">
              <label className="block text-gray-400 text-xs mb-2">Reason</label>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors mt-2"
                value={reason}
                onChange={e=>setReason(e.target.value)}
                placeholder="e.g. Petty cash withdrawal, Owner deposit..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-transparent border border-gray-200 text-gray-400 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#014582] to-[#01366a] border-none text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Held sales with recall + delete ─────────────────────────────────────────
function HeldSales({ onRecalled }: { onRecalled: () => void }) {
  const [held, setHeld] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = usePermissions();

  const load = () => {
    setLoading(true);
    posSaleService
      .getHeld()
      .then((r: any) => {
        setHeld(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const recall = async (sale: any) => {
    window.dispatchEvent(new CustomEvent('pos:recall-held', { detail: sale }));
    onRecalled();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this held sale?')) return;
    try {
      await posSaleService.deleteHeld(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to delete held sale (manager/admin only)');
    }
  };

  return (
    <div className="p-6 font-sans h-full overflow-y-auto">
      <h2 className="text-gray-900 text-xl font-semibold mb-5 flex items-center gap-2">
        <PauseCircle className="w-5 h-5" />
        Held Sales ({held.length})
      </h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : held.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <PauseCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No held sales</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {held.map((s: any) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex justify-between items-center gap-4"
            >
              <div>
                <div className="text-gray-900 font-semibold">{s.invoiceNumber}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {s.customerName} · {s.items?.length || 0} items
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[#014582] font-bold text-lg">${Number(s.grandTotal || 0).toFixed(2)}</div>
                  <div className="text-gray-400 text-xs">{new Date(s.createdAt).toLocaleTimeString()}</div>
                </div>
                <button
                  onClick={() => recall(s)}
                  className="px-3 py-2 rounded-lg bg-[#014582] text-white text-xs font-bold"
                >
                  Recall
                </button>
                {(isAdmin) && (
                  <button
                    onClick={() => remove(s.id)}
                    className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShiftHistory({
  currentShift,
  onRefresh,
  locationIdForApi,
}: {
  currentShift: any;
  onRefresh: () => void;
  locationIdForApi: string;
}) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: '50' });
    if (locationIdForApi) qs.set('locationId', locationIdForApi);
    posShiftService
      .getHistory(qs.toString())
      .then((r: any) => {
        setShifts(r.shifts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationIdForApi]);

  const getStatusColor = (s:string) => {
    switch(s) {
      case 'Open': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed': return 'bg-red-50 text-red-600 border-red-200';
      case 'Suspended': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const resume = async (id: string) => {
    try {
      await posShiftService.resume(id);
      onRefresh();
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Failed to resume');
    }
  };

  return (
    <div className="p-6 font-sans h-full overflow-y-auto">
      <h2 className="text-gray-900 text-xl font-semibold mb-5 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Shift History
      </h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid gap-2.5">
          {shifts.map((sh:any) => (
            <div key={sh.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-gray-900 font-semibold text-sm mb-1">{sh.terminal?.name} — {sh.cashier?.firstName} {sh.cashier?.lastName}</div>
                <div className="text-gray-400 text-xs">Opened: {new Date(sh.openedAt).toLocaleString()}</div>
                {sh.closedAt && <div className="text-gray-400 text-xs">Closed: {new Date(sh.closedAt).toLocaleString()}</div>}
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(sh.status)}`}>
                  {sh.status}
                </span>
                <div className="text-[#014582] font-bold text-base">Opening: ${sh.openingCash?.toFixed(2)}</div>
                {sh.status === 'Suspended' && (
                  <button onClick={() => resume(sh.id)} className="text-xs px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsPanel({
  shiftId,
  locationIdForApi,
}: {
  shiftId: string;
  locationIdForApi: string;
}) {
  const [daily, setDaily] = useState<any>(null);
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      posSaleService.dailyReport(undefined, locationIdForApi || undefined).catch(() => null),
      posSaleService.shiftReport(shiftId).catch(() => null),
    ]).then(([d, s]) => {
      setDaily(d?.data || null);
      setShiftReport(s?.data || null);
      setLoading(false);
    });
  }, [shiftId, locationIdForApi]);

  const printZ = () => {
    if (!shiftReport) return;
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return;
    const s = shiftReport.summary || {};
    w.document.write(`<html><head><title>${shiftReport.type}-Report</title>
      <style>body{font-family:monospace;padding:16px} h1{font-size:16px} table{width:100%;border-collapse:collapse} td{padding:4px 0;border-bottom:1px dashed #ccc}</style>
      </head><body>
      <h1>${shiftReport.type}-REPORT</h1>
      <div>Terminal: ${shiftReport.shift?.terminal?.name || ''}</div>
      <div>Cashier: ${shiftReport.shift?.cashier?.firstName || ''} ${shiftReport.shift?.cashier?.lastName || ''}</div>
      <div>Printed: ${new Date().toLocaleString()}</div>
      <hr/>
      <table>
        <tr><td>Opening Cash</td><td align="right">${Number(s.openingCash||0).toFixed(2)}</td></tr>
        <tr><td>Sales Count</td><td align="right">${s.salesCount||0}</td></tr>
        <tr><td>Gross Sales</td><td align="right">${Number(s.grandTotal||0).toFixed(2)}</td></tr>
        <tr><td>Discounts</td><td align="right">${Number(s.discountTotal||0).toFixed(2)}</td></tr>
        <tr><td>Tax</td><td align="right">${Number(s.taxTotal||0).toFixed(2)}</td></tr>
        <tr><td>Returns</td><td align="right">${Number(s.returnsTotal||0).toFixed(2)}</td></tr>
        <tr><td>Cash In</td><td align="right">${Number(s.cashIn||0).toFixed(2)}</td></tr>
        <tr><td>Cash Out</td><td align="right">${Number(s.cashOut||0).toFixed(2)}</td></tr>
        <tr><td><b>Expected Cash</b></td><td align="right"><b>${Number(s.expectedCash||0).toFixed(2)}</b></td></tr>
      </table>
      <h3>Tenders</h3>
      <table>
        ${(shiftReport.paymentBreakdown||[]).map((p:any)=>`<tr><td>${p.paymentMethod}</td><td align="right">${Number(p._sum?.amount||0).toFixed(2)}</td></tr>`).join('')}
      </table>
      <script>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  if (loading) return <div className="p-6 text-gray-400 font-sans">Loading report...</div>;

  return (
    <div className="p-6 font-sans h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Reports
        </h2>
        <button onClick={printZ} className="px-4 py-2 rounded-lg bg-[#014582] text-white text-xs font-bold">
          Print {shiftReport?.type || 'X'}-Report
        </button>
      </div>

      <h3 className="text-gray-900 font-semibold mb-3">Current Shift ({shiftReport?.type || 'X'}-Report)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Sales', value: `$${Number(shiftReport?.summary?.grandTotal||0).toFixed(2)}` },
          { label: 'Txns', value: shiftReport?.summary?.salesCount || 0 },
          { label: 'Expected Cash', value: `$${Number(shiftReport?.summary?.expectedCash||0).toFixed(2)}` },
          { label: 'Returns', value: `$${Number(shiftReport?.summary?.returnsTotal||0).toFixed(2)}` },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-[#014582] text-xl font-bold">{c.value}</div>
            <div className="text-gray-400 text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-gray-900 font-semibold mb-3">Today (store-wide)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label:'Total Sales', value:`$${(daily?.sales?._sum?.grandTotal||0).toFixed(2)}` },
          { label:'Transactions', value: daily?.sales?._count?.id || 0 },
          { label:'Returns', value:`$${(daily?.returns?._sum?.refundedAmount||0).toFixed(2)}` },
          { label:'Discounts', value:`$${(daily?.sales?._sum?.discountTotal||0).toFixed(2)}` },
        ].map(c=>(
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-emerald-600 text-xl font-bold">{c.value}</div>
            <div className="text-gray-400 text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {(shiftReport?.paymentBreakdown || daily?.paymentBreakdown)?.length > 0 && (
        <>
          <h3 className="text-gray-900 text-lg font-semibold mb-4">Payment Breakdown</h3>
          <div className="grid gap-2.5">
            {(shiftReport?.paymentBreakdown || daily?.paymentBreakdown || []).map((p:any) => (
              <div key={p.paymentMethod} className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">{p.paymentMethod}</span>
                <span className="text-[#014582] font-bold text-base">${(p._sum?.amount||0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function POSSettings() {
  const { isAdmin } = usePermissions();
  const [settings, setSettings] = useState<PosSettings>(DEFAULT_POS_SETTINGS);

  useEffect(() => {
    setSettings(loadPosSettings());
  }, []);

  const update = (patch: Partial<PosSettings>) => {
    setSettings(savePosSettings(patch));
  };

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
    </label>
  );

  return (
    <div className="p-6 font-sans h-full overflow-y-auto max-w-2xl">
      <h2 className="text-gray-900 text-xl font-semibold mb-5 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        POS Settings
      </h2>
      <div className="space-y-3">
        <Toggle
          label="Require manager for large discounts"
          checked={settings.requireManagerForDiscount}
          onChange={(v) => update({ requireManagerForDiscount: v })}
        />
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <label className="text-sm text-gray-700 block mb-2">Discount threshold % (manager required above)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.discountThresholdPct}
            onChange={(e) => update({ discountThresholdPct: Number(e.target.value) || 0 })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          />
        </div>
        <Toggle label="Require manager for voids" checked={settings.requireManagerForVoid} onChange={(v) => update({ requireManagerForVoid: v })} />
        <Toggle label="Require manager for returns" checked={settings.requireManagerForReturn} onChange={(v) => update({ requireManagerForReturn: v })} />
        <Toggle label="Loyalty points enabled" checked={settings.loyaltyEnabled} onChange={(v) => update({ loyaltyEnabled: v })} />
        <Toggle
          label="Auto-open cash drawer on cash sale"
          checked={settings.openDrawerOnCashSale}
          onChange={(v) => update({ openDrawerOnCashSale: v })}
        />
        <p className="text-xs text-gray-500 px-1 -mt-1">
          When off, the drawer will not open automatically after a cash sale. The Open cash drawer button on the sell screen always works.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <label className="text-sm text-gray-700 block mb-2">Drawer pulse strength</label>
          <select
            value={settings.drawerKickStrength || 'gentle'}
            onChange={(e) => update({ drawerKickStrength: e.target.value as PosSettings['drawerKickStrength'] })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="gentle">Low (softer open)</option>
            <option value="normal">Medium</option>
            <option value="strong">High (use if the drawer does not open)</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Cash drawers open with a solenoid pulse, not a slow motor. Use Low for a lighter release. A 12V supply is usually quieter than 24V.
          </p>
        </div>
        <Toggle label="Offline mode (queue sales when offline)" checked={settings.enableOfflineMode} onChange={(v) => update({ enableOfflineMode: v })} />
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-700 font-medium">Barcode scanner</p>
          <p className="text-xs text-gray-400 mt-1">
            USB / serial scanner device is configured by an admin in POS Management → Scanner.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { window.location.href = '/pos/management'; }}
              className="mt-3 px-3 py-2 rounded-lg bg-[#014582] text-white text-xs font-semibold"
            >
              Open scanner settings
            </button>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-700 font-medium">Payment terminal</p>
          <p className="text-xs text-gray-400 mt-1">
            CS30G / card device is enabled or disabled by an admin in POS Management → Payments.
            Off keeps the current manual payment flow.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { window.location.href = '/pos/management'; }}
              className="mt-3 px-3 py-2 rounded-lg bg-[#014582] text-white text-xs font-semibold"
            >
              Open payment settings
            </button>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-700 font-medium">Receipt layout</p>
          <p className="text-xs text-gray-400 mt-1">
            Header, footer, barcode, store details and return policy are edited in POS Management → Receipt.
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = '/pos/management'; }}
            className="mt-3 px-3 py-2 rounded-lg bg-[#014582] text-white text-xs font-semibold"
          >
            Open receipt editor
          </button>
        </div>
        <p className="text-xs text-gray-500 pt-2">
          Terminal CRUD, sales history, returns, receipt template and audit logs are in POS Management (admin).
        </p>
      </div>
    </div>
  );
}
