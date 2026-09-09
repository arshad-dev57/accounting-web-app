'use client';

import React from 'react';
import { Network } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { ORG_CHART } from '../data';

type Node = { name: string; role: string; children: Node[] };

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
      {node.children.map((c) => (
        <OrgNode key={c.name + c.role} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <HRPage>
      <HRPageHeader
        title="Organization Chart"
        subtitle="Reporting hierarchy"
        backHref="/hr/dashboard"
      />
      <HRWorkflowNotice title="Reporting relationships" detail="The professional flow links each employee’s manager to leave approvals, review ownership, team attendance, and roster visibility." />
      <HRCard>
        <OrgNode node={ORG_CHART as Node} />
      </HRCard>
    </HRPage>
  );
}
