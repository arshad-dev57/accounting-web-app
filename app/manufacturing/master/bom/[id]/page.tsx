'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bomService } from '@/lib/manufacturing-service';
import { MfgBomEditor } from '../../../_components/MfgBomEditor';
import { MfgPage, MfgLoading, MfgError } from '../../../ui';

export default function BomDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const [bom, setBom] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    bomService.get(id).then(setBom).catch((e: any) => setError(e.message || 'Failed to load BOM')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error || !bom) return <MfgPage><MfgError message={error || 'BOM not found'} /></MfgPage>;
  return <MfgBomEditor initial={bom} />;
}
