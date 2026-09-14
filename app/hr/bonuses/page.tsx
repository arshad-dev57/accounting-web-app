'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell, HRStatusBadge, HRWorkflowNotice } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

export default function BonusesPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [commissionPct, setCommissionPct] = React.useState(5);
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  React.useEffect(() => {
    hrEmployeesService.list().then(setEmployees).catch(() => {});
    hrWorkforceService
      .settings()
      .then((s: any) => setCommissionPct(Number(s.salesCommissionPct || 5)))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="px-4 pt-4 max-w-6xl mx-auto">
        <HRWorkflowNotice
          title="Sales → Commission → Payroll"
          detail={`1) Enter the salesman's sales amount (kind = sales). Commission auto ≈ ${commissionPct}% from Settings. 2) Approve. 3) Payroll → Calculate — commission is added to the slip. Zero sales + sales role → no-sale cut (Settings).`}
          action={
            <Link href="/hr/payroll" className="text-[11px] font-extrabold text-[#014582]">
              Open Payroll →
            </Link>
          }
        />
      </div>
      <HcmCrudPage
        title="Bonuses & sales commission"
        subtitle="Commission from sales amount, or a normal bonus"
        notice={`Kind = sales → enter sales amount; commission ${commissionPct}% is calculated automatically. Approve, then run Payroll Calculate.`}
        columns={['Employee', 'Kind', 'Sales / Amount', 'Period', 'Status', '']}
        load={() => hrHcmService.bonuses()}
        create={async (input) => {
          const employeeId = String(input.employeeId).split('|')[0];
          const kind = String(input.kind || 'performance');
          const salesAmount = Number(input.salesAmount || 0);
          let amount = Number(input.amount || 0);
          if ((kind === 'sales' || kind === 'commission') && salesAmount > 0 && !(amount > 0)) {
            amount = Math.round(((salesAmount * commissionPct) / 100) * 100) / 100;
          }
          return hrHcmService.saveBonus({
            employeeId,
            kind,
            amount,
            salesAmount: salesAmount || undefined,
            period: input.period || period,
            reason: String(input.reason || ''),
          });
        }}
        fields={[
          { key: 'employeeId', label: 'Employee', options: employees.map((e) => `${e.id}|${e.name}`) },
          {
            key: 'kind',
            label: 'Kind',
            options: ['sales', 'commission', 'performance', 'attendance', 'target', 'special'],
          },
          { key: 'salesAmount', label: 'Sales amount (Rs) — for sales/commission', type: 'number' },
          { key: 'amount', label: 'Commission / bonus amount (blank = auto from sales %)', type: 'number' },
          { key: 'period', label: 'Payroll period (YYYY-MM)' },
          { key: 'reason', label: 'Note' },
        ]}
        rowCells={(r) => {
          let salesLabel = '';
          try {
            const j = JSON.parse(r.reason || '');
            if (j?.salesAmount) salesLabel = `Sales ${Number(j.salesAmount).toLocaleString()}`;
          } catch {
            /* ignore */
          }
          return (
            <>
              <HRTableCell className="font-bold">{r.employee}</HRTableCell>
              <HRTableCell>{r.kind}</HRTableCell>
              <HRTableCell>
                {salesLabel ? (
                  <span>
                    {salesLabel}
                    <span className="block text-[10px] text-[#2ECC71] font-bold">Comm {r.amount}</span>
                  </span>
                ) : (
                  r.amount
                )}
              </HRTableCell>
              <HRTableCell>{r.period}</HRTableCell>
              <HRTableCell>
                <HRStatusBadge status={r.status} />
              </HRTableCell>
              <HRTableCell>
                {r.status === 'Pending' && (
                  <button
                    type="button"
                    className="text-[11px] font-bold text-[#014582]"
                    onClick={async () => {
                      try {
                        await hrHcmService.updateBonus(r.id, 'Approved');
                        toast.success('Approved — included on next Sales payroll Calculate');
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    Approve
                  </button>
                )}
              </HRTableCell>
            </>
          );
        }}
      />
    </>
  );
}
