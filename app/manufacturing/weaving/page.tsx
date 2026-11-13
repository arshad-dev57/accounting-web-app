'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Factory,
  Package,
  Scissors,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import {
  MfgButton,
  MfgCard,
  MfgError,
  MfgLoading,
  MfgPage,
  MfgPageHeader,
  MfgStatCard,
} from '@/manufacturing/ui';
import {
  fmtQty,
  textileWeavingService,
  type TextileWeavingSummary,
} from '@/lib/textile-weaving-service';
import { TextileWeavingGate } from './_components/TextileWeavingGate';

function OverviewBody() {
  const [data, setData] = useState<TextileWeavingSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await textileWeavingService.summary());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <MfgPage>
        <MfgPageHeader
          title="Textile Weaving"
          subtitle="Yadgar Fabrics production overview"
          icon={<Factory className="w-5 h-5 text-white" />}
        />
        <MfgCard>
          <MfgLoading />
        </MfgCard>
      </MfgPage>
    );
  }

  if (error || !data) {
    return (
      <MfgPage>
        <MfgPageHeader
          title="Textile Weaving"
          subtitle="Yadgar Fabrics production overview"
          icon={<Factory className="w-5 h-5 text-white" />}
        />
        <MfgCard>
          <MfgError message={error || 'No summary data'} />
          <div className="mt-3">
            <MfgButton onClick={() => void load()}>Retry</MfgButton>
          </div>
        </MfgCard>
      </MfgPage>
    );
  }

  const today = data.weaving.todayFabricProduction;

  return (
    <MfgPage>
      <MfgPageHeader
        title="Textile Weaving"
        subtitle="Godown → Twisting → Warping → Looms"
        icon={<Factory className="w-5 h-5 text-white" />}
        actions={
          <MfgButton variant="secondary" onClick={() => void load()}>
            Refresh
          </MfgButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MfgStatCard
          label="Godown Balance"
          value={`${fmtQty(data.godown.totalCartons)} CTN`}
          hint={`${fmtQty(data.godown.totalWeightKg)} Weight KG · ${data.godown.stockLines} lots`}
          icon={Package}
          color="#014582"
          href="/manufacturing/weaving/godown"
        />
        <MfgStatCard
          label="Active Twisting"
          value={data.twisting.activeBatches}
          hint={`Wastage ${fmtQty(data.twisting.totalWastagePercent)}%`}
          icon={Scissors}
          color={data.twisting.totalWastagePercent > 2.5 ? '#E74C3C' : '#0FA3E0'}
          href="/manufacturing/weaving/twisting"
        />
        <MfgStatCard
          label="Warping Beams"
          value={data.warping.warpingBeams}
          hint={`${data.warping.availableBeams} empty Beam #`}
          icon={Layers}
          color="#8E44AD"
          href="/manufacturing/weaving/warping"
        />
        <MfgStatCard
          label="Running Looms"
          value={data.weaving.runningLooms}
          hint={`${data.weaving.totalLooms} total Loom #`}
          icon={Activity}
          color="#2ECC71"
          href="/manufacturing/weaving/looms"
        />
        <MfgStatCard
          label="Today Greige (m)"
          value={fmtQty(today.total)}
          hint={`Grade A ${fmtQty(today.gradeA)} · B ${fmtQty(today.gradeB)} · C ${fmtQty(today.gradeC)}`}
          icon={Factory}
          color="#F39C12"
          href="/manufacturing/weaving/looms"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MfgCard title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/manufacturing/weaving/godown?new=1"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm font-semibold text-[#014582] hover:bg-[#F0F4F8]"
            >
              <Plus className="h-4 w-4" />               New Godown CH (DB/P)
            </Link>
            <Link
              href="/manufacturing/weaving/twisting?newBatch=1"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm font-semibold text-[#014582] hover:bg-[#F0F4F8]"
            >
              <Plus className="h-4 w-4" /> Issue Twisting Batch / CH
            </Link>
            <Link
              href="/manufacturing/weaving/warping"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm font-semibold text-[#014582] hover:bg-[#F0F4F8]"
            >
              <Plus className="h-4 w-4" /> New Warping Set
            </Link>
            <Link
              href="/manufacturing/weaving/looms"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm font-semibold text-[#014582] hover:bg-[#F0F4F8]"
            >
              <Plus className="h-4 w-4" /> Daily Loom Production Sheet
            </Link>
          </div>
        </MfgCard>

        <MfgCard title="Today Grade A / B / C (Greige)">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Grade A (Fresh)</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-800">{fmtQty(today.gradeA)} m</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Grade B (Second)</p>
              <p className="mt-1 text-xl font-extrabold text-amber-800">{fmtQty(today.gradeB)} m</p>
            </div>
            <div className="rounded-xl bg-red-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Grade C (Rejection)</p>
              <p className="mt-1 text-xl font-extrabold text-red-800">{fmtQty(today.gradeC)} m</p>
            </div>
          </div>
        </MfgCard>
      </div>
    </MfgPage>
  );
}

export default function WeavingOverviewPage() {
  return (
    <TextileWeavingGate title="Textile Weaving" subtitle="Production overview">
      <OverviewBody />
    </TextileWeavingGate>
  );
}
