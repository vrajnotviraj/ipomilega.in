'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { popupIsDue } from '@/components/subscribe/popup-memory';

// The dialog's code loads only when it is about to open, so it stays out of every page's first load.
const SubscribeDialog = dynamic(() => import('@/components/subscribe/SubscribeDialog').then((mod) => mod.SubscribeDialog), { ssr: false });

const DELAY_MS = 12_000;
const RETRY_MS = 2000;

/** True while another modal (the home tour, a calculator) is open, so the popup never stacks on top of one. */
const modalIsOpen = () => !!document.querySelector('[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"]');

/**
 * Opens the IPO alerts signup a few seconds into a visit, unless this browser has subscribed or closed it this week.
 * `?alerts` in the URL opens it at once, for testing on staging.
 */
export function SubscribePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).has('alerts');
    if (!forced && (pathname.startsWith('/unsubscribe') || !popupIsDue())) return;

    let timer = 0;
    const tryOpen = () => {
      if (modalIsOpen()) timer = window.setTimeout(tryOpen, RETRY_MS);
      else setOpen(true);
    };
    timer = window.setTimeout(tryOpen, forced ? 0 : DELAY_MS);
    return () => window.clearTimeout(timer);
    // Once per page load: moving between pages neither restarts the wait nor reopens it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return open ? <SubscribeDialog onClose={() => setOpen(false)} /> : null;
}
