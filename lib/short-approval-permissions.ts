/** Curated approval gates — managed on /users/approvals-permissions (role-wise). */
export const SHORT_APPROVAL_PERMISSIONS: Array<{
  key: string;
  title: string;
  detail: string;
}> = [
  {
    key: 'import.rfqs.approve',
    title: 'Import RFQs → Approve',
    detail: 'Approve awarded supplier quotations before PO conversion',
  },
  {
    key: 'import.customs.assess',
    title: 'Customs Assessment → Approve',
    detail:
      'Confirm duty assessment after a maker sends the clearance for assessment (Under Assessment → Assessed)',
  },
  {
    key: 'import.customs.record_payment',
    title: 'Customs Duty Payment → Record',
    detail:
      'Record duty payment after a maker sends the clearance for payment (Pending Payment → Duty Paid)',
  },
  {
    key: 'import.customs.approve',
    title: 'Customs Clearance & Port Formalities → Approve',
    detail: 'Approve duty-paid clearances before release / out-of-charge',
  },
];

export const SHORT_APPROVAL_KEYS = SHORT_APPROVAL_PERMISSIONS.map((p) => p.key);
