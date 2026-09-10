'use client';

import React from 'react';
import { Network, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

type Node = { name: string; role: string; children?: Node[] };

function OrgNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  return (
    <div className={depth > 0 ? 'pl-6 border-l-2 border-[#DDE4EE] ml-3' : ''}>
      <div className="flex items-center gap-2 bg-white rounded-xl border border-[#DDE4EE] px-3 py-2 mb-2 w-fit hover:border-[#014582]/40 transition-all">
        <div className="w-8 h-8 rounded-lg bg-[#014582]/10 flex items-center justify-center">
          <Network className="w-4 h-4 text-[#014582]" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#1A1A2E]">{node.name}</p>
          <p className="text-[10px] font-semibold text-[#7A8FA6]">{node.role}</p>
        </div>
      </div>
      {(node.children || []).map((c) => (
        <OrgNode key={`${c.name}-${c.role}`} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChartPage() {
  const [tree, setTree] = React.useState<Node | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    hrWorkforceService
      .orgChart()
      .then(setTree)
      .catch((error: any) => toast.error(error.message || 'Failed to load org chart'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HRPage>
      <HRPageHeader title="Organization Chart" subtitle="Built from your employees by department" backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Reporting relationships" detail="Departments and people come from Add Employee. Assign department and designation there to update this chart." />
      <HRCard>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : tree && (tree.children?.length || 0) > 0 ? (
          <OrgNode node={tree} />
        ) : (
          <p className="text-sm text-[#7A8FA6] py-8 text-center">No employees yet — add people first.</p>
        )}
      </HRCard>
    </HRPage>
  );
}
