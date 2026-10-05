'use client';

import { useEffect, useState } from 'react';
import { BellOff, CircleAlert, LoaderCircle } from 'lucide-react';
import { ArrowLink } from '@/components/ui/ArrowLink';
import { rememberSubscribed } from '@/components/subscribe/popup-memory';

type Status = 'working' | 'done' | 'invalid' | 'error';

const COPY: Record<Status, { title: string; body: (channel: string) => string }> = {
  working: { title: 'Unsubscribing…', body: () => 'This takes a second.' },
  done: { title: "You're unsubscribed", body: (channel) => `You won't get IPO alerts by ${channel} any more. Changed your mind? You can sign up again from any page.` },
  invalid: { title: 'This link has expired', body: () => "We couldn't match this unsubscribe link. Try the unsubscribe link in your most recent alert." },
  error: { title: 'Something went wrong', body: () => 'Connection failed. Please reload this page to try again.' },
};

/** Sends the unsubscribe on load, so the link does it in one tap, and shows the result. */
export function UnsubscribeStatus({ token, channel }: { token: string; channel: 'email' | 'wa' }) {
  const [status, setStatus] = useState<Status>(token ? 'working' : 'invalid');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}&c=${channel}`, { method: 'POST' })
      .then((response) => {
        if (response.ok) {
          // They've seen the signup already; the popup shouldn't ask again.
          rememberSubscribed();
          setStatus('done');
        } else setStatus(response.status === 500 ? 'error' : 'invalid');
      })
      .catch(() => setStatus('error'));
  }, [token, channel]);

  const Icon = status === 'working' ? LoaderCircle : status === 'done' ? BellOff : CircleAlert;
  const copy = COPY[status];

  return (
    <div className="rounded-[18px] border border-border bg-card p-6 text-center sm:p-8" aria-live="polite">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-foreground">
        <Icon className={status === 'working' ? 'size-5 animate-spin' : 'size-5'} strokeWidth={2} />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-[-0.03em] text-balance">{copy.title}</h1>
      <p className="mt-3 text-pretty text-muted-foreground">{copy.body(channel === 'wa' ? 'WhatsApp' : 'email')}</p>
      {status !== 'working' && (
        <ArrowLink href="/ipos" className="mt-6">
          See today&apos;s IPOs
        </ArrowLink>
      )}
    </div>
  );
}
