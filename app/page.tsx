import { redirect } from 'next/navigation';

/** App root → login (token check is in proxy; logged-in users go to dashboard there) */
export default function Home() {
  redirect('/login');
}
