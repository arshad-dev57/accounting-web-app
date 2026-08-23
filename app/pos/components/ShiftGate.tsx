'use client';
import { useState, useEffect } from 'react';
import { posTerminalService, posShiftService } from '../../../lib/pos-service';
import { useLocation } from '../../../lib/location-context';
import LocationSelect from '../../../components/LocationSelect';
import { Monitor, ArrowLeft, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Props { onShiftOpened: (shift: any) => void; isAdmin?: boolean; }

export default function ShiftGate({ onShiftOpened, isAdmin }: Props) {
  const { locationIdForApi, isAllLocations, selectedLocation } = useLocation();
  const [step, setStep] = useState<'terminal' | 'cash'>('terminal');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  const loadTerminals = async () => {
    setLoadingTerminals(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (locationIdForApi) qs.set('locationId', locationIdForApi);
      const res = await posTerminalService.list(qs.toString() || undefined);
      setTerminals(res.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTerminals(false);
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
    <div className="min-h-screen flex items-center justify-center bg-[#014582]">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-6 sm:p-12 max-w-xl w-[92%] my-6">
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
          <p className="text-xl font-extrabold text-[#014582]">Bisonstechs</p>
          <p className="text-sm font-medium text-gray-600">Point of Sale</p>
        </div>

        <div className="mb-6 flex justify-center">
          <LocationSelect allowAll showManageLink={false} />
        </div>

        {step === 'terminal' ? (
          <>
            <p className="text-gray-700 text-base text-center mb-6">
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
            ) : terminals.length === 0 ? (
              <div className="text-center py-8 px-2">
                <Monitor className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-800 font-semibold text-sm mb-1">No terminal assigned here</p>
                <p className="text-gray-500 text-sm">
                  {isAdmin
                    ? 'Create a terminal in POS Management, then come back to open a shift.'
                    : 'Ask an admin to create a terminal for this store in POS Management.'}
                </p>
                {isAdmin && (
                  <a
                    href="/pos/management"
                    className="inline-flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-[#014582] text-white text-sm font-semibold hover:opacity-90"
                  >
                    <Settings className="w-4 h-4" /> Open POS Management
                  </a>
                )}
              </div>
            ) : (
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
