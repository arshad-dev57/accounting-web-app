import { redirect } from 'next/navigation';

/** App root → smart entry (session → dashboard, else marketing site) */
export default function Home() {
  redirect('/enter');
}
