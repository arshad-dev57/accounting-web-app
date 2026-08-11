'use client';
import { useState, useEffect } from 'react';
import { posTerminalService, posShiftService } from '../../../lib/pos-service';
import { Monitor, ArrowLeft, Plus, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Props { onShiftOpened: (shift: any) => void; isAdmin?: boolean; }

export default function ShiftGate({ onShiftOpened, isAdmin }: Props) {
  const [step, setStep] = useState<'terminal' | 'cash'>('terminal');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  // Create terminal inline
  const [showCreateTerminal, setShowCreateTerminal] = useState(false);
  const [newTerminal, setNewTerminal] = useState({ name: '', code: '' });

  const loadTerminals = async () => {
    setLoadingTerminals(true);
    setError('');
    try {
      const res = await posTerminalService.list();
      setTerminals(res.data || []);
      if ((res.data || []).length === 0) setShowCreateTerminal(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTerminals(false);
    }
  };

  const createTerminal = async () => {
    if (!newTerminal.name || !newTerminal.code) { setError('Terminal name and code are required'); return; }
    setLoading(true);
    try {
      await posTerminalService.create(newTerminal);
      setShowCreateTerminal(false);
      setNewTerminal({ name: '', code: '' });
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
    loadTerminals();
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
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-xl w-[90%] shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-9">
          <div className="w-32 h-16 bg-white rounded-xl flex items-center justify-center p-2">
            <Image
              src="/bisontechs.png"
              alt="Bisonstechs"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <p className="text-lg font-extrabold text-white">Bisonstechs</p>
          <p className="text-xs text-white/50">Point of Sale</p>
        </div>

        {step === 'terminal' ? (
          <>
            <p className="text-gray-400 text-sm text-center mb-6">Select a terminal to begin your shift</p>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            {loadingTerminals ? (
              <div className="text-center text-gray-400 py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading terminals...</p>
              </div>
            ) : showCreateTerminal ? (
              <>
                <p className="text-gray-400 text-sm text-center mb-4">No terminals found. Create one to get started.</p>
                <div className="mb-4">
                  <label className="block text-gray-400 text-xs font-medium mb-2">Terminal Name</label>
                  <input
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f59e0b] transition-colors"
                    value={newTerminal.name}
                    onChange={e=>setNewTerminal(p=>({...p,name:e.target.value}))}
                    placeholder="e.g. Main Counter"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-400 text-xs font-medium mb-2">Terminal Code</label>
                  <input
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f59e0b] transition-colors"
                    value={newTerminal.code}
                    onChange={e=>setNewTerminal(p=>({...p,code:e.target.value.toUpperCase()}))}
                    placeholder="e.g. TERM-01"
                  />
                </div>
                <button
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  onClick={createTerminal}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Terminal'}
                </button>
                {terminals.length > 0 && (
                  <button
                    className="w-full py-3.5 rounded-xl border border-white/12 bg-transparent text-gray-400 text-sm mt-2 hover:bg-white/5 transition-colors"
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
                      className={`p-5 rounded-xl cursor-pointer transition-all border text-center ${
                        selectedTerminal?.id === t.id
                          ? 'bg-[#f59e0b]/20 border-[#f59e0b]'
                          : 'bg-white/4 border-white/8 hover:bg-white/8'
                      }`}
                      onClick={()=>selectTerminal(t)}
                    >
                      <Monitor className="w-7 h-7 mx-auto mb-2 text-gray-400" />
                      <div className="text-white font-semibold text-sm">{t.name}</div>
                      <div className="text-gray-400 text-xs mt-1">{t.code}</div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          t.isActive
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                            : 'bg-red-500/15 text-red-400 border border-red-500/20'
                        }`}>
                          {t.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTerminal && (
                  <button
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold text-sm mt-4 hover:opacity-90 transition-opacity"
                    onClick={()=>setStep('cash')}
                  >
                    Continue →
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      className="w-full py-3.5 rounded-xl border border-white/12 bg-transparent text-gray-400 text-sm mt-2 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                      onClick={()=>setShowCreateTerminal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      New Terminal
                    </button>
                    <button
                      className="w-full py-3.5 rounded-xl border border-[#f59e0b]/40 bg-transparent text-[#fbbf24] text-sm mt-2 hover:bg-[#f59e0b]/10 transition-colors flex items-center justify-center gap-2"
                      onClick={() => window.location.href = '/pos/management'}
                    >
                      <Settings className="w-4 h-4" />
                      POS Management
                    </button>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Back to terminal selection */}
            <div className="flex items-center gap-2.5 mb-6">
              <button
                onClick={()=>setStep('terminal')}
                className="bg-transparent border-none text-gray-400 cursor-pointer text-lg hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-400 text-xs">
                Terminal: <strong className="text-white">{selectedTerminal?.name}</strong>
              </span>
            </div>

            <h2 className="text-white text-xl font-semibold mb-5">Open Shift</h2>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-400 text-xs font-medium mb-2">Opening Cash Amount</label>
              <input
                type="number"
                className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center outline-none focus:border-[#f59e0b] transition-colors"
                value={openingCash}
                onChange={e=>setOpeningCash(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-xs font-medium mb-2">Notes (optional)</label>
              <input
                className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f59e0b] transition-colors"
                value={notes}
                onChange={e=>setNotes(e.target.value)}
                placeholder="Any shift notes..."
              />
            </div>

            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={openShift}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening Shift...
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  Open Shift & Start Selling
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
