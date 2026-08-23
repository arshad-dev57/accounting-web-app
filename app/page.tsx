import { redirect } from 'next/navigation';

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ||
  'https://bisonstechs.com';

/** Fallback if proxy does not run: marketing site first. Session routing is in proxy. */
export default function Home() {
  redirect(MARKETING_URL);
}
