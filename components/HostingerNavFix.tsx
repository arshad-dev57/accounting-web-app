'use client';

import { useEffect } from 'react';

/**
 * Hostinger (LiteSpeed) often breaks Next.js App Router RSC fetches.
 * Soft navigations then show Chrome's "This page couldn't load"; a hard
 * reload works. In production, use full document loads for in-app links.
 */
export default function HostingerNavFix() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;
      // Allow soft client navigation for keep-alive sidebars (Flutter-style).
      if (anchor.hasAttribute('data-keep-alive-nav')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
