'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/manufacturing/weaving', label: 'Overview', exact: true },
  { href: '/manufacturing/weaving/godown', label: 'Yarn Godown Register' },
  { href: '/manufacturing/weaving/twisting', label: 'Unit 1: Twisting / Coning' },
  { href: '/manufacturing/weaving/warping', label: 'Unit 2: Warping (Beams)' },
  { href: '/manufacturing/weaving/looms', label: 'Unit 3: Looms & Wages' },
];

export function WeavingSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-[#DDE4EE] bg-white p-1 shadow-sm">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              active ? 'bg-[#014582] text-white' : 'text-[#7A8FA6] hover:bg-[#F0F4F8]'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
