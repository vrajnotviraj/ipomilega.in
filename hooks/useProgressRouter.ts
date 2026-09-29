"use client";

import { useRouter } from 'next/navigation';
import { useProgress } from '@/components/progress/ProgressProvider';

/** router.push that starts the progress bar; ProgressProvider finishes it when the route changes. */
export const useProgressRouter = () => {
  const router = useRouter();
  const { startProgress } = useProgress();

  const push = (href: string) => {
    startProgress();
    router.push(href);
  };

  return { push };
};
