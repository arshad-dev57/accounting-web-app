'use client';
import { useState, useEffect } from 'react';
import { posShiftService } from '../../lib/pos-service';
import ShiftGate from './components/ShiftGate';
import POSLayout from './components/POSLayout';
import SellScreen from './components/SellScreen';

import { useRouter } from 'next/navigation';
import { usePermissions } from '../../lib/usePermissions';

export default function POSPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = usePermissions();
  const [activeShift, setActiveShift] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const loadShift = async () => {
    setLoading(true);
    try {
      const res = await posShiftService.getCurrent();
      let shift = res.data || null;
      if (shift?.status === 'Suspended') {
        try {
          const resumed = await posShiftService.resume(shift.id);
          shift = resumed.data || { ...shift, status: 'Open' };
        } catch {
          // keep suspended; user can resume from Shifts tab after opening
        }
      }
      setActiveShift(shift?.status === 'Open' ? shift : null);
    } catch {
      setActiveShift(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadShift();
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0f1a' }}>
        <div style={{ textAlign:'center' }}>
          <div className="pos-spinner" />
          <p style={{ color:'#8b8fa8', marginTop:'16px', fontFamily:'Inter, sans-serif' }}>Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (!activeShift) {
    return <ShiftGate onShiftOpened={(shift) => setActiveShift(shift)} isAdmin={isAdmin} />;
  }

  return (
    <POSLayout shift={activeShift} onShiftClose={() => setActiveShift(null)}>
      <SellScreen shift={activeShift} />
    </POSLayout>
  );
}
