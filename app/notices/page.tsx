import { redirect } from 'next/navigation';

export default function NoticesIndexPage() {
  redirect('/notices/dashboard');
}
