'use client';
import { useState, useEffect } from 'react';
import { posTerminalService, posShiftService } from '../../../lib/pos-service';
import { useLocation } from '../../../lib/location-context';
import { locationService, type Location } from '../../../lib/location-service';
import LocationSelect from '../../../components/LocationSelect';
import { Monitor, ArrowLeft, Plus, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Props { onShiftOpened: (shift: any) => void; isAdmin?: boolean; }

export default function ShiftGate({ onShiftOpened, isAdmin }: Props) {
  const { locationIdForApi, isAllLocations, selectedLocation } = useLocation();
  const [step, setStep] = useState<'terminal' | 'cash'>('terminal');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  // Create terminal inline
  const [showCreateTerminal, setShowCreateTerminal] = useState(false);
  const [newTerminal, setNewTerminal] = useState({ name: '', code: '', locationId: '' });

  const loadTerminals = async () => {
    setLoadingTerminals(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (locationIdForApi) qs.set('locationId', locationIdForApi);
      const res = await posTerminalService.list(qs.toString() || undefined);
      setTerminals(res.data || []);
      if ((res.data || []).length === 0) setShowCreateTerminal(true);
      else setShowCreateTerminal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTerminals(false);
    }
  };

  const createTerminal = async () => {
    if (!newTerminal.name || !newTerminal.code) { setError('Terminal name and code are required'); return; }
    const locId = newTerminal.locationId || locationIdForApi;
    if (!locId) {
      setError('Select a warehouse/shop location for this terminal');
      return;
    }
    setLoading(true);
    try {
      await posTerminalService.create({ ...newTerminal, locationId: locId });
      setShowCreateTerminal(false);
      setNewTerminal({ name: '', code: '', locationId: '' });
      await loadTerminals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectTerminal = (t: any) => {
    setSelectedTerminal(t);
    setStep('cash');
  };

  const openShift = async () => {
    if (!selectedTerminal) { setError('Select a terminal first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await posShiftService.open({ terminalId: selectedTerminal.id, openingCash: parseFloat(openingCash), notes });
      onShiftOpened(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    locationService.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    loadTerminals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationIdForApi]);

  useEffect(() => {
    // If cashier has a suspended shift, offer resume
    posShiftService.getCurrent().then(async (r: any) => {
      const shift = r.data;
      if (shift?.status === 'Suspended') {
        if (confirm('You have a suspended shift. Resume it now?')) {
          try {
            const resumed = await posShiftService.resume(shift.id);
            onShiftOpened(resumed.data || { ...shift, status: 'Open' });
          } catch (e: any) {
            setError(e.message || 'Failed to resume shift');
          }
        }
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-12 max-w-xl w-[90%]">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
          <div className="w-32 h-16 bg-white rounded-xl flex items-center justify-center p-2">
            <Image
              src="/bisontechs.png"
              alt="Bisonstechs"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <p className="text-lg font-extrabold text-gray-900">Bisonstechs</p>
          <p className="text-xs text-gray-500">Point of Sale</p>
        </div>

        <div className="mb-6 flex justify-center">
          <LocationSelect allowAll showManageLink={false} />
        </div>

        {step === 'terminal' ? (
          <>
            <p className="text-gray-500 text-sm text-center mb-6">
              {isAllLocations
                ? 'Select a terminal to begin your shift (all locations)'
                : `Select a terminal at ${selectedLocation?.name || 'this location'}`}
            </p>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            {loadingTerminals ? (
              <div className="text-center text-gray-500 py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading terminals...</p>
              </div>
            ) : showCreateTerminal ? (
              <>
                <p className="text-gray-500 text-sm text-center mb-4">No terminals found. Create one to get started.</p>
                <div className="mb-4">
                  <label className="block text-gray-600 text-xs font-medium mb-2">Terminal Name</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                    value={newTerminal.name}
                    onChange={e=>setNewTerminal(p=>({...p,name:e.target.value}))}
                    placeholder="e.g. Main Counter"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-xs font-medium mb-2">Terminal Code</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                    value={newTerminal.code}
                    onChange={e=>setNewTerminal(p=>({...p,code:e.target.value.toUpperCase()}))}
                    placeholder="e.g. TERM-01"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-xs font-medium mb-2">Location (warehouse / shop)</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                    value={newTerminal.locationId || locationIdForApi || ''}
                    onChange={(e) => setNewTerminal((p) => ({ ...p, locationId: e.target.value }))}
                  >
                    <option value="" className="text-gray-900">Select location…</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id} className="text-gray-900">
                        {l.name} ({l.code}) · {l.type}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#014582] to-[#01366a] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  onClick={createTerminal}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Terminal'}
                </button>
                {terminals.length > 0 && (
                  <button
                    className="w-full py-3.5 rounded-xl border border-gray-200 bg-transparent text-gray-500 text-sm mt-2 hover:bg-gray-50 transition-colors"
                    onClick={()=>setShowCreateTerminal(false)}
                  >
                    Back to list
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {terminals.map((t:any) => (
                    <div
                      key={t.id}
                      className={`p-5 rounded-xl cursor-pointer transition-all border text-center shadow-sm ${
                        selectedTerminal?.id === t.id
                          ? 'bg-[#014582]/10 border-[#014582]'
                          : 'bg-white border-gray-200 hover:bg-sky-50'
                      }`}
                      onClick={()=>selectTerminal(t)}
                    >
                      <Monitor className="w-7 h-7 mx-auto mb-2 text-gray-500" />
                      <div className="text-gray-900 font-semibold text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs mt-1">{t.code}</div>
                      {t.location?.name && (
                        <div className="text-[#014582] text-[10px] mt-1">{t.location.name}</div>
                      )}
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          t.isActive
                            ? 'bg-green-500/15 text-emerald-600 border border-green-500/20'
                            : 'bg-red-500/15 text-red-600 border border-red-500/20'
                        }`}>
                          {t.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <button
                    className="w-full py-3.5 rounded-xl border border-gray-200 bg-transparent text-gray-500 text-sm mt-4 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => setShowCreateTerminal(true)}
                  >
                    <Plus className="w-4 h-4" /> New Terminal
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <button
              className="flex items-center gap-2 text-gray-500 text-sm mb-4 hover:text-gray-900 transition-colors"
              onClick={() => setStep('terminal')}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <p className="text-gray-900 text-center font-semibold mb-1">{selectedTerminal?.name}</p>
            <p className="text-gray-500 text-xs text-center mb-6">
              {selectedTerminal?.location?.name
                ? `${selectedTerminal.location.name} · Enter opening cash`
                : 'Enter opening cash to start shift'}
            </p>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-600 text-xs font-medium mb-2">Opening Cash</label>
              <input
                type="number"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 text-xs font-medium mb-2">Notes (optional)</label>
              <input
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-[#014582] transition-colors"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift notes"
              />
            </div>
            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#014582] to-[#01366a] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              onClick={openShift}
              disabled={loading}
            >
              {loading ? 'Opening...' : 'Open Shift'}
            </button>
          </>
        )}

        {isAdmin && (
          <a
            href="/pos/management"
            className="flex items-center justify-center gap-2 text-gray-500 text-xs mt-6 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> POS Management
          </a>
        )}
      </div>
    </div>
  );
}
