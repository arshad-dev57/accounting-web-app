// app/enter/page.tsx
// Smart entry: session → dashboard, else → marketing website
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ||
  'https://bisonstechs.com';

export default async function EnterPage() {
  const jar = await cookies();
  const token = jar.get('auth_token')?.value;

  if (!token) {
    redirect(MARKETING_URL);
  }

  const access = jar.get('subscription_access')?.value;
  if (access === '0') {
    redirect('/plans');
  }

  redirect('/dashboard');
}
