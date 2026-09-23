'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  Wallet,
  ArrowRight,
  Printer,
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRWorkflowNotice } from '../ui';
import { hrDashboardService, hrEmployeesService } from '@/lib/hr-employees-service';
import { openReportPrintPreview } from '@/lib/hr-reports-generator';

const REPORT_CATALOG = [
  {
    category: 'Payroll Reports',
    reports: [
      { id: 'payroll_summary', label: 'Payroll Summary Report', desc: 'Period gross earnings, tax withholdings, deductions, and net payable' },
      { id: 'pay_register', label: 'Detailed Pay Register', desc: 'Employee-wise salary register with allowances and deductions breakdown' },
      { id: 'tax_report', label: 'Income Tax & Statutory Report', desc: 'Monthly income tax withholdings, EOBI, and provident fund details' },
    ],
  },
  {
    category: 'Workforce & HR Reports',
    reports: [
      { id: 'employee_directory', label: 'Employee Master Directory', desc: 'Active employee roster, departments, designations, and contact data' },
      { id: 'lifecycle_history', label: 'Employee Lifecycle & Progression', desc: 'Joinings, confirmations, promotions, transfers, and exits log' },
      { id: 'expiring_docs', label: 'Expiring Documents Report', desc: 'CNIC, passport, contract, and compliance document expiry schedule' },
    ],
  },
  {
    category: 'Attendance & Leave Reports',
    reports: [
      { id: 'attendance_summary', label: 'Attendance & Punctuality Summary', desc: 'Present, absent, late check-ins, and shift compliance metrics' },
      { id: 'leave_utilization', label: 'Leave Utilization & Balances', desc: 'Casual, sick, annual leave balances and leave request logs' },
    ],
  },
];

export default function ReportsPage() {
  const [total, setTotal] = React.useState(0);
  const [employees, setEmployees] = React.useState<any[]>([]);

  React.useEffect(() => {
    hrEmployeesService.list().then(setEmployees).catch(() => {});
    hrDashboardService.overview().then((d) => setTotal(Number(d.totalEmployees || 0))).catch(() => {});
  }, []);

  const handleQuickPrintDirectory = () => {
    const rows = employees.map((e) => ({
      code: e.employeeCode || '—',
      name: e.name || '—',
      department: e.department || 'General',
      designation: e.designation || 'Staff',
      office: e.officeName || 'Head Office',
      status: e.status || 'Active',
    }));

    openReportPrintPreview({
      title: 'Employee Master Directory Report',
      subtitle: 'Official workforce roster and organization assignments',
      filterSummary: `Total Active Staff: ${employees.length}`,
      columns: [
        { key: 'code', label: 'Employee Code' },
        { key: 'name', label: 'Employee Name' },
        { key: 'department', label: 'Department' },
        { key: 'designation', label: 'Designation' },
        { key: 'office', label: 'Office Branch' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      summaryCards: [
        { label: 'Total Employees', value: employees.length },
        { label: 'Report Status', value: 'Authoritative' },
      ],
      includeSignature: true,
    });
  };

  return (
    <HRPage>
      <HRPageHeader
        title="HR & Payroll Reports Center"
        subtitle="Generate executive corporate reports, workforce rosters, payroll registers, and compliance documentation."
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={handleQuickPrintDirectory}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Employee Directory
          </button>
        }
      />

      <HRWorkflowNotice
        title="Enterprise Corporate Reporting"
        detail="All reports pull live authoritative records from the database. Output formatted with tenant branding, headers, parameter scope, page numbers, and optional executive signature blocks."
      />

      {/* Catalog Grid */}
      <div className="space-y-6">
        {REPORT_CATALOG.map((cat) => (
          <HRCard key={cat.category} title={cat.category}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cat.reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-[#DDE4EE] bg-white hover:border-[#014582]/40 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1A1A2E] mb-1">{rep.label}</h4>
                    <p className="text-xs text-[#7A8FA6]">{rep.desc}</p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-[#DDE4EE]/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#014582]">
                      Executive PDF / CSV
                    </span>
                    <Link
                      href={cat.category.includes('Payroll') ? '/hr/reports/payroll' : '/hr/attendance/reports'}
                      className="text-xs font-bold text-[#014582] hover:underline inline-flex items-center gap-1"
                    >
                      Open Report <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </HRCard>
        ))}
      </div>
    </HRPage>
  );
}
