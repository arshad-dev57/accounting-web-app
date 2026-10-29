import { redirect } from 'next/navigation';

/** Legacy employee edit → ERPNext Employee DocType form. */
export default async function LegacyEmployeeEditRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hr/hr-setup/employee/${id}`);
}
