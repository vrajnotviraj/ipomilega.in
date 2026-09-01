// LiveIposSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { IpoSectionProps, HomePageIpoProps } from '@/app/types/homepage'; // Assuming this path
import { LiveIpoCard } from './IpoCard'; // Assuming this path
import { getIpoType } from './ipoFormat';

const BOARD_TABS = ['Mainboard', 'SME'] as const;

export function LiveIposSection({ ipos, count }: IpoSectionProps) {
  const [activeTab, setActiveTab] = useState<typeof BOARD_TABS[number]>('Mainboard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const filteredIpos = ipos.filter(
    (item) => getIpoType(item.ipo) === activeTab
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // Mobile
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) { // Tablet
        setItemsPerPage(2);
      } else { // Desktop
        setItemsPerPage(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(filteredIpos.length / itemsPerPage);

  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerPage, activeTab]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + totalPages) % totalPages);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) { // Swiped left
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) { // Swiped right
      prevSlide();
    }
  };

  return (
    <section className='py-15'>
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground flex items-center gap-3">
            <span>IPOs open now</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wide text-destructive">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></span>
              Live
            </span>
          </h2>
          <Link
            href="/ipos?filter=live"
            aria-label={`View all ${count} live IPOs`}
            className="text-foreground font-sans hover:text-primary font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="flex items-center gap-6 mt-4 border-b border-border">
          {BOARD_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 -mb-px text-sm font-medium font-sans border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        {filteredIpos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center py-6 bg-card rounded-xl shadow-sm border border-border max-w-sm w-full mx-4">
              <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-base font-medium font-sans">No live {activeTab} IPOs at the moment</p>
              <p className="text-muted-foreground/70 text-sm mt-2 font-sans">Check back soon for new opportunities!</p>
            </div>
          </div>
        ) : (
          <div className="relative px-0 sm:px-14">
            {totalPages > 1 && (
              <button
                onClick={prevSlide}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-card hover:bg-accent text-foreground/80 hover:text-foreground w-10 h-10 rounded-full shadow-sm transition-all duration-200 border border-border"
                aria-label="Previous IPOs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100 / totalPages}%)`, width: `${totalPages * 100}%` }}
              >
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                  <div key={pageIndex} className="w-full flex-shrink-0" style={{ width: `${100 / totalPages}%` }}>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredIpos.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((ipo: HomePageIpoProps) => (
                        <LiveIpoCard key={ipo._id} ipo={ipo.ipo} analysis={ipo.analysis} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <button
                onClick={nextSlide}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-card hover:bg-accent text-foreground/80 hover:text-foreground w-10 h-10 rounded-full shadow-sm transition-all duration-200 border border-border"
                aria-label="Next IPOs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {totalPages > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-6 mt-6">
                <button
                  onClick={prevSlide}
                  className="bg-card hover:bg-accent text-foreground/80 hover:text-foreground p-3 rounded-full shadow-sm transition-all duration-200 border border-border"
                  aria-label="Previous IPOs"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="bg-card hover:bg-accent text-foreground/80 hover:text-foreground p-3 rounded-full shadow-sm transition-all duration-200 border border-border"
                  aria-label="Next IPOs"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
