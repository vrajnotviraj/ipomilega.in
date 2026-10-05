'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { rememberSubscribed } from '@/components/subscribe/popup-memory';

/** Email signup panel that posts to /api/subscription and reports the result in a toast. */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, form: 'home', page: window.location.pathname }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "We couldn't subscribe you. Please try again.");
        return;
      }
      toast.success(data.message || "You're in. Check your inbox for a welcome email.");
      rememberSubscribed();
      setEmail('');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Connection failed. Please try again.');
    }
  };

  return (
    <div className="mt-12 flex flex-col gap-5 rounded-[18px] bg-secondary p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">Get IPO updates by email</h2>
        <p className="mt-1 text-muted-foreground">New analyses and GMP moves, sent straight to your inbox.</p>
      </div>
      <form onSubmit={subscribe} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
        <Input
          type="email"
          required
          aria-label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          className="bg-card"
        />
        <Button type="submit" className="w-full sm:w-auto">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
