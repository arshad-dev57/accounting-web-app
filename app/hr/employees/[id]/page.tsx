import { redirect } from 'next/navigation';

/** Legacy employee detail → ERPNext Employee DocType form. */
export default async function LegacyEmployeeDetailRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hr/hr-setup/employee/${id}`);
}
