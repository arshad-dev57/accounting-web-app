'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { routingService } from '@/lib/manufacturing-service';
import { MfgRoutingEditor } from '../../../_components/MfgRoutingEditor';
import { MfgPage, MfgLoading, MfgError } from '../../../ui';

export default function RoutingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const [row, setRow] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    routingService.get(id).then(setRow).catch((e: any) => setError(e.message || 'Failed to load routing')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error || !row) return <MfgPage><MfgError message={error || 'Routing not found'} /></MfgPage>;
  return <MfgRoutingEditor initial={row} />;
}
