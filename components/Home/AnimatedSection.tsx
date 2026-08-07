"use client";

import { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'slideUp' | 'slideLeft' | 'slideRight' | 'fadeScale';
  delay?: number;
  className?: string;
  threshold?: number; // Add threshold prop for more control
}

export function AnimatedSection({
  children,
  animation = 'slideUp',
  delay = 0,
  className = '',
  threshold = 0.1
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (entry.isIntersecting) {
          // Element is visible - trigger animation after delay
          timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
          }, delay);
        } else {
          // Element is not visible - reset animation immediately
          setIsVisible(false);
        }
      },
      {
        threshold,
        // Add some margin to trigger slightly before/after element is visible
        rootMargin: '50px 0px -50px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, threshold]);

  const animationClasses = {
    slideUp: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    slideLeft: isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    slideRight: isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
    fadeScale: isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
  };

  return (
    <div
      ref={ref}
      className={`transform transition-all duration-1000 ease-out ${animationClasses[animation]} ${className}`}
    >
      {children}
    </div>
  );
}