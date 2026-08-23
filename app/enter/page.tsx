// Marketing CTAs land here: session → dashboard, else login
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function EnterPage() {
  const jar = await cookies();
  const token = jar.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const access = jar.get('subscription_access')?.value;
  if (access === '0') {
    redirect('/plans');
  }

  redirect('/dashboard');
}
