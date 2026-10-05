'use client';

import { useId, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { rememberDismissed, rememberSubscribed } from '@/components/subscribe/popup-memory';

type Status = 'idle' | 'sending' | 'done';

// The close button sits on the ink band, so it takes chalk instead of the default muted grey.
const CLOSE_ON_INK =
  '[&_[data-slot=dialog-close]]:text-primary-foreground/75 [&_[data-slot=dialog-close]]:hover:bg-primary-foreground/10 [&_[data-slot=dialog-close]]:hover:text-primary-foreground';

/** The IPO alerts signup: email, WhatsApp number or both. Closing it without signing up snoozes it for a week. */
export function SubscribeDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const ids = { email: useId(), phone: useId(), phoneHint: useId(), error: useId() };

  const close = () => {
    if (status !== 'done') rememberDismissed();
    onClose();
  };

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError('Enter your email or WhatsApp number.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, form: 'popup', page: window.location.pathname }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "We couldn't sign you up. Please try again.");
        setStatus('idle');
        return;
      }
      rememberSubscribed();
      setStatus('done');
    } catch {
      setError('Connection failed. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className={`gap-0 overflow-hidden p-0 sm:max-w-[440px] ${CLOSE_ON_INK}`}>
        <div className="bg-primary px-6 pb-6 pt-7 text-primary-foreground sm:px-7">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground/70">Free IPO alerts</p>
          <DialogTitle className="mt-3 pr-8 type-hero text-[32px] leading-[1] text-balance sm:text-[36px]">
            Know <span className="highlight">before</span> you bid.
          </DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-pretty text-primary-foreground/80">
            One short message on days an IPO opens, closes or lists: GMP, subscription and our score, before bidding starts.
          </DialogDescription>
        </div>

        {status === 'done' ? (
          <div className="flex flex-col items-center px-6 py-8 text-center sm:px-7" aria-live="polite">
            <span className="grid size-12 place-items-center rounded-full bg-score-good/12 text-score-good">
              <Check className="size-6" strokeWidth={2.5} />
            </span>
            <p className="mt-4 font-display text-2xl font-bold tracking-[-0.015em]">You&apos;re in.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {email.trim() ? 'Check your inbox for a welcome email from IPO Milega.' : 'IPO alerts will come to your WhatsApp.'}
            </p>
            <Button onClick={onClose} className="mt-6 h-10 px-6">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={subscribe} noValidate className="grid gap-4 px-6 py-6 sm:px-7">
            <div className="grid gap-1.5">
              <label htmlFor={ids.email} className="text-sm font-medium">
                Email
              </label>
              <Input
                id={ids.email}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={!!error && !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
                aria-describedby={error ? ids.error : undefined}
                className="h-11"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor={ids.phone} className="flex items-baseline justify-between text-sm font-medium">
                WhatsApp number <span className="text-xs font-normal text-muted-foreground">Optional</span>
              </label>
              <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-input bg-card transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                <span className="grid place-items-center border-r border-input bg-secondary px-3 font-mono text-sm tabular-nums text-muted-foreground">+91</span>
                <input
                  id={ids.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-describedby={`${ids.phoneHint}${error ? ` ${ids.error}` : ''}`}
                  className="min-w-0 flex-1 bg-transparent px-3 font-mono text-base tabular-nums outline-none placeholder:font-sans placeholder:text-muted-foreground md:text-sm"
                />
              </div>
              <p id={ids.phoneHint} className="text-xs text-muted-foreground">
                IPO alerts on WhatsApp. Reply STOP anytime.
              </p>
            </div>

            {error && (
              <p id={ids.error} role="alert" className="-mt-1 text-sm text-score-bad">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="group mt-1 inline-flex items-center justify-between gap-3 rounded-full bg-primary py-1.5 pl-5 pr-1.5 text-[15px] font-medium text-primary-foreground outline-none press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
            >
              {status === 'sending' ? 'Signing you up…' : 'Get IPO alerts'}
              <span className="grid size-9 place-items-center rounded-full bg-brand-accent text-primary transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:rotate-45">
                {status === 'sending' ? <LoaderCircle className="size-4 animate-spin" strokeWidth={2} /> : <ArrowUpRight className="size-4" strokeWidth={2} />}
              </span>
            </button>

            <p className="text-center text-xs text-muted-foreground">No spam. Unsubscribe in one tap from any alert.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
