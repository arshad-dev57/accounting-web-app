'use client';

import { useParams, notFound } from 'next/navigation';
import {
  ERPNEXT_REPORT_TYPES,
  type ErpnextReportType,
} from '@/lib/crm-api';
import { QueryReport } from '../../components/QueryReport';

export default function CrmReportPage() {
  const params = useParams();
  const report = String(params?.report || '');
  if (!(ERPNEXT_REPORT_TYPES as readonly string[]).includes(report)) {
    notFound();
  }
  return <QueryReport reportType={report as ErpnextReportType} />;
}
