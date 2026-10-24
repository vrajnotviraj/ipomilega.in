'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/client';

/** Email signup panel that posts to /api/subscription and reports the result in a toast. */
export function NewsletterSignup() {
  const d = useT().home.newsletter;
  const [email, setEmail] = useState('');

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || d.failed);
        return;
      }
      toast.success(data.message || d.subscribed);
      setEmail('');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error(d.connectionFailed);
    }
  };

  return (
    <div className="mt-12 flex flex-col gap-5 rounded-[18px] bg-secondary p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">{d.title}</h2>
        <p className="mt-1 text-muted-foreground">{d.lead}</p>
      </div>
      <form onSubmit={subscribe} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
        <Input
          type="email"
          required
          aria-label={d.emailLabel}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={d.placeholder}
          className="bg-card"
        />
        <Button type="submit" className="w-full sm:w-auto">
          {d.subscribe}
        </Button>
      </form>
    </div>
  );
}
